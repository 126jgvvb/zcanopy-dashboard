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
import { Search } from "lucide-react";

const currency = (n: number) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

function AreaChart({ entries }: { entries: { month: string; income: number }[] }) {
  if (entries.length === 0) return <p className="py-6 text-center text-sm text-gray-400">No monthly income data yet.</p>;

  if (typeof window !== 'undefined') {
    console.log('[AreaChart] rendering entries', entries);
  }

  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 20, bottom: 30, left: 50 };
  const innerW = width - padding.left - padding.right;
  const innerH = height - padding.top - padding.bottom;

  const maxIncome = Math.max(...entries.map((e) => e.income));
  const minIncome = Math.min(...entries.map((e) => e.income));
  const range = maxIncome - minIncome || 1;

  const effectiveMax = Math.max(1000, Math.ceil(Math.max(...entries.map((e) => e.income), 1000) / 1000) * 1000);
  const yTickValues = Array.from({ length: effectiveMax / 1000 }, (_, i) => (i + 1) * 1000);

  const points = entries.map((e, i) => ({
    x: padding.left + (i / Math.max(1, entries.length - 1)) * innerW,
    y: padding.top + innerH - (Math.min(e.income, effectiveMax) / effectiveMax) * innerH,
    income: e.income,
    month: e.month,
  }));

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(" ");

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + innerH} L ${points[0].x} ${padding.top + innerH} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={COLORS.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={COLORS.primary} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTickValues.map((v) => (
          <g key={v}>
            <line
              x1={padding.left}
              y1={padding.top + innerH - (v / effectiveMax) * innerH}
              x2={width - padding.right}
              y2={padding.top + innerH - (v / effectiveMax) * innerH}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
            />
            <text
              x={padding.left - 8}
              y={padding.top + innerH - (v / effectiveMax) * innerH + 4}
              textAnchor="end"
              className="text-[10px] fill-gray-400"
            >
              {v / 1000}k
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

      <HoverTooltip points={points} />
    </div>
  );
}

function HoverTooltip({ points }: { points: { x: number; y: number; income: number; month: string }[] }) {
  const [active, setActive] = useState<{ x: number; y: number; income: number; month: string } | null>(null);

  return (
    <div
      className="absolute inset-0"
      onMouseLeave={() => setActive(null)}
    >
      {points.map((p, i) => (
        <div
          key={i}
          className="absolute h-6 w-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
          style={{ left: `${(p.x / 600) * 100}%`, top: `${(p.y / 200) * 100}%` }}
          onMouseEnter={() => setActive(p)}
          onMouseMove={(e) => {
            const rect = e.currentTarget.parentElement?.getBoundingClientRect();
            if (!rect) return;
            setActive({
              ...p,
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }}
        />
      ))}

      {active ? (
        <div
          className="absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-gray-900 px-3 py-2 text-xs text-white shadow-lg pointer-events-none"
          style={{ left: active.x, top: active.y - 8 }}
        >
          <p className="font-semibold">{active.month}</p>
          <p>{`UGX ${Number(active.income || 0).toLocaleString("en-UG")}`}</p>
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
        </div>
      ) : null}
    </div>
  );
}

export default function OverviewPage() {
  const router = useRouter();
  const [liveTick, setLiveTick] = useState(0);
  const [notifSearch, setNotifSearch] = useState("");
  const [notifType, setNotifType] = useState("all");
  const [notifChannel, setNotifChannel] = useState("all");
  const [clientSearch, setClientSearch] = useState("");
  const [clientReadFilter, setClientReadFilter] = useState("all");

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
  const notifications = useAdminData((token) => adminApi.notifications(token, { limit: 5 }), [liveTick]);
  const comments = useAdminData((token) => adminApi.comments(token, 1, 5), [liveTick]);

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

  if (typeof window !== 'undefined') {
    console.log('[OverviewPage] monthly income entries', entries);
  }

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
          ) : income.error ? (
            <ErrorState message={income.error} />
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
                className="flex items-start gap-3 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-4 shadow-[var(--zcanopy-shadow-sm)] transition-all hover:border-[var(--zcanopy-accent-gold)] hover:shadow-[var(--zcanopy-shadow-md)]"
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

      <Panel
        title={
          <div className="flex items-center gap-2">
            <span>Sent Notifications</span>
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
        {notifications.loading ? (
          <LoadingState />
        ) : (notifications.data?.notifications?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No notifications yet.</p>
        ) : (
          <NotificationsTable
            items={(notifications.data?.notifications ?? []) as any[]}
            search={notifSearch}
            onSearchChange={setNotifSearch}
            typeFilter={notifType}
            onTypeChange={setNotifType}
            channelFilter={notifChannel}
            onChannelChange={setNotifChannel}
          />
        )}
      </Panel>

      <Panel
        title={
          <div className="flex items-center gap-2">
            <span>Client Messages</span>
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
        {comments.loading ? (
          <LoadingState />
        ) : (comments.data?.comments?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No client comments yet.</p>
        ) : (
          <ClientMessagesTable
            items={(comments.data?.comments ?? []) as any[]}
            search={clientSearch}
            onSearchChange={setClientSearch}
            readFilter={clientReadFilter}
            onReadFilterChange={setClientReadFilter}
          />
        )}
      </Panel>
    </div>
  );
}

function NotificationsTable({
  items,
  search,
  onSearchChange,
  typeFilter,
  onTypeChange,
  channelFilter,
  onChannelChange,
}: {
  items: any[];
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: string;
  onTypeChange: (value: string) => void;
  channelFilter: string;
  onChannelChange: (value: string) => void;
}) {
  const types = Array.from(new Set(items.map((n) => n.type).filter(Boolean)));
  const channels = Array.from(new Set(items.map((n) => n.channel).filter(Boolean)));

  const filtered = items.filter((n) => {
    if (typeFilter !== "all" && n.type !== typeFilter) return false;
    if (channelFilter !== "all" && n.channel !== channelFilter) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (n.title ?? "").toLowerCase().includes(query) ||
      (n.content ?? "").toLowerCase().includes(query) ||
      (n.recipient ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notifications..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
        >
          <option value="all">All types</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          value={channelFilter}
          onChange={(e) => onChannelChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
        >
          <option value="all">All channels</option>
          {channels.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No matching notifications.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="py-2 pr-4">Subject</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Channel</th>
                <th className="py-2 pr-4">Recipient</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2">Sent At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((n) => (
                <tr key={n.id} className="transition-colors hover:bg-[#D1A054]/5">
                  <td className="py-2 pr-4 font-medium">{n.title ?? n.type}</td>
                  <td className="py-2 pr-4 text-gray-600">{n.type}</td>
                  <td className="py-2 pr-4 text-gray-600">{n.channel}</td>
                  <td className="py-2 pr-4 text-gray-600">
                    {n.recipient || "-"}
                  </td>
                  <td className="py-2 pr-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
                      {n.status}
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ClientMessagesTable({
  items,
  search,
  onSearchChange,
  readFilter,
  onReadFilterChange,
}: {
  items: any[];
  search: string;
  onSearchChange: (value: string) => void;
  readFilter: string;
  onReadFilterChange: (value: string) => void;
}) {
  const filtered = items.filter((c) => {
    if (readFilter !== "all" && String(c.rating ?? "") !== readFilter) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      (c.customerName ?? "").toLowerCase().includes(query) ||
      (c.comment ?? "").toLowerCase().includes(query) ||
      (c.customerPhone ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search comments..."
            className="w-full bg-transparent text-sm outline-none"
          />
        </div>
        <select
          value={readFilter}
          onChange={(e) => onReadFilterChange(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
        >
          <option value="all">All ratings</option>
          <option value="5">5 ★</option>
          <option value="4">4 ★</option>
          <option value="3">3 ★</option>
          <option value="2">2 ★</option>
          <option value="1">1 ★</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">No matching comments.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-gray-400">
              <tr>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Phone</th>
                <th className="py-2 pr-4">Comment</th>
                <th className="py-2 pr-4">Rating</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-[#D1A054]/5">
                  <td className="py-2 pr-4 font-medium">{c.customerName || "-"}</td>
                  <td className="py-2 pr-4 text-gray-600">{c.customerPhone || "-"}</td>
                  <td className="py-2 pr-4 text-gray-700">{c.comment || "-"}</td>
                  <td className="py-2 pr-4">
                    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
                      {c.rating ?? 0} / 5
                    </span>
                  </td>
                  <td className="py-2 text-gray-500">
                    {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
