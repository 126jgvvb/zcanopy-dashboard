"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";
import { GoogleMap, type PropertyLocation } from "@/components/GoogleMap";
import PropertyCard from "@/components/PropertyCard";
import { Search } from "lucide-react";

const TIER_LIMITS: Record<string, { maxProperties: number; maxPhotos: number; maxVideos: number; maxVideoSizeMB: number }> = {
  fibrous: { maxProperties: 12, maxPhotos: 25, maxVideos: 2, maxVideoSizeMB: 12 * 1024 },
  buttress: { maxProperties: 16, maxPhotos: 50, maxVideos: 4, maxVideoSizeMB: 4 * 1024 },
  prop: { maxProperties: 5, maxPhotos: 15, maxVideos: 1, maxVideoSizeMB: 500 },
};

const AVAILABILITY = ["all", "available", "unavailable"] as const;

export default function PropertiesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [liveTick, setLiveTick] = useState(0);
  const [mapTab, setMapTab] = useState<"map" | "grid">("map");
  const [availability, setAvailability] = useState<(typeof AVAILABILITY)[number]>("all");

  useEffect(() => {
    const interval = setInterval(() => setLiveTick((t) => t + 1), 180000);
    return () => clearInterval(interval);
  }, []);

  const properties = useAdminData(
    (token) => adminApi.properties(token, page, 20),
    [page, liveTick],
  );

  const locations = useAdminData((token) => adminApi.propertyLocations(token), [liveTick]);

  const filtered = (properties.data?.properties ?? []).filter((p: {
    id: string;
    title?: string;
    location?: string;
    isAvailable: boolean;
    brokerTier?: string;
  }) => {
    if (availability === "available" && !p.isAvailable) return false;
    if (availability === "unavailable" && p.isAvailable) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      p.title?.toLowerCase().includes(query) ||
      p.location?.toLowerCase().includes(query)
    );
  });

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
        <div className="flex gap-2">
          {AVAILABILITY.map((a) => (
            <button
              key={a}
              onClick={() => setAvailability(a)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                availability === a
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={availability === a ? { backgroundColor: COLORS.primary } : {}}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search title or location"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMapTab("map")}
          className={`hover-gold rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
            mapTab === "map"
              ? "text-white shadow-md"
              : "bg-white text-gray-700"
          }`}
          style={mapTab === "map" ? { backgroundColor: COLORS.primary } : {}}
        >
          Map View
        </button>
        <button
          onClick={() => setMapTab("grid")}
          className={`hover-gold rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
            mapTab === "grid"
              ? "text-white shadow-md"
              : "bg-white text-gray-700"
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
            <GoogleMap locations={mappedLocations} />
          )}
        </Panel>
      ) : (
        <Panel title={`All Properties (${filtered.length})`}>
          {properties.loading ? (
            <LoadingState label="Loading properties" />
          ) : properties.error ? (
            <ErrorState message={properties.error} />
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">No properties found.</p>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((p: {
                id: string;
                title?: string;
                location?: string;
                isAvailable: boolean;
                brokerTier?: string;
                imageUrl?: string[];
                videoUrl?: string[];
                propertyType?: string;
                brokersUniqueCode?: string;
                createdAt?: string;
                photoCount?: number;
                videoCount?: number;
                price?: number;
                brokerBookingFee?: number;
              }) => {
                const limits = TIER_LIMITS[(p.brokerTier?.toLowerCase?.() ?? 'prop')] ?? TIER_LIMITS.prop;
                return (
                  <PropertyCard
                    key={p.id}
                    property={p}
                    limits={limits}
                    onClick={() => router.push(`/dashboard/properties/${p.id}`)}
                  />
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
            className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-sm text-gray-500">Page {page}</span>
          <button
            disabled={(properties.data?.properties?.length ?? 0) < 20}
            onClick={() => setPage((p) => p + 1)}
            className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
