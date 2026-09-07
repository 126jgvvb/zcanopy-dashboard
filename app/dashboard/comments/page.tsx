"use client";

import { useEffect, useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";

export default function CommentsPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const comments = useAdminData(
    (token) => adminApi.comments(token, page, 20),
    [page],
  );

  const items = (comments.data?.comments ?? []) as any[];

  const filtered = items.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.comment || "").toLowerCase().includes(q) ||
      (c.customerName || "").toLowerCase().includes(q) ||
      (c.propertyTitle || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
          Property Reviews & Comments
        </h2>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search comments, customers, or properties..."
          className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-4 py-2 text-sm outline-none"
        />
      </div>

      <Panel title="All Reviews">
        {comments.loading ? (
          <LoadingState label="Loading reviews" />
        ) : comments.error ? (
          <ErrorState message={comments.error} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No reviews found.</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-4 shadow-[var(--zcanopy-shadow-sm)]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: COLORS.cardBrown }}>
                      {c.customerName || "Anonymous"}
                    </p>
                    <p className="text-xs text-gray-500">
                      {c.propertyTitle ? `Property: ${c.propertyTitle}` : `Property ID: ${c.propertyId}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="text-sm font-semibold" style={{ color: COLORS.primary }}>
                      {c.rating ?? 0} / 5
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-700">{c.comment}</p>
                <p className="mt-2 text-[10px] text-gray-400">
                  {c.createdAt ? new Date(c.createdAt).toLocaleString() : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>
    </div>
  );
}
