/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";

const QUERY_PRESENCE = ["all", "with_query", "no_query"] as const;

export default function SearchesPage() {
  const [customerId, setCustomerId] = useState("");
  const [query, setQuery] = useState("");
  const [queryPresence, setQueryPresence] = useState<(typeof QUERY_PRESENCE)[number]>("all");
  const searches = useAdminData((token) =>
    adminApi.searches(token, 1, 20, customerId || undefined, query || undefined),
  );

  const data = searches.data as { searches?: any[]; total?: number } | undefined;

  const filtered = (data?.searches ?? []).filter((s: any) => {
    if (queryPresence === "with_query" && !s.query) return false;
    if (queryPresence === "no_query" && s.query) return false;
    return true;
  });

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
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500">Customer ID</label>
            <input
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="Optional customer ID filter"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--zcanopy-surface)] px-4 py-2.5 text-sm outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500">Search Query</label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Optional query filter"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--zcanopy-surface)] px-4 py-2.5 text-sm outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500">Query Presence</label>
            <div className="mt-1 flex gap-2">
              {QUERY_PRESENCE.map((qp) => (
                <button
                  key={qp}
                  onClick={() => setQueryPresence(qp)}
                  className={`rounded-full px-4 py-2 text-sm font-medium capitalize transition-all ${
                    queryPresence === qp
                      ? "text-white shadow-md"
                      : "bg-white text-gray-600 hover:bg-gray-100"
                  }`}
                  style={queryPresence === qp ? { backgroundColor: "var(--zcanopy-primary)" } : {}}
                >
                  {qp === "all" ? "All" : qp === "with_query" ? "With query" : "No query"}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Panel>

      <Panel title={`All Searches (${filtered.length})`}>
        {searches.loading ? (
          <LoadingState label="Loading searches" />
        ) : searches.error ? (
          <ErrorState message={searches.error} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No searches found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                   <th className="py-2 pr-4">Customer ID</th>
                  <th className="py-2 pr-4">Query</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Results</th>
                  <th className="py-2 pr-4">Radius</th>
                  <th className="py-2">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[#D1A054]/5 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs">{s.id}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{s.customerId || "—"}</td>
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
