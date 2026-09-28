/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { Search } from "lucide-react";

const STATUSES = ["all", "active", "expired"] as const;

export default function SessionsPage() {
  const sessions = useAdminData((token) => adminApi.activeSessions(token));
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");

  const filtered = (sessions.data?.sessions ?? []).filter((s: any) => {
    const expired = (s.ttlSecondsRemaining ?? 0) <= 0;
    if (status === "active" && expired) return false;
    if (status === "expired" && !expired) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      s.sessionId?.toLowerCase().includes(query) ||
      s.deviceId?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">
          Active Customer Sessions
        </h2>
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                status === s
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={status === s ? { backgroundColor: "var(--zcanopy-primary)" } : {}}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by session or device ID"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Panel title={`Live Sessions (${filtered.length})`}>
        {sessions.loading ? (
          <LoadingState label="Loading sessions" />
        ) : sessions.error ? (
          <ErrorState message={sessions.error} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No sessions found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Session ID</th>
                  <th className="py-2 pr-4">Device</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Last Activity</th>
                  <th className="py-2">TTL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s: any) => (
                  <tr key={s.sessionId} className="hover:bg-[#D1A054]/5 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs">{s.sessionId}</td>
                    <td className="py-2.5 pr-4">{s.deviceId}</td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {s.locationLat && s.locationLng
                        ? `${s.locationLat.toFixed(3)}, ${s.locationLng.toFixed(3)}`
                        : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-gray-500">
                      {s.lastActivityAt
                        ? new Date(s.lastActivityAt).toLocaleString()
                        : "—"}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {s.ttlSecondsRemaining != null
                        ? `${s.ttlSecondsRemaining}s`
                        : "—"}
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
