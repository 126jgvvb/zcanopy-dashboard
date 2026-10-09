/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { Search } from "lucide-react";

const STATUSES = ["all", "SUCCESS", "PENDING", "FAILED"] as const;

const currency = (n: number) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

export default function TransactionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [search, setSearch] = useState("");

  const tx = useAdminData(
    (token) => adminApi.transactions(token, page, 20),
    [page],
  );

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
              {s === "all" ? "All" : s === "SUCCESS" ? "Success" : s === "PENDING" ? "Pending" : "Failed"}
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
                              : "bg-red-100 text-red-700"
                        }`}
                      >
                        {t.status}
                      </span>
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
