/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { Search } from "lucide-react";

const LEVELS = ["all", "error", "warn", "info", "debug"] as const;

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>("all");
  const [service, setService] = useState("");
  const [search, setSearch] = useState("");

  const logs = useAdminData(
    (token) => adminApi.logs(token, page, 25, level === "all" ? undefined : level, service || undefined),
    [page, level, service],
  );

  const filtered = (logs.data?.logs ?? []).filter((l: any) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return l.message?.toLowerCase().includes(query);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">
          System Logs
        </h2>
        <div className="flex flex-wrap gap-2">
          <select
            value={level}
            onChange={(e) => {
              setLevel(e.target.value as typeof LEVELS[number]);
              setPage(1);
            }}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
          >
            {LEVELS.map((lv) => (
              <option key={lv} value={lv}>
                {lv === "all" ? "All levels" : lv.toUpperCase()}
              </option>
            ))}
          </select>
          <input
            value={service}
            onChange={(e) => {
              setService(e.target.value);
              setPage(1);
            }}
            placeholder="Service filter"
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search log messages"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Panel title="Log Entries">
        {logs.loading ? (
          <LoadingState label="Loading logs" />
        ) : logs.error ? (
          <ErrorState message={logs.error} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No logs found.</p>
        ) : (
          <ul className="space-y-2 font-mono text-xs">
            {filtered.map((l: any) => (
              <li
                key={l.id}
                className="flex items-start gap-3 rounded-lg bg-gray-50 p-3"
              >
                <span
                  className={`mt-0.5 rounded px-1.5 py-0.5 font-semibold uppercase ${
                    l.level === "error"
                      ? "bg-red-100 text-red-700"
                      : l.level === "warn"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {l.level}
                </span>
                <div className="flex-1">
                  <p className="text-gray-700">{l.message}</p>
                  <p className="text-gray-400">
                    {l.service} ·{" "}
                    {l.timestamp ? new Date(l.timestamp).toLocaleString() : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="flex justify-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-2 text-sm text-gray-500">Page {page}</span>
        <button
          disabled={(logs.data?.logs?.length ?? 0) < 25}
          onClick={() => setPage((p) => p + 1)}
          className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
