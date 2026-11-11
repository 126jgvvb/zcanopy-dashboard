/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import {
  useAdminData,
  Panel,
  LoadingState,
  ErrorState,
} from "@/components/ui";
import { adminApi, ApiError, formatDate } from "@/lib/api";
import { COLORS, can } from "@/lib/theme";
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  BadgeCheck,
  FileText,
  Phone,
} from "lucide-react";

interface LandlordVerification {
  id: string;
  brokerId: string;
  brokerCode: string;
  brokerName: string;
  brokerEmail: string;
  landlordFullName: string;
  landlordNin: string;
  landlordPhoneNumber: string;
  landlordEmail: string;
  mzoDistrict: string;
  tenureType: string;
  countyDivision: string;
  blockNumber: string;
  plotNumber: string;
  volumeNumber: string;
  folioNumber: string;
  leaseExpiryDate: string;
  subCountyVillage: string;
  ccoRefNumber: string;
  instrumentNumber: string;
  rejectionReason: string;
  status: string;
  requiresLandlordAuthorization?: boolean;
  createdAt: string;
  updatedAt: string;
}

const STATUS_TABS = ["all", "pending", "approved", "rejected"] as const;

function tenureLocationSummary(v: LandlordVerification): string {
  const parts: string[] = [];
  if (v.countyDivision) parts.push(v.countyDivision);
  if (v.volumeNumber) parts.push(`VOL ${v.volumeNumber}`);
  if (v.folioNumber) parts.push(`FOLIO ${v.folioNumber}`);
  if (v.blockNumber) parts.push(`BLK ${v.blockNumber}`);
  if (v.plotNumber) parts.push(`PLT ${v.plotNumber}`);
  if (v.subCountyVillage) parts.push(v.subCountyVillage);
  if (v.ccoRefNumber) parts.push(v.ccoRefNumber);
  return parts.length ? parts.join(" · ") : "—";
}

function statusBadge(status: string) {
  if (status === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        <CheckCircle className="h-3 w-3" /> Approved
      </span>
    );
  }
  if (status === "rejected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
        <XCircle className="h-3 w-3" /> Rejected
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
      <Clock className="h-3 w-3" /> Pending
    </span>
  );
}

export default function LandlordVerificationsPage() {
  const { admin } = useAuth();
  const [tab, setTab] = useState<(typeof STATUS_TABS)[number]>("pending");
  const [search, setSearch] = useState("");

  // Per-row state
  const [instrumentInputs, setInstrumentInputs] = useState<Record<string, string>>({});
  const [reasonInputs, setReasonInputs] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const verifications = useAdminData((token) =>
    adminApi.landlordVerifications(token, 1, 50, tab),
  );

  const canManage = can(admin?.role, "manage_brokers");

  async function handleApprove(v: LandlordVerification) {
    const instrumentNumber = (instrumentInputs[v.id] || v.instrumentNumber || "").trim();
    if (!instrumentNumber) {
      setActionError("Enter the Ministry instrument number before approving — approval only works with it filled in.");
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setActing(`appr-${v.id}`);
    try {
      const res = await adminApi.approveLandlordVerification(admin!.token, v.id, { instrumentNumber });
      setActionSuccess(
        res?.message ||
          "Approved. The landlord is now registered against their NIN, the broker has been notified and can withdraw funds.",
      );
      verifications.reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to approve.");
    } finally {
      setActing(null);
    }
  }

  async function handleReject(v: LandlordVerification) {
    const reason = (reasonInputs[v.id] || "").trim();
    if (!reason) {
      setActionError("Enter the exact reason the details could not be validated — it is emailed to the broker.");
      return;
    }
    setActionError(null);
    setActionSuccess(null);
    setActing(`rej-${v.id}`);
    try {
      const res = await adminApi.rejectLandlordVerification(admin!.token, v.id, { reason });
      setActionSuccess(res?.message || "Rejected. The broker has been emailed the rejection reason.");
      verifications.reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to reject.");
    } finally {
      setActing(null);
    }
  }

  const rows = (verifications.data?.verifications ?? []).filter((v: any) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      v.landlordFullName?.toLowerCase().includes(query) ||
      v.landlordNin?.toLowerCase().includes(query) ||
      v.landlordPhoneNumber?.includes(query) ||
      v.brokerName?.toLowerCase().includes(query) ||
      v.brokerCode?.toLowerCase().includes(query) ||
      v.mzoDistrict?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--zcanopy-card-brown)]">
          Landlord &amp; Title Verifications
        </h2>
        <p className="text-sm text-[var(--zcanopy-muted)]">
          Landlord identity and property title details submitted by brokers for UgNLIS title searches.
          Record the Ministry instrument number to approve. Approving also registers the landlord against
          their NIN, so any other broker representing the same landlord must obtain the landlord&apos;s
          OTP authorisation and confirm their own NIN before they are verified.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                tab === t ? "text-white shadow-md" : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={tab === t ? { backgroundColor: COLORS.primary } : {}}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search landlord, NIN, broker…"
            className="w-56 bg-transparent text-sm outline-none"
          />
        </div>
      </div>

      {actionError ? <ErrorState message={actionError} /> : null}
      {actionSuccess ? (
        <div className="rounded-2xl border border-green-200/80 bg-green-50/80 px-4 py-3 text-sm text-green-700">
          {actionSuccess}
        </div>
      ) : null}

      <Panel title={`Landlord Verifications (${rows.length})`}>
        {verifications.loading ? (
          <LoadingState label="Loading landlord verifications" />
        ) : verifications.error ? (
          <ErrorState message={verifications.error} />
        ) : rows.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No landlord verifications found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-gray-400">
                <tr>
                  <th className="py-3 pr-4">Broker</th>
                  <th className="py-2 pr-4">Landlord</th>
                  <th className="py-2 pr-4">NIN</th>
                  <th className="py-2 pr-4">Phone</th>
                  <th className="py-2 pr-4">MZO / District</th>
                  <th className="py-2 pr-4">Tenure</th>
                  <th className="py-2 pr-4">Title Location</th>
                  <th className="py-2 pr-4">Instrument No.</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((v: any) => {
                  const isExpanded = expanded === v.id;
                  const instrumentValue = instrumentInputs[v.id] ?? v.instrumentNumber ?? "";
                  const pendingRow = v.status !== "approved";
                  return (
                    <>
                      <tr key={v.id} className="transition-colors hover:bg-[#D1A054]/5">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white"
                              style={{ backgroundColor: COLORS.primary }}
                            >
                              {v.brokerName?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div>
                              <p className="font-medium">{v.brokerName}</p>
                              <p className="text-xs text-gray-400 font-mono">{v.brokerCode}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <p className="font-medium">{v.landlordFullName}</p>
                          <p className="text-xs text-gray-400">
                            Submitted {formatDate(v.createdAt)}
                          </p>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-600">{v.landlordNin}</td>
                        <td className="py-3 pr-4 text-gray-500">{v.landlordPhoneNumber}</td>
                        <td className="py-3 pr-4 text-gray-500">{v.mzoDistrict}</td>
                        <td className="py-2 pr-4">
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                            {v.tenureType === "customary" ? "Customary (CCO)" : v.tenureType}
                          </span>
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-500">{tenureLocationSummary(v)}</td>
                        <td className="py-2 pr-4">
                          {v.status === "approved" ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-mono font-semibold text-green-700">
                              <BadgeCheck className="h-3 w-3" />
                              {v.instrumentNumber || "—"}
                            </span>
                          ) : (
                            <input
                              type="text"
                              placeholder="Enter instrument no."
                              value={instrumentValue}
                              onChange={(e) =>
                                setInstrumentInputs((prev) => ({ ...prev, [v.id]: e.target.value }))
                              }
                              disabled={!canManage || !pendingRow}
                              className="w-32 rounded-lg border border-gray-300 bg-white px-2 py-1.5 font-mono text-xs outline-none focus:border-[var(--zcanopy-primary)] disabled:bg-gray-50 disabled:text-gray-400"
                            />
                          )}
                        </td>
                        <td className="py-2 pr-4">
                          <div className="flex flex-col items-start gap-1">
                            {statusBadge(v.status)}
                            {v.requiresLandlordAuthorization ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                                <Phone className="h-3 w-3" /> Awaiting landlord OTP
                              </span>
                            ) : null}
                          </div>
                        </td>
                        <td className="py-3">
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setExpanded(isExpanded ? null : v.id)}
                              className="hover-gold rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700"
                            >
                              {isExpanded ? "Hide" : "Details"}
                            </button>
                            {pendingRow && canManage ? (
                              <>
                                <button
                                  disabled={acting === `appr-${v.id}` || !instrumentValue.trim()}
                                  onClick={() => handleApprove(v)}
                                  title={
                                    instrumentValue.trim()
                                      ? "Approve and record the instrument number"
                                      : "Fill in the instrument number first"
                                  }
                                  className="hover-gold rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                                  style={{ backgroundColor: COLORS.primary }}
                                >
                                  {acting === `appr-${v.id}` ? "Approving…" : "Approve"}
                                </button>
                                <button
                                  disabled={acting === `rej-${v.id}`}
                                  onClick={() => handleReject(v)}
                                  className="hover-gold rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                                >
                                  {acting === `rej-${v.id}` ? "Declining…" : "Decline"}
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                      {isExpanded ? (
                        <tr key={`${v.id}-details`} className="bg-[#D1A054]/[0.06]">
                          <td colSpan={10} className="px-4 pb-5 pt-1">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                              <div className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Submitted details
                                </p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-500">Full legal name</dt>
                                    <dd className="font-medium">{v.landlordFullName}</dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-500">NIN</dt>
                                    <dd className="font-mono">{v.landlordNin}</dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-500">Landlord phone</dt>
                                    <dd>{v.landlordPhoneNumber}</dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-500">Landlord email</dt>
                                    <dd>{v.landlordEmail || "—"}</dd>
                                  </div>
                                </dl>
                              </div>
                              <div className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-3">
                                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                  Title particulars
                                </p>
                                <dl className="space-y-1 text-xs">
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-500">MZO / District</dt>
                                    <dd className="font-medium">{v.mzoDistrict}</dd>
                                  </div>
                                  <div className="flex justify-between gap-3">
                                    <dt className="text-gray-500">Tenure</dt>
                                    <dd className="capitalize">
                                      {v.tenureType === "customary" ? "Customary (CCO)" : v.tenureType}
                                    </dd>
                                  </div>
                                  {v.countyDivision ? (
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-gray-500">County / Division</dt>
                                      <dd>{v.countyDivision}</dd>
                                    </div>
                                  ) : null}
                                  {v.volumeNumber ? (
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-gray-500">Volume / Folio</dt>
                                      <dd className="font-mono">
                                        {v.volumeNumber} / {v.folioNumber}
                                      </dd>
                                    </div>
                                  ) : null}
                                  {v.blockNumber ? (
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-gray-500">Block / Plot</dt>
                                      <dd className="font-mono">
                                        {v.blockNumber} / {v.plotNumber}
                                      </dd>
                                    </div>
                                  ) : null}
                                  {v.subCountyVillage ? (
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-gray-500">Sub-County &amp; Village</dt>
                                      <dd>{v.subCountyVillage}</dd>
                                    </div>
                                  ) : null}
                                  {v.ccoRefNumber ? (
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-gray-500">CCO Ref</dt>
                                      <dd className="font-mono">{v.ccoRefNumber}</dd>
                                    </div>
                                  ) : null}
                                  {v.leaseExpiryDate ? (
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-gray-500">Lease expiry</dt>
                                      <dd>{formatDate(v.leaseExpiryDate)}</dd>
                                    </div>
                                  ) : null}
                                </dl>
                              </div>
                              <div className="space-y-3">
                                <div className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-3">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                    Broker contact
                                  </p>
                                  <dl className="space-y-1 text-xs">
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-gray-500">Broker</dt>
                                      <dd className="font-medium">
                                        {v.brokerName} ({v.brokerCode})
                                      </dd>
                                    </div>
                                    <div className="flex justify-between gap-3">
                                      <dt className="text-gray-500">Broker email</dt>
                                      <dd>{v.brokerEmail || "—"}</dd>
                                    </div>
                                  </dl>
                                </div>
                                {v.status === "rejected" && v.rejectionReason ? (
                                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                                    <p className="mb-1 font-semibold uppercase tracking-wide">Rejection reason</p>
                                    {v.rejectionReason}
                                  </div>
                                ) : null}
                                {pendingRow && canManage ? (
                                  <div className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-3">
                                    <label className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400">
                                      <FileText className="h-3.5 w-3.5" />
                                      Decline reason (emailed to broker)
                                    </label>
                                    <textarea
                                      rows={3}
                                      placeholder="e.g. The NIN does not match the names on the title deed at the MZO Kampala office…"
                                      value={reasonInputs[v.id] || ""}
                                      onChange={(e) =>
                                        setReasonInputs((prev) => ({ ...prev, [v.id]: e.target.value }))
                                      }
                                      className="w-full rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-xs outline-none focus:border-[var(--zcanopy-primary)]"
                                    />
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ) : null}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
