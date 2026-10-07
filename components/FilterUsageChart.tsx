/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useMemo } from "react";
import { Panel } from "@/components/ui";

const FILTER_LABELS: Record<string, string> = {
  propertyType: "Property Type",
  location: "Location",
  brokerCode: "Broker Code",
  brokerBrandName: "Broker Brand",
  subCounty: "Sub County",
  district: "District",
  minPrice: "Min Price",
  maxPrice: "Max Price",
  fromDate: "From Date",
  toDate: "To Date",
  radiusKm: "Radius",
  lat: "Latitude",
  lng: "Longitude",
};

const CHART_COLORS = [
  "#A9710E", "#C98F2D", "#8B5E00", "#D4A72C", "#B88A1A",
  "#E6C24A", "#C49A3C", "#D9B052", "#F0C75B", "#E0B144",
];

interface ChartBarProps {
  label: string;
  value: number;
  maxValue: number;
  color: string;
  index: number;
}

function ChartBar({ label, value, maxValue, color }: ChartBarProps) {
  const height = Math.max(4, (value / maxValue) * 100);
  return (
    <div className="flex flex-col items-center flex-1 min-w-[60px] h-full">
      <div className="relative w-full h-44">
        <div
          className="w-full rounded-t-lg transition-all duration-500 ease-out hover:brightness-110"
          style={{
            height: `${height}%`,
            minHeight: "16px",
            backgroundColor: color,
            maxHeight: "180px",
          }}
        ></div>
        <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-semibold text-gray-700">
          {value}
        </span>
      </div>
      <span className="mt-2 text-xs text-gray-500 text-center leading-tight">
        {label}
      </span>
    </div>
  );
}

interface FilterUsageChartProps {
  searches: any[];
  dateRange?: { from: string; to: string };
}

export default function FilterUsageChart({ searches, dateRange }: FilterUsageChartProps) {
  const stats = useMemo(() => {
    const counts: Record<string, number> = {};
    const daily: Record<string, Record<string, number>> = {};

    const sorted = [...(searches || [])].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    sorted.forEach((s: any) => {
      const day = s.createdAt ? new Date(s.createdAt).toISOString().slice(0, 10) : "unknown";
      const filters = s.filters || {};

      Object.entries(filters).forEach(([key, val]: [string, any]) => {
        if (val !== undefined && val !== null && val !== "" && val !== 0) {
          counts[key] = (counts[key] || 0) + 1;
          if (!daily[day]) daily[day] = {};
          daily[day][key] = (daily[day][key] || 0) + 1;
        }
      });

      if (s.query) {
        counts["query"] = (counts["query"] || 0) + 1;
        if (!daily[day]) daily[day] = {};
        daily[day]["query"] = (daily[day]["query"] || 0) + 1;
      }
      if (s.location) {
        counts["location"] = (counts["location"] || 0) + 1;
        if (!daily[day]) daily[day] = {};
        daily[day]["location"] = (daily[day]["location"] || 0) + 1;
      }
    });

    const sortedDaily = Object.keys(daily)
      .sort()
      .slice(0, 7);

    return { counts, daily, sortedDaily };
  }, [searches]);

  const maxCount = Math.max(...Object.values(stats.counts), 1);

  const sortedCounts = Object.entries(stats.counts)
    .sort(([, a], [, b]) => b - a)
    .map(([key], i) => ({
      label: FILTER_LABELS[key] || key,
      value: stats.counts[key],
      color: CHART_COLORS[i % CHART_COLORS.length],
    }));

  const dailyEntries = stats.sortedDaily.map((day, i) => {
    const dayCounts: Record<string, number> = stats.daily[day] || {};
    const entries = Object.entries(dayCounts)
      .filter(([_, v]) => v > 0)
      .sort(([, a], [, b]) => b - a);

    return (
      <div key={day} className="flex flex-col items-center flex-1 min-w-[70px] h-full">
        <div className="relative w-full flex flex-col-reverse gap-0.5 h-44">
          {entries.map(([key, val], j) => {
            const color = CHART_COLORS[j % CHART_COLORS.length];
            const height = Math.max(2, (val / Math.max(...entries.map(([,v]) => v), 1)) * 100);
            return (
              <div key={key} className="relative w-full group cursor-pointer">
                <div
                  className="rounded-sm transition-all duration-300 group-hover:brightness-110"
                  style={{
                    height: `${height}%`,
                    backgroundColor: color,
                  }}
                  title={`${FILTER_LABELS[key] || key}: ${val} uses`}
                ></div>
                <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-medium text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  {val}
                </span>
              </div>
            );
          })}
        </div>
        <span className="mt-2 text-xs text-gray-500">
          {new Date(day).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </span>
      </div>
    );
  });

  return (
    <div className="space-y-6">
      <Panel title="Filter Usage Frequency (Most Preferred)">
        <div className="flex items-end justify-end gap-2 mb-3">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
            <span>Most used</span>
          </div>
        </div>
        <div className="flex items-end justify-between gap-3 h-56">
          {sortedCounts.length === 0 ? (
            <p className="text-center text-sm text-gray-400 w-full">No filter usage data yet.</p>
          ) : (
            sortedCounts.map((item, i) => (
              <ChartBar
                key={item.label}
                label={item.label}
                value={item.value}
                maxValue={maxCount}
                color={item.color}
                index={i}
              />
            ))
          )}
        </div>
      </Panel>

      <Panel title="Daily Filter Usage (Last 7 Days)">
        {stats.sortedDaily.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No search data available.</p>
        ) : (
          <div className="flex items-end justify-between gap-3 h-56">
            {dailyEntries}
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
          {Object.entries(stats.counts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 5)
            .map(([key], i) => (
              <span key={key} className="flex items-center gap-1">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                ></span>
                <span>{FILTER_LABELS[key] || key}</span>
              </span>
            ))}
        </div>
      </Panel>
    </div>
  );
}
