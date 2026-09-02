"use client";

import { use } from "react";
import Link from "next/link";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";

const TIER_LIMITS: Record<string, { maxProperties: number; maxPhotos: number; maxVideos: number; maxVideoSizeMB: number }> = {
  fibrous: { maxProperties: 12, maxPhotos: 25, maxVideos: 2, maxVideoSizeMB: 12 * 1024 },
  buttress: { maxProperties: 16, maxPhotos: 50, maxVideos: 4, maxVideoSizeMB: 4 * 1024 },
  prop: { maxProperties: 5, maxPhotos: 15, maxVideos: 1, maxVideoSizeMB: 500 },
};

function formatBytes(mb: number) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

function InfoRow({ label, value, mono, highlight }: { label: string; value?: string | number; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-[var(--zcanopy-muted)]">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`} style={highlight ? { color: COLORS.primary } : { color: COLORS.cardBrown }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function MediaRow({ label, used, max, accent }: { label: string; used: number; max: number; accent: string }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[var(--zcanopy-muted)]">{label}</span>
        <span className="font-medium" style={{ color: COLORS.cardBrown }}>
          {used} / {max}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--zcanopy-overlay)]">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 90 ? "#dc2626" : pct >= 70 ? COLORS.accentGold : accent,
          }}
        />
      </div>
    </div>
  );
}

export default function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const property = useAdminData(
    (token) => adminApi.property(token, id),
    [id],
  );

  if (property.loading) return <LoadingState label="Loading property" />;
  if (property.error) return <ErrorState message={property.error} />;

  const data = property.data?.property ?? {};
  const photos = (data.imageUrl ?? [])
    .flatMap((item: string | string[] | undefined) => (Array.isArray(item) ? item : item ? [item] : []))
    .filter(Boolean);
  const videos = (data.videoUrl ?? [])
    .flatMap((item: string | string[] | undefined) => (Array.isArray(item) ? item : item ? [item] : []))
    .filter(Boolean);
  const limits = TIER_LIMITS[data.brokerTier?.toLowerCase?.()] ?? TIER_LIMITS.prop;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/properties"
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
        style={{ color: COLORS.primary }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to properties
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Panel title="Photos">
            {photos.length === 0 ? (
              <p className="py-8 text-center text-sm text-[var(--zcanopy-muted)]">No photos uploaded.</p>
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {photos.map((src: string, idx: number) => (
                  <div
                    key={`${src}-${idx}`}
                    className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-overlay)]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`${data.title ?? "Property"} photo ${idx + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            )}
          </Panel>

          {videos.length > 0 ? (
            <Panel title="Videos">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {videos.map((src: string, idx: number) => (
                  <video
                    key={`${src}-${idx}`}
                    src={src}
                    className="aspect-video w-full rounded-xl bg-black object-cover"
                    controls
                    controlsList="nodownload"
                    preload="metadata"
                  >
                    Your browser does not support the video tag.
                  </video>
                ))}
              </div>
            </Panel>
          ) : null}
        </div>

        <div className="lg:col-span-1 space-y-6">
          <Panel title="Details">
            <div className="space-y-3 text-sm">
              <InfoRow label="Title" value={data.title} highlight />
              <InfoRow label="Location" value={data.location} />
              <InfoRow label="Type" value={data.propertyType} />
              <InfoRow label="Price" value={data.price ? `UGX ${data.price.toLocaleString()}` : undefined} mono highlight />
              <InfoRow label="Broker Booking Fee" value={data.brokerBookingFee ? `UGX ${data.brokerBookingFee.toLocaleString()}` : undefined} mono />
              <InfoRow label="Broker Code" value={data.brokersUniqueCode} mono />
              <InfoRow label="Tier" value={data.brokerTier} />
              <InfoRow label="Status" value={data.isAvailable ? "Available" : "Unavailable"} />
              <InfoRow label="Listed" value={data.createdAt ? new Date(data.createdAt).toLocaleDateString() : "—"} />
            </div>
          </Panel>

          <Panel title="Description">
            <p className="text-sm leading-relaxed text-[var(--zcanopy-muted)]">
              {data.description || "No description provided."}
            </p>
          </Panel>

          <Panel title="Media Limits">
            <div className="space-y-3">
              <MediaRow label="Photos" used={data.photoCount ?? photos.length} max={limits.maxPhotos} accent={COLORS.primary} />
              <MediaRow label="Videos" used={data.videoCount ?? videos.length} max={limits.maxVideos} accent={COLORS.accentGold} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--zcanopy-muted)]">Max video size</span>
                <span className="font-medium">{formatBytes(limits.maxVideoSizeMB)}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
