/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useAdminData,
  Panel,
  StatCard,
  LoadingState,
  ErrorState,
} from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";

const currency = (n: number) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

function AreaChart({ entries }: { entries: { month: string; income: number }[] }) {
  if (entries.length === 0) return null;

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxIncome = Math.max(...entries.map((e) => e.income));
  const minIncome = Math.min(...entries.map((e) => e.income));
  const range = maxIncome - minIncome || 1;

  const points = entries.map((e, i) => ({
    x: padding.left + (i / Math.max(1, entries.length - 1)) * innerW,
    y: padding.top + innerH - ((e.income - minIncome) / range) * innerH,
  }));

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  const yTicks = 4;
  const yTickValues = Array.from({ length: yTicks }, (_, i) => minIncome + (range * i) / (yTicks - 1));

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.3" />
          <stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {yTickValues.map((v, i) => (
        <g key={i}>
          <line
            x1={padding.left}
            y1={padding.top + (i / (yTicks - 1)) * innerH}
            x2={width - padding.right}
            y2={padding.top + (i / (yTicks - 1)) * innerH}
            stroke="#e5e7eb"
            strokeDasharray="4 4"
          />
          <text
            x={padding.left - 8}
            y={padding.top + (i / (yTicks - 1)) * innerH + 4}
            textAnchor="end"
            className="text-[10px] fill-gray-400"
          >
            {Math.round(v / 1000)}k
          </text>
        </g>
      ))}

      <path d={areaD} fill="url(#areaGrad)" />
      <path
        d={pathD}
        fill="none"
        stroke={COLORS.primary}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill={COLORS.surface} stroke={COLORS.primary} strokeWidth="2" />
          <text x={p.x} y={padding.top + innerH + 16} textAnchor="middle" className="text-[10px] fill-gray-500">
            {entries[i].month}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const [liveTick, setLiveTick] = useState(0);

  const commission = useAdminData((token) =>
    adminApi.currentCommission(token),
  );
  const income = useAdminData((token) => adminApi.monthlyIncome(token), [liveTick]);
  const signups = useAdminData((token) => adminApi.recentSignups(token, 5), [liveTick]);
  const pending = useAdminData((token) =>
    adminApi.pendingVerifications(token, 1, 5),
    [liveTick],
  );
  const messages = useAdminData((token) => adminApi.systemMessages(token, 1, 5), [liveTick]);

  useEffect(() => {
    const interval = setInterval(() => setLiveTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  if (commission.loading) return <LoadingState label="Loading overview" />;
  if (commission.error) return <ErrorState message={commission.error} />;

  const c = commission.data ?? {
    platformCommission: 0,
    bookingCommission: 0,
    totalEarnings: 0,
  };
  const entries = income.data?.entries ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Earnings" value={currency(c.totalEarnings)} hint="Platform + booking" />
        <StatCard label="Platform Commission" value={currency(c.platformCommission)} />
        <StatCard label="Booking Commission" value={currency(c.bookingCommission)} />
        <StatCard
          label="Pending Verifications"
          value={(pending.data?.brokers?.length ?? 0) + (pending.data?.total ?? 0 > 0 ? 0 : 0)}
          hint={`${pending.data?.total ?? 0} awaiting review`}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel
          title={
            <div className="flex items-center gap-2">
              <span>Monthly Income</span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
              </span>
            </div>
          }
        >
          {income.loading ? (
            <LoadingState />
          ) : entries.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No income data yet.</p>
          ) : (
            <div>
              <AreaChart entries={entries} />
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">Total this period</p>
                  <p className="text-lg font-bold" style={{ color: COLORS.cardBrown }}>
                    {currency(entries.reduce((s, e) => s + e.income, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Peak month</p>
                  <p className="text-lg font-bold" style={{ color: COLORS.primary }}>
                    {entries.reduce((a, b) => (a.income > b.income ? a : b)).month}
                  </p>
                </div>
              </div>
            </div>
          )}
        </Panel>

        <Panel
          title="Recent Broker Signups"
          action={
            <button
              onClick={() => router.push("/dashboard/brokers")}
              className="text-xs font-semibold hover:underline"
              style={{ color: COLORS.primary }}
            >
              View all
            </button>
          }
        >
          {signups.loading ? (
            <LoadingState />
          ) : (signups.data?.brokers?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No recent signups.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {(signups.data?.brokers ?? []).map((b: any) => (
                <li key={b.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{b.username}</p>
                    <p className="text-xs text-gray-400">{b.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{b.brokerCode}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel
        title={
          <div className="flex items-center gap-2">
            <span>System Messages</span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
          </div>
        }
        action={
          <button
            onClick={() => router.push("/dashboard/messages")}
            className="text-xs font-semibold hover:underline"
            style={{ color: COLORS.primary }}
          >
            View all
          </button>
        }
      >
        {messages.loading ? (
          <LoadingState />
        ) : (messages.data?.messages?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No messages.</p>
        ) : (
          <ul className="space-y-2">
            {(messages.data?.messages ?? []).map((m: any, i: number) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-[var(--zcanopy-accent-gold)] hover:shadow-md"
              >
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: m.read ? COLORS.accentGold : COLORS.primary }}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold" style={{ color: COLORS.cardBrown }}>{m.title}</p>
                    <span className="text-[10px] text-gray-400">
                      {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{m.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
