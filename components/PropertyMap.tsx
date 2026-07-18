"use client";

import { useMemo } from "react";

export interface PropertyLocation {
  propertyId: string;
  title: string;
  location: string;
  postgisSpatialField: string | null;
  brokerCode: string;
}

function parseGeo(field: string | null): { lat: number; lng: number } | null {
  if (!field) return null;
  try {
    const parsed = JSON.parse(field);
    if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number") {
      return { lat: parsed.lat, lng: parsed.lng };
    }
  } catch {
    // ignore
  }
  return null;
}

export function PropertyMap({ locations }: { locations: PropertyLocation[] }) {
  const points = useMemo(() => {
    return locations
      .map((loc) => ({ ...loc, geo: parseGeo(loc.postgisSpatialField) }))
      .filter((loc): loc is PropertyLocation & { geo: { lat: number; lng: number } } => loc.geo !== null);
  }, [locations]);

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-sm text-gray-400">
        No geocoded properties available to plot.
      </div>
    );
  }

  const lats = points.map((p) => p.geo.lat);
  const lngs = points.map((p) => p.geo.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  const width = 800;
  const height = 360;
  const padding = 40;

  const toX = (lng: number) => padding + ((lng - minLng) / lngRange) * (width - padding * 2);
  const toY = (lat: number) => height - padding - ((lat - minLat) / latRange) * (height - padding * 2);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <radialGradient id="mapGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D1A054" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#D1A054" stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x={0} y={0} width={width} height={height} fill="#fafafa" />

        <circle cx={width / 2} cy={height / 2} r={Math.max(width, height) * 0.6} fill="url(#mapGlow)" />

        {points.map((p, i) => {
          const x = toX(p.geo.lng);
          const y = toY(p.geo.lat);
          return (
            <g key={p.propertyId}>
              <circle
                cx={x}
                cy={y}
                r={18}
                fill="#D1A054"
                fillOpacity="0.15"
                className="transition-all"
              />
              <circle
                cx={x}
                cy={y}
                r={8}
                fill="#A9710E"
                stroke="#ffffff"
                strokeWidth={2}
                className="transition-all"
              />
              <text
                x={x}
                y={y - 14}
                textAnchor="middle"
                className="text-[10px] font-semibold fill-[#5D4037]"
              >
                {p.title}
              </text>
              <text
                x={x}
                y={y + 24}
                textAnchor="middle"
                className="text-[9px] fill-gray-500"
              >
                {p.location}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
