/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";
import { PropertyMap, type PropertyLocation } from "@/components/PropertyMap";

const TIER_LIMITS: Record<string, { maxProperties: number; maxPhotos: number; maxVideos: number; maxVideoSizeMB: number }> = {
  fibrous: { maxProperties: 12, maxPhotos: 25, maxVideos: 2, maxVideoSizeMB: 12 * 1024 },
  buttress: { maxProperties: 16, maxPhotos: 50, maxVideos: 4, maxVideoSizeMB: 4 * 1024 },
  prop: { maxProperties: 5, maxPhotos: 15, maxVideos: 1, maxVideoSizeMB: 500 },
};

export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [liveTick, setLiveTick] = useState(0);
  const [mapTab, setMapTab] = useState<"map" | "grid">("map");

  useEffect(() => {
    const interval = setInterval(() => setLiveTick((t) => t + 1), 30000);
    return () => clearInterval(interval);
  }, []);

  const properties = useAdminData(
    (token) => adminApi.properties(token, page, 20),
    [page, liveTick],
  );

  const locations = useAdminData((token) => adminApi.propertyLocations(token), [liveTick]);

  const filtered = (properties.data?.properties ?? []).filter((p: any) =>
    !search ||
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.location?.toLowerCase().includes(search.toLowerCase()),
  );

  const mappedLocations: PropertyLocation[] = (locations.data?.locations ?? []) as PropertyLocation[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
            Properties
          </h2>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
          </span>
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or location"
          className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)] transition-colors"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMapTab("map")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
            mapTab === "map"
              ? "text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
          style={mapTab === "map" ? { backgroundColor: COLORS.primary } : {}}
        >
          Map View
        </button>
        <button
          onClick={() => setMapTab("grid")}
          className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
            mapTab === "grid"
              ? "text-white shadow-md"
              : "bg-white text-gray-600 hover:bg-gray-100"
          }`}
          style={mapTab === "grid" ? { backgroundColor: COLORS.primary } : {}}
        >
          Grid View
        </button>
      </div>

      {mapTab === "map" ? (
        <Panel title="Property Map">
          {locations.loading ? (
            <LoadingState label="Loading map data" />
          ) : locations.error ? (
            <ErrorState message={locations.error} />
          ) : (
            <PropertyMap locations={mappedLocations} />
          )}
        </Panel>
      ) : (
        <Panel title="All Properties">
          {properties.loading ? (
            <LoadingState label="Loading properties" />
          ) : properties.error ? (
            <ErrorState message={properties.error} />
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No properties found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((p: any) => {
                const limits = TIER_LIMITS[p.brokerTier?.toLowerCase?.()] ?? TIER_LIMITS.prop;
                const photoPct = Math.min(100, Math.round(((p.photoCount ?? 0) / limits.maxPhotos) * 100));
                const videoPct = Math.min(100, Math.round(((p.videoCount ?? 0) / limits.maxVideos) * 100));
                return (
                  <div
                    key={p.id}
                    className="group rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:shadow-md hover:border-[var(--zcanopy-accent-gold)]"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-gray-800">{p.title}</p>
                        <p className="mt-1 text-xs text-gray-400">{p.location}</p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${p.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {p.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-gray-500 line-clamp-2">
                      {p.description}
                    </p>
                    <div className="mt-4 space-y-2.5">
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Photos</span>
                          <span className="font-medium text-gray-700">
                            {p.photoCount ?? 0} / {limits.maxPhotos}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${photoPct}%`,
                              backgroundColor: photoPct >= 90 ? "#dc2626" : photoPct >= 70 ? COLORS.accentGold : COLORS.primary,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">Videos</span>
                          <span className="font-medium text-gray-700">
                            {p.videoCount ?? 0} / {limits.maxVideos}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${videoPct}%`,
                              backgroundColor: videoPct >= 90 ? "#dc2626" : videoPct >= 70 ? COLORS.accentGold : COLORS.primary,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs capitalize text-gray-600">
                        {p.propertyType}
                      </span>
                      <span className="rounded-lg px-2.5 py-1 text-xs capitalize" style={{ backgroundColor: `${COLORS.primary}15`, color: COLORS.primary }}>
                        {p.brokerTier || "prop"} tier
                      </span>
                      <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs text-gray-500">
                        {p.brokersUniqueCode}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Panel>
      )}

      {mapTab === "grid" && (
        <div className="flex justify-center gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-500">Page {page}</span>
          <button
            disabled={(properties.data?.properties?.length ?? 0) < 20}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg bg-white px-4 py-2 text-sm font-medium shadow-sm disabled:opacity-50 hover:bg-gray-50 transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
