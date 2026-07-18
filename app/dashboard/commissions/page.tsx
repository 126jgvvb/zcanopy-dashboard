"use client";

import { useAdminData, Panel, StatCard, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";

const currency = (n: number) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

interface BrokerCommission {
  brokerId: string;
  brokerCode: string;
  brokerName: string;
  tier: string;
  totalCommission: number;
  transactionCount: number;
  totalBookings: number;
}

export default function CommissionsPage() {
  const commission = useAdminData((token) => adminApi.currentCommission(token));
  const rates = useAdminData((token) => adminApi.commissions(token));
  const brokerCommissions = useAdminData((token) => adminApi.brokerCommissions(token));

  if (commission.loading) return <LoadingState label="Loading commissions" />;
  if (commission.error) return <ErrorState message={commission.error} />;

  const c = commission.data ?? {
    platformCommission: 0,
    bookingCommission: 0,
    totalEarnings: 0,
  };
  const r = rates.data ?? { minimumWithdrawal: 10000 };
  const bc: BrokerCommission[] = brokerCommissions.data?.commissions ?? [];

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
            <p className="text-sm font-medium text-gray-900">Minimum Withdrawal</p>
            <p className="text-xs text-gray-500">
              Threshold required before a platform payout can be initiated.
            </p>
          </div>
          <p className="text-lg font-bold text-[var(--zcanopy-card-brown)]">
            {currency(r.minimumWithdrawal)}
          </p>
        </div>
      </Panel>

      <Panel title="Commission per Broker">
        {brokerCommissions.loading ? (
          <LoadingState label="Loading broker commissions" />
        ) : brokerCommissions.error ? (
          <ErrorState message={brokerCommissions.error} />
        ) : bc.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No commission data yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-3 pr-4">Broker</th>
                  <th className="py-2 pr-4">Code</th>
                  <th className="py-2 pr-4">Tier</th>
                  <th className="py-2 pr-4">Transactions</th>
                  <th className="py-2 pr-4">Total Bookings</th>
                  <th className="py-2">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bc.map((row: BrokerCommission) => (
                  <tr key={row.brokerId} className="hover:bg-[#D1A054]/5 transition-colors">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{row.brokerName}</p>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-600">
                        {row.brokerCode}
                      </span>
                    </td>
                    <td className="py-2 pr-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs capitalize text-gray-600">
                        {row.tier}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-600">{row.transactionCount}</td>
                    <td className="py-2 pr-4 text-gray-600">{currency(row.totalBookings)}</td>
                    <td className="py-2 font-semibold" style={{ color: COLORS.cardBrown }}>
                      {currency(row.totalCommission)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
