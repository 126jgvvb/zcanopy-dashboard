
 "use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { useAuth } from "@/components/AuthProvider";
import { Search, Ban, RotateCcw } from "lucide-react";

/** A reversal the payment provider rejected: the escrow sweep retries it. */
const REVERSAL_FAILED = "REVERSAL_FAILED";
/** A failed reversal whose retries an admin has stopped. */
const REVERSAL_STOPPED = "REVERSAL_STOPPED";

const STATUSES = [
  "all",
  "SUCCESS",
  "PENDING",
  "FAILED",
  REVERSAL_FAILED,
  REVERSAL_STOPPED,
] as const;

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  SUCCESS: "Success",
  PENDING: "Pending",
  FAILED: "Failed",
  [REVERSAL_FAILED]: "Reversal failed",
  [REVERSAL_STOPPED]: "Retries stopped",
};

const currency = (n: number) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

export default function TransactionsPage() {
  const { admin } = useAuth();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [search, setSearch] = useState("");
  // The failed reversal an admin is about to stop (with an optional reason).
  const [stopTarget, setStopTarget] = useState<any>(null);
  const [stopReason, setStopReason] = useState("");
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const tx = useAdminData(
    (token) => adminApi.transactions(token, page, 20),
    [page],
  );

  const stopRetries = async () => {
    if (!stopTarget) return;
    const token = admin?.token || "";
    const bookingCode = String(stopTarget.transactionCode || "");
    setActionBusy(bookingCode);
    setActionNotice(null);
    try {
      const res: any = await adminApi.stopBookingReversal(
        token,
        bookingCode,
        stopReason.trim(),
      );
      setActionNotice({
        tone: "ok",
        text: res?.message || `The retries for booking ${bookingCode} were stopped.`,
      });
      setStopTarget(null);
      setStopReason("");
      tx.reload();
    } catch (err) {
      setActionNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "Could not stop the retries.",
      });
    } finally {
      setActionBusy(null);
    }
  };

  const resumeRetries = async (row: any) => {
    const token = admin?.token || "";
    const bookingCode = String(row.transactionCode || "");
    setActionBusy(bookingCode);
    setActionNotice(null);
    try {
      const res: any = await adminApi.resumeBookingReversal(token, bookingCode);
      setActionNotice({
        tone: "ok",
        text: res?.message || `The retries for booking ${bookingCode} resumed.`,
      });
      tx.reload();
    } catch (err) {
      setActionNotice({
        tone: "error",
        text: err instanceof Error ? err.message : "Could not resume the retries.",
      });
    } finally {
      setActionBusy(null);
    }
  };

  /** A reversal the escrow sweep retries. The status identifies it on its
      own, so the console does not depend on the extra API fields. */
  const isReversal = (t: any) =>
    t?.isEscrowReversal === true ||
    t?.provider === "iotec-mobile-money-reversal" ||
    t?.status === REVERSAL_FAILED ||
    t?.status === REVERSAL_STOPPED;

  const filtered = (tx.data?.transactions ?? []).filter((t: any) => {
    if (status !== "all" && t.status !== status) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      t.recipientName?.toLowerCase().includes(query) ||
      t.reason?.toLowerCase().includes(query) ||
      t.referenceNumber?.toLowerCase().includes(query)
    );
  });

  /** How many times this reversal has failed. Falls back to counting the
      rows on this page when the API does not report it. */
  const failureCountFor = (row: any): number => {
    if (row?.reversalFailureCount) return row.reversalFailureCount;
    const code = String(row?.transactionCode || "");
    if (!code) return 0;
    return filtered.filter(
      (r: any) =>
        String(r?.transactionCode || "") === code && r?.status === REVERSAL_FAILED,
    ).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-all sm:px-4 sm:py-1.5 filter-btn ${
                status === s
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={status === s ? { backgroundColor: "var(--zcanopy-primary)" } : {}}
            >
              {STATUS_LABELS[s] ?? s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by recipient, reason or ref"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      {actionNotice ? (
        <p
          role="status"
          className={`rounded-xl border px-4 py-3 text-sm ${
            actionNotice.tone === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-700"
          }`}
        >
          {actionNotice.text}
        </p>
      ) : null}

      <Panel title={`All Transactions (${filtered.length})`}>
        {tx.loading ? (
          <LoadingState label="Loading transactions" />
        ) : tx.error ? (
          <ErrorState message={tx.error} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No transactions.</p>
        ) : (
          <div className="responsive-table-wrap">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Recipient</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((t: any) => (
                  <tr key={t.id} className="hover:bg-[#D1A054]/5 transition-colors">
                    <td className="py-2.5 pr-4 text-gray-500">
                      {t.date ? new Date(t.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{t.recipientName}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{t.reason}</td>
                    <td className="py-2.5 pr-4 font-semibold">
                      {currency(t.amount)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          t.status === "SUCCESS"
                            ? "bg-green-100 text-green-700"
                            : t.status === "PENDING"
                              ? "bg-amber-100 text-amber-700"
                              : t.status === REVERSAL_STOPPED
                                ? "bg-gray-200 text-gray-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.status}
                      </span>
                      {isReversal(t) && failureCountFor(t) > 0 ? (
                        <p className="mt-1 text-[11px] text-gray-400">
                          failed {failureCountFor(t)}× — every sweep retries it
                        </p>
                      ) : null}
                      {isReversal(t) && t.transactionCode ? (
                        t.status === REVERSAL_STOPPED ? (
                          <button
                            type="button"
                            onClick={() => resumeRetries(t)}
                            disabled={actionBusy === String(t.transactionCode)}
                            className="mt-1 inline-flex items-center gap-1 rounded-lg border border-[var(--zcanopy-border)] px-2 py-1 text-[11px] font-medium text-[var(--zcanopy-card-brown)] transition-colors hover:border-[var(--zcanopy-primary)] disabled:opacity-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            {actionBusy === String(t.transactionCode)
                              ? "Working..."
                              : "Resume retries"}
                          </button>
                        ) : t.status === REVERSAL_FAILED ? (
                          <button
                            type="button"
                            onClick={() => {
                              setStopTarget(t);
                              setStopReason("");
                              setActionNotice(null);
                            }}
                            disabled={actionBusy === String(t.transactionCode)}
                            className="mt-1 inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                          >
                            <Ban className="h-3 w-3" />
                            Stop retrying
                          </button>
                        ) : null
                      ) : null}
                    </td>
                    <td className="py-2.5 text-xs text-gray-400">
                      {t.referenceNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {stopTarget ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">
              Stop the reversal retries?
            </h3>
            <p className="mt-2 text-sm text-[var(--zcanopy-muted)]">
              The escrow sweep will no longer try to pay this booking back, so it
              stops calling the payment provider every 15 minutes for a
              disbursement that keeps being rejected. The funds stay held until
              an admin deals with the booking by hand.
            </p>
            <dl className="mt-3 space-y-1 rounded-xl bg-[var(--zcanopy-table-head)] px-3 py-2 text-xs text-[var(--zcanopy-muted)]">
              <div className="flex justify-between gap-3">
                <dt>Booking</dt>
                <dd className="font-medium text-[var(--zcanopy-card-brown)]">
                  {String(stopTarget.transactionCode || "—")}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Amount</dt>
                <dd className="font-medium text-[var(--zcanopy-card-brown)]">
                  {currency(stopTarget.amount)}
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>Failed attempts</dt>
                <dd className="font-medium text-[var(--zcanopy-card-brown)]">
                  {stopTarget.reversalFailureCount || 0}
                </dd>
              </div>
            </dl>
            <label
              htmlFor="stop-reversal-reason"
              className="mt-4 block text-xs font-medium text-[var(--zcanopy-card-brown)]"
            >
              Reason (optional)
            </label>
            <input
              id="stop-reversal-reason"
              value={stopReason}
              onChange={(e) => setStopReason(e.target.value)}
              placeholder="e.g. the customer's mobile money account is closed"
              className="mt-1 w-full rounded-xl border border-[var(--zcanopy-border)] bg-white px-3 py-2 text-sm outline-none transition focus:border-[var(--zcanopy-primary)]"
            />
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStopTarget(null)}
                disabled={actionBusy !== null}
                className="rounded-xl border border-[var(--zcanopy-border)] px-4 py-2 text-sm font-medium text-[var(--zcanopy-card-brown)] transition-colors hover:border-[var(--zcanopy-primary)] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={stopRetries}
                disabled={actionBusy !== null}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {actionBusy ? "Stopping..." : "Stop the retries"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="flex justify-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-2 text-sm text-gray-500">Page {page}</span>
        <button
          disabled={(tx.data?.transactions?.length ?? 0) < 20}
          onClick={() => setPage((p) => p + 1)}
          className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
