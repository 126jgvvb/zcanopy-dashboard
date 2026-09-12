/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";

export default function SearchesPage() {
  const [sessionToken, setSessionToken] = useState("");
  const [query, setQuery] = useState("");
  const searches = useAdminData((token) =>
    adminApi.searches(token, 1, 20, sessionToken || undefined, query || undefined),
  );

  const data = searches.data as { searches?: any[]; total?: number } | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">
            Customer Searches
          </h2>
          <p className="text-sm text-gray-500">Recent search activity across customer sessions.</p>
        </div>
      </div>

      <Panel title="Filters">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-xs font-medium text-gray-500">Session Token</label>
            <input
              value={sessionToken}
              onChange={(e) => setSessionToken(e.target.value)}
              placeholder="Optional session token filter"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--zcanopy-surface)] px-4 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Search Query</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Optional query filter"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--zcanopy-surface)] px-4 py-2.5 text-sm outline-none"
            />
          </div>
        </div>
      </Panel>

      <Panel title="All Searches">
        {searches.loading ? (
          <LoadingState label="Loading searches" />
        ) : searches.error ? (
          <ErrorState message={searches.error} />
        ) : (data?.searches?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No searches found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Session Token</th>
                  <th className="py-2 pr-4">Query</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Results</th>
                  <th className="py-2 pr-4">Radius</th>
                  <th className="py-2">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data?.searches ?? []).map((s: any) => (
                  <tr key={s.id} className="hover:bg-[#D1A054]/5 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs">{s.id}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{s.sessionToken}</td>
                    <td className="py-2.5 pr-4">{s.query || "—"}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{s.location || "—"}</td>
                    <td className="py-2.5 pr-4">{s.propertyType || "—"}</td>
                    <td className="py-2.5 pr-4">{s.resultCount ?? 0}</td>
                    <td className="py-2.5 pr-4">{s.radius ? `${s.radius} km` : "—"}</td>
                    <td className="py-2.5 text-gray-500">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}
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
