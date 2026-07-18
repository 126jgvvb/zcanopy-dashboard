/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  useAdminData,
  Panel,
  LoadingState,
  ErrorState,
} from "@/components/ui";
import { adminApi, ApiError } from "@/lib/api";
import { COLORS, can } from "@/lib/theme";

const TIERS = ["basic", "standard", "premium", "enterprise"];

export default function BrokersPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"all" | "pending">("all");
  const [actionError, setActionError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [approvingAll, setApprovingAll] = useState(false);

  const brokers = useAdminData((token) => adminApi.brokers(token, 1, 20));
  const pending = useAdminData((token) =>
    adminApi.pendingVerifications(token, 1, 20),
  );

  async function runAction(
    key: string,
    fn: () => Promise<unknown>,
  ) {
    setActionError(null);
    setActing(key);
    try {
      await fn();
      brokers.reload();
      pending.reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setActing(null);
    }
  }

  async function handleApproveAll() {
    setActionError(null);
    setApprovingAll(true);
    try {
      await adminApi.approveAllPending(admin!.token);
      pending.reload();
      brokers.reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to approve all.");
    } finally {
      setApprovingAll(false);
    }
  }

  const canManage = can(admin?.role, "manage_brokers");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "pending"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                tab === t
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={tab === t ? { backgroundColor: COLORS.primary } : {}}
            >
              {t === "pending" ? "Pending verification" : "All brokers"}
            </button>
          ))}
        </div>
        {tab === "pending" && pending.data?.total ? (
          <button
            onClick={handleApproveAll}
            disabled={approvingAll}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: COLORS.accentGold }}
          >
            {approvingAll ? "Approving…" : `Approve All (${pending.data.total})`}
          </button>
        ) : null}
      </div>

      {actionError ? <ErrorState message={actionError} /> : null}

      {tab === "all" ? (
        <Panel title="Brokers">
          {brokers.loading ? (
            <LoadingState label="Loading brokers" />
          ) : brokers.error ? (
            <ErrorState message={brokers.error} />
          ) : (
            <BrokerTable
              rows={brokers.data?.brokers ?? []}
              canManage={canManage}
              onView={(id) => router.push(`/dashboard/brokers/${id}`)}
              onDelete={(id) =>
                runAction(`del-${id}`, () => adminApi.deleteBroker(admin!.token, id))
              }
              onTier={(id, tier) =>
                runAction(`tier-${id}`, () =>
                  adminApi.editBrokerTier(admin!.token, id, tier),
                )
              }
              acting={acting}
            />
          )}
        </Panel>
      ) : (
        <Panel title="Pending Verifications">
          {pending.loading ? (
            <LoadingState label="Loading verifications" />
          ) : pending.error ? (
            <ErrorState message={pending.error} />
          ) : (
            <BrokerTable
              rows={pending.data?.brokers ?? []}
              canManage={canManage}
              pending
              onView={(id) => router.push(`/dashboard/brokers/${id}`)}
              onApprove={(id) =>
                runAction(`appr-${id}`, () =>
                  adminApi.approveDocument(admin!.token, id, { namesMatched: true }),
                )
              }
              onReject={(id) =>
                runAction(`rej-${id}`, () =>
                  adminApi.approveDocument(admin!.token, id, {
                    namesMatched: false,
                  }),
                )
              }
              acting={acting}
            />
          )}
        </Panel>
      )}
    </div>
  );
}

function BrokerTable({
  rows,
  canManage,
  pending,
  onView,
  onDelete,
  onTier,
  onApprove,
  onReject,
  acting,
}: {
  rows: any[];
  canManage: boolean;
  pending?: boolean;
  onView: (id: string) => void;
  onDelete?: (id: string) => void;
  onTier?: (id: string, tier: string) => void;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  acting: string | null;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No brokers found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="py-3 pr-4">Broker</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Code</th>
            <th className="py-2 pr-4">Tier</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((b) => (
            <tr key={b.id} className="group transition-colors hover:bg-[#D1A054]/5">
              <td className="py-3 pr-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: COLORS.primary }}>
                    {b.username?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">{b.username}</p>
                    <p className="text-xs text-gray-400">{b.title || "Broker"}</p>
                  </div>
                </div>
              </td>
              <td className="py-3 pr-4 text-gray-500">{b.email}</td>
              <td className="py-2 pr-4">
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                  {b.brokerCode}
                </span>
              </td>
              <td className="py-2 pr-4">
                {pending || !canManage ? (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                    {b.subscriptionTier ?? "—"}
                  </span>
                ) : (
                  <select
                    defaultValue={b.subscriptionTier}
                    disabled={acting?.startsWith(`tier-${b.id}`)}
                    onChange={(e) => onTier?.(b.id, e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs capitalize"
                  >
                    {TIERS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                )}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    b.isVerified
                      ? "bg-green-100 text-green-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {b.isVerified ? "Verified" : "Pending"}
                </span>
              </td>
              <td className="py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onView(b.id)}
                    className="hover-gold rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700"
                  >
                    View
                  </button>
                  {pending && canManage ? (
                    <>
                      <button
                        disabled={acting === `appr-${b.id}`}
                        onClick={() => onApprove?.(b.id)}
                        className="hover-gold rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                        style={{ backgroundColor: COLORS.primary }}
                      >
                        Approve
                      </button>
                      <button
                        disabled={acting === `rej-${b.id}`}
                        onClick={() => onReject?.(b.id)}
                        className="hover-gold rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                      >
                        Reject
                      </button>
                    </>
                  ) : null}
                  {!pending && canManage && onDelete ? (
                    <button
                      disabled={acting === `del-${b.id}`}
                      onClick={() => onDelete(b.id)}
                      className="hover-gold rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
