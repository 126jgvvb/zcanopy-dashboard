"use client";

import { useState, type ReactNode } from "react";
import { Camera, Home, MapPin, Video } from "lucide-react";
import { COLORS } from "@/lib/theme";

type PropertyLike = {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  propertyType?: string;
  imageUrl?: string | string[];
  videoUrl?: string | string[];
  isAvailable?: boolean;
  photoCount?: number;
  videoCount?: number;
  maxPhotos?: number;
  maxVideos?: number;
  brokerTier?: string;
  brokersUniqueCode?: string;
  createdAt?: string;
};

function asList(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value]).filter(Boolean);
}

function MediaMeter({
  icon,
  label,
  used,
  max,
  accent,
}: {
  icon: ReactNode;
  label: string;
  used: number;
  max: number;
  accent: string;
}) {
  const pct = max > 0 ? Math.min(100, (used / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.12em] text-[var(--zcanopy-muted)]">
          {icon}
          {label}
        </span>
        <span className="tabular-nums text-xs">
          <span className="font-semibold text-[var(--zcanopy-card-brown)]">{used}</span>
          <span className="text-[var(--zcanopy-muted)]"> / {max}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-[var(--zcanopy-overlay)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${pct}%`, backgroundColor: accent }}
        />
      </div>
    </div>
  );
}

export default function PropertyCard({
  property,
  limits,
  onClick,
}: {
  property: PropertyLike;
  limits: { maxPhotos: number; maxVideos: number };
  onClick?: () => void;
}) {
  const photos = asList(property.imageUrl);
  const videos = asList(property.videoUrl);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [showTour, setShowTour] = useState(false);

  const cover = photos[photoIndex] ?? photos[0];
  const photoCount = property.photoCount ?? photos.length;
  const videoCount = property.videoCount ?? videos.length;
  const maxPhotos = property.maxPhotos ?? limits.maxPhotos;
  const maxVideos = property.maxVideos ?? limits.maxVideos;
  const thumbs = photos.slice(0, 4);
  const tourSrc = videos[0] || (videoCount > 0 ? "/sample_vid.mp4" : "");

  return (
    <article
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] shadow-[var(--zcanopy-shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--zcanopy-accent-gold)] hover:shadow-[var(--zcanopy-shadow-md)]"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[var(--zcanopy-overlay)]">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={property.title ?? "Property"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center text-[var(--zcanopy-muted)]">
            <Home className="h-8 w-8 opacity-60" />
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em]">No photo yet</p>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-black/5 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {property.propertyType ? (
            <span className="rounded-full bg-[var(--zcanopy-surface)]/92 px-2.5 py-1 text-[11px] font-semibold capitalize tracking-wide text-[var(--zcanopy-card-brown)] shadow-sm backdrop-blur-sm">
              {property.propertyType}
            </span>
          ) : null}
        </div>
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold shadow-sm backdrop-blur-sm ${
            property.isAvailable
              ? "bg-emerald-50/95 text-emerald-800"
              : "bg-[var(--zcanopy-surface)]/92 text-[var(--zcanopy-muted)]"
          }`}
        >
          {property.isAvailable ? "Available" : "Unavailable"}
        </span>

        {thumbs.length > 1 ? (
          <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
            {thumbs.map((src, idx) => (
                <button
                  key={`${src}-${idx}`}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(idx);
                  }}
                className={`h-11 flex-1 overflow-hidden rounded-lg ring-2 transition-all ${
                  idx === photoIndex
                    ? "ring-[var(--zcanopy-accent-gold)]"
                    : "ring-white/30 opacity-80 hover:opacity-100"
                }`}
                aria-label={`Photo ${idx + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col px-5 pb-5 pt-4">
        <h3 className="text-[15px] font-semibold leading-snug tracking-tight text-[var(--zcanopy-card-brown)]">
          {property.title || "Untitled listing"}
        </h3>
        {property.location ? (
          <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[var(--zcanopy-muted)]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {property.location}
          </p>
        ) : null}
        {property.description ? (
          <p className="mt-2.5 line-clamp-2 text-sm leading-relaxed text-[var(--zcanopy-muted)]">
            {property.description}
          </p>
        ) : null}

        <div className="mt-4 space-y-3 rounded-xl bg-[var(--zcanopy-overlay)] px-3.5 py-3">
          <MediaMeter
            icon={<Camera className="h-3.5 w-3.5" />}
            label="Photos"
            used={photoCount}
            max={maxPhotos}
            accent={COLORS.primary}
          />
          <MediaMeter
            icon={<Video className="h-3.5 w-3.5" />}
            label="Videos"
            used={videoCount}
            max={maxVideos}
            accent={COLORS.accentGold}
          />
        </div>

        {videoCount > 0 && tourSrc ? (
          <div className="mt-3">
            {showTour ? (
              <video
                src={tourSrc}
                className="aspect-video w-full rounded-xl bg-black object-cover"
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTour(true);
                }}
                className="flex w-full items-center justify-between rounded-xl border border-[var(--zcanopy-border)] px-3.5 py-2.5 text-left transition-colors hover:border-[var(--zcanopy-accent-gold)]"
              >
                <span className="flex items-center gap-2 text-sm font-medium text-[var(--zcanopy-card-brown)]">
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-full text-white"
                    style={{ backgroundColor: COLORS.accentGold }}
                  >
                    <Video className="h-3.5 w-3.5" />
                  </span>
                  Watch video tour
                </span>
                <span className="text-[11px] uppercase tracking-[0.12em] text-[var(--zcanopy-muted)]">
                  Play
                </span>
              </button>
            )}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          {property.brokerTier ? (
            <span
              className="rounded-full px-2.5 py-1 text-[11px] font-medium capitalize"
              style={{ backgroundColor: `${COLORS.primary}14`, color: COLORS.primary }}
            >
              {property.brokerTier} tier
            </span>
          ) : null}
          {property.brokersUniqueCode ? (
            <span className="rounded-full bg-[var(--zcanopy-overlay)] px-2.5 py-1 font-mono text-[11px] text-[var(--zcanopy-muted)]">
              {property.brokersUniqueCode}
            </span>
          ) : null}
          {property.createdAt ? (
            <span className="ml-auto text-[11px] text-[var(--zcanopy-muted)]">
              {new Date(property.createdAt).toLocaleDateString()}
            </span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
