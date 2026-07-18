"use client";

import { useAdminData, Panel, StatCard, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";

const currency = (n: number) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

export default function CommissionsPage() {
  const commission = useAdminData((token) => adminApi.currentCommission(token));
  const rates = useAdminData((token) => adminApi.commissions(token));

  if (commission.loading) return <LoadingState label="Loading commissions" />;
  if (commission.error) return <ErrorState message={commission.error} />;

  const c = commission.data ?? {
    platformCommission: 0,
    bookingCommission: 0,
    totalEarnings: 0,
  };
  const r = rates.data ?? { minimumWithdrawal: 10000 };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Platform Commission" value={currency(c.platformCommission)} />
        <StatCard label="Booking Commission" value={currency(c.bookingCommission)} />
        <StatCard label="Total Earnings" value={currency(c.totalEarnings)} />
      </div>

      <Panel title="Commission Settings">
        <div className="flex items-center justify-between rounded-xl bg-gray-50 p-4">
          <div>
            <p className="text-sm font-medium">Minimum Withdrawal</p>
            <p className="text-xs text-gray-400">
              Threshold required before a platform payout can be initiated.
            </p>
          </div>
          <p className="text-lg font-bold text-[var(--zcanopy-card-brown)]">
            {currency(r.minimumWithdrawal)}
          </p>
        </div>
      </Panel>
    </div>
  );
}
