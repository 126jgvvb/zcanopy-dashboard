"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";
import { Search } from "lucide-react";

const RATINGS = ["all", "5", "4", "3", "2", "1"] as const;

export default function CommentsPage() {
  const [search, setSearch] = useState("");
  const [rating, setRating] = useState<(typeof RATINGS)[number]>("all");

  const comments = useAdminData(
    (token) => adminApi.comments(token, 1, 20),
    [],
  );

  const items = (comments.data?.comments ?? []) as Array<{
    id: string;
    comment: string;
    customerName?: string;
    propertyTitle?: string;
    propertyId?: string;
    rating?: number;
    createdAt?: string;
  }>;

  const filtered = items.filter((c) => {
    if (rating !== "all" && String(c.rating ?? "") !== rating) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      c.comment.toLowerCase().includes(query) ||
      (c.customerName || "").toLowerCase().includes(query) ||
      (c.propertyTitle || "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
          Property Reviews & Comments
        </h2>
        <div className="flex gap-2">
          {RATINGS.map((r) => (
            <button
              key={r}
              onClick={() => setRating(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                rating === r
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={rating === r ? { backgroundColor: COLORS.primary } : {}}
            >
              {r === "all" ? "All" : `${r} ★`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search comments, customers, or properties..."
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Panel title={`All Reviews (${filtered.length})`}>
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
