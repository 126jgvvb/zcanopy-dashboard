/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";

export default function SessionsPage() {
  const sessions = useAdminData((token) => adminApi.activeSessions(token));

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">
        Active Customer Sessions
      </h2>

      <Panel title="Live Sessions">
        {sessions.loading ? (
          <LoadingState label="Loading sessions" />
        ) : sessions.error ? (
          <ErrorState message={sessions.error} />
        ) : (sessions.data?.sessions?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No active customer sessions.
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
                {(sessions.data?.sessions ?? []).map((s: any) => (
                  <tr key={s.sessionId} className="hover:bg-gray-50">
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
