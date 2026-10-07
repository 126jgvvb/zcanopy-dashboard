/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import SearchFilters from "@/components/SearchFilters";
import FilterUsageChart from "@/components/FilterUsageChart";

const PAGE_SIZE = 20;

function sortByIdDesc(searches: any[]): any[] {
  return [...searches].sort((a, b) => {
    const numA = parseInt(a.id?.replace(/\D/g, "") || "0", 10) || 0;
    const numB = parseInt(b.id?.replace(/\D/g, "") || "0", 10) || 0;
    return numB - numA;
  });
}

export default function SearchesPage() {
  const [filters, setFilters] = useState({
    customerId: undefined as string | undefined,
    query: undefined as string | undefined,
    queryPresence: "all" as "all" | "with_query" | "no_query",
    propertyType: undefined as string | undefined,
    location: undefined as string | undefined,
    brokerCode: undefined as string | undefined,
    brokerBrandName: undefined as string | undefined,
    subCounty: undefined as string | undefined,
    district: undefined as string | undefined,
    minPrice: undefined as string | undefined,
    maxPrice: undefined as string | undefined,
    fromDate: undefined as string | undefined,
    toDate: undefined as string | undefined,
  });
  const [page, setPage] = useState(1);

  const searches = useAdminData(
    (token) =>
      adminApi.searches(token, page, PAGE_SIZE, {
        customerId: filters.customerId,
        query: filters.query,
        propertyType: filters.propertyType,
        location: filters.location,
        brokerCode: filters.brokerCode,
        brokerBrandName: filters.brokerBrandName,
        subCounty: filters.subCounty,
        district: filters.district,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
    [
      page,
      filters.customerId,
      filters.query,
      filters.propertyType,
      filters.location,
      filters.brokerCode,
      filters.brokerBrandName,
      filters.subCounty,
      filters.district,
      filters.minPrice,
      filters.maxPrice,
      filters.fromDate,
      filters.toDate,
    ],
  );

  const allSearches = useAdminData(
    (token) => adminApi.searches(token, 1, 1000),
    [],
  );

  const data = searches.data as { searches?: any[]; total?: number } | undefined;

  const sortedSearches = sortByIdDesc(data?.searches ?? []);

  const filtered = sortedSearches.filter((s: any) => {
    if (filters.queryPresence === "with_query" && !s.query) return false;
    if (filters.queryPresence === "no_query" && s.query) return false;
    return true;
  });

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

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      customerId: undefined,
      query: undefined,
      queryPresence: "all",
      propertyType: undefined,
      location: undefined,
      brokerCode: undefined,
      brokerBrandName: undefined,
      subCounty: undefined,
      district: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
    setPage(1);
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
        <SearchFilters filters={filters} onChange={handleFilterChange} onReset={resetFilters} />
      </Panel>

      <Panel title="Filter Usage Analytics">
        {allSearches.loading ? (
          <LoadingState label="Loading analytics" />
        ) : allSearches.error ? (
          <ErrorState message={allSearches.error} />
        ) : (
          <FilterUsageChart
            searches={(allSearches.data as { searches?: any[] })?.searches ?? []}
          />
        )}
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
                      {s.minPrice || s.maxPrice ? `${s.minPrice || 0} \u2014 ${s.maxPrice || 0}` : "—"}
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
