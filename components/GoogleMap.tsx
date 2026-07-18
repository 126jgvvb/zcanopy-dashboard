"use client";

import { useEffect, useRef, useMemo, useState } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

export interface PropertyLocation {
  propertyId: string;
  title: string;
  location: string;
  postgisSpatialField: string | null;
  brokerCode: string;
}

function parseGeo(field: string | null): { lat: number; lng: number } | null {
  if (!field) return null;

  // The backend serializes the geo field as a JSON string, e.g. '{"lat":..,"lng":..}'.
  // Be defensive: also accept an already-parsed object in case a caller passes one.
  let parsed: unknown = field;
  if (typeof field === "string") {
    try {
      parsed = JSON.parse(field);
    } catch {
      return null;
    }
  }

  if (
    parsed &&
    typeof parsed === "object" &&
    typeof (parsed as { lat?: unknown }).lat === "number" &&
    typeof (parsed as { lng?: unknown }).lng === "number"
  ) {
    const { lat, lng } = parsed as { lat: number; lng: number };
    return { lat, lng };
  }

  return null;
}

const SCRIPT_ID = "google-maps-script";

export function GoogleMap({ locations }: { locations: PropertyLocation[] }) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapsReady, setMapsReady] = useState(false);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const hasApiKey = !!apiKey && apiKey !== "YOUR_GOOGLE_MAPS_API_KEY";

  const points = useMemo(() => {
    return locations
      .map((loc) => ({ ...loc, geo: parseGeo(loc.postgisSpatialField) }))
      .filter(
        (loc): loc is PropertyLocation & { geo: { lat: number; lng: number } } =>
          loc.geo !== null,
      );
  }, [locations]);

  // Load the Google Maps JS API once, and flip `mapsReady` when it is available.
  useEffect(() => {
    if (!hasApiKey) return;

    if (window.google?.maps) {
      setMapsReady(true);
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => setMapsReady(true));
      // In case it finished loading between the check above and now.
      if (window.google?.maps) setMapsReady(true);
      return;
    }

    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.addEventListener("load", () => setMapsReady(true));
    document.head.appendChild(script);
    // Note: we intentionally do NOT remove the script on unmount so the API
    // stays cached across navigations and re-renders.
  }, [apiKey, hasApiKey]);

  // Draw / redraw markers once the API is ready and whenever the points change.
  useEffect(() => {
    if (!mapsReady) return;
    if (!window.google?.maps) return;
    if (!mapRef.current) return;

    if (!mapInstanceRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        center: { lat: 0.3476, lng: 32.5825 },
        zoom: 12,
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    // Clear any previous markers before re-plotting.
    markersRef.current.forEach((m: any) => m.setMap(null));
    markersRef.current = [];

    const map = mapInstanceRef.current;
    const bounds = new window.google.maps.LatLngBounds();

    points.forEach((p) => {
      const marker = new window.google.maps.Marker({
        position: { lat: p.geo.lat, lng: p.geo.lng },
        map,
        title: p.title,
        label: {
          text: "📍",
          fontSize: "16px",
        },
      });

      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div style="font-family: sans-serif; padding: 8px; min-width: 200px;">
            <h3 style="margin: 0 0 4px; font-size: 14px; font-weight: 600; color: #5D4037;">${p.title}</h3>
            <p style="margin: 0; font-size: 12px; color: #666;">${p.location}</p>
            <p style="margin: 4px 0 0; font-size: 11px; color: #A9710E; font-weight: 500;">${p.brokerCode}</p>
          </div>
        `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      markersRef.current.push(marker);
      bounds.extend({ lat: p.geo.lat, lng: p.geo.lng });
    });

    if (points.length > 0) {
      map.fitBounds(bounds, 50);
    }

    return () => {
      markersRef.current.forEach((m: any) => m.setMap(null));
      markersRef.current = [];
    };
  }, [points, mapsReady]);

  if (!hasApiKey) {
    return (
      <div className="flex flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-amber-300 bg-amber-50 py-16 px-6 text-center">
        <p className="text-sm font-medium text-amber-800">Map unavailable</p>
        <p className="text-xs text-amber-700">
          Set <code className="rounded bg-amber-100 px-1">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in
          the dashboard&apos;s <code className="rounded bg-amber-100 px-1">.env.local</code> and restart the dev server.
        </p>
      </div>
    );
  }

  if (points.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50 py-16 text-sm text-gray-400">
        No geocoded properties available to plot.
      </div>
    );
  }

  return (
    <div className="relative">
      {!mapsReady && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-gray-100 text-sm text-gray-400">
          Loading map…
        </div>
      )}
      <div
        ref={mapRef}
        className="h-[500px] w-full rounded-2xl border border-gray-200 bg-gray-100"
      />
    </div>
  );
}
