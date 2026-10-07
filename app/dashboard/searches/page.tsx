/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";

const QUERY_PRESENCE = ["all", "with_query", "no_query"] as const;

const PAGE_SIZE = 20;

export default function SearchesPage() {
  const [customerId, setCustomerId] = useState("");
  const [query, setQuery] = useState("");
  const [queryPresence, setQueryPresence] = useState<(typeof QUERY_PRESENCE)[number]>("all");
  const [page, setPage] = useState(1);
  const searches = useAdminData(
    (token) =>
      adminApi.searches(token, page, PAGE_SIZE, {
        customerId: customerId || undefined,
        query: query || undefined,
      }),
    [page, customerId, query],
  );

  const data = searches.data as { searches?: any[]; total?: number } | undefined;

  const filtered = (data?.searches ?? []).filter((s: any) => {
    if (queryPresence === "with_query" && !s.query) return false;
    if (queryPresence === "no_query" && s.query) return false;
    return true;
  });

  // queryPresence filters client-side, so it must not affect the page count.
  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const formatFilters = (filters: any) => {
    if (!filters || typeof filters === "string") {
      try {
        const parsed = filters ? JSON.parse(filters) : {};
        return Object.entries(parsed)
          .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      } catch {
        return "";
      }
    }
    return Object.entries(filters)
      .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  };

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
              onChange={(e) => {
                setCustomerId(e.target.value);
                setPage(1);
              }}
              placeholder="Optional customer ID filter"
              className="mt-1 w-full rounded-xl border border-[var(--border)] bg-[var(--zcanopy-surface)] px-4 py-2.5 text-sm outline-none"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500">Search Query</label>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
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

      <Panel title={`Searches (${filtered.length} on this page)`}>
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
                  <th className="py-2 pr-4">Radius (km)</th>
                  <th className="py-2 pr-4">Price Range</th>
                  <th className="py-2 pr-4">County / District</th>
                  <th className="py-2 pr-4">Filters</th>
                  <th className="py-2 pr-4">Result Count</th>
                  <th className="py-2 pr-4">Result Property IDs</th>
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
                    <td className="py-2.5 pr-4">{s.radius ? `${s.radius} km` : "—"}</td>
                    <td className="py-2.5 pr-4">
                      {s.minPrice || s.maxPrice ? `${s.minPrice || 0} — ${s.maxPrice || 0}` : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      {s.subCounty || s.district ? `${s.subCounty || ""} / ${s.district || ""}` : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-500">
                      {formatFilters(s.filters) || "—"}
                    </td>
                    <td className="py-2.5 pr-4">{s.resultCount ?? 0}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {Array.isArray(s.resultPropertyIds) && s.resultPropertyIds.length > 0
                        ? s.resultPropertyIds.slice(0, 5).join(", ") + (s.resultPropertyIds.length > 5 ? ` +${s.resultPropertyIds.length - 5} more` : "")
                        : "—"}
                    </td>
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

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          disabled={page <= 1 || searches.loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-2 text-sm text-gray-500">
          Page {page} of {lastPage}
        </span>
        <button
          disabled={page >= lastPage || searches.loading}
          onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
        >
          Next
        </button>
        <span className="px-3 py-2 text-sm text-gray-400">
          {total} search{total === 1 ? "" : "es"}
        </span>
      </div>
    </div>
  );
}
