/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi, formatDate } from "@/lib/api";
import { COLORS } from "@/lib/theme";
import { FileType } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import SearchFilters from "@/components/SearchFilters";
import FilterUsageChart from "@/components/FilterUsageChart";

const PAGE_SIZE = 20;

function sortByIdDesc(searches: any[]): any[] {
  return [...searches].sort((a, b) => {
    const numA = parseInt(a.id?.replace(/\D/g, "") || "0", 10) || 0;
    const numB = parseInt(b.id?.replace(/\D/g, "") || "0", 10) || 0;
    return numB - numA;
  });
}

export default function SearchesPage() {
  const [filters, setFilters] = useState({
    customerId: undefined as string | undefined,
    query: undefined as string | undefined,
    queryPresence: "all" as "all" | "with_query" | "no_query",
    propertyType: undefined as string | undefined,
    location: undefined as string | undefined,
    brokerCode: undefined as string | undefined,
    brokerBrandName: undefined as string | undefined,
    subCounty: undefined as string | undefined,
    district: undefined as string | undefined,
    minPrice: undefined as string | undefined,
    maxPrice: undefined as string | undefined,
    fromDate: undefined as string | undefined,
    toDate: undefined as string | undefined,
  });
  const [page, setPage] = useState(1);
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const searches = useAdminData(
    (token) =>
      adminApi.searches(token, page, PAGE_SIZE, {
        customerId: filters.customerId,
        query: filters.query,
        propertyType: filters.propertyType,
        location: filters.location,
        brokerCode: filters.brokerCode,
        brokerBrandName: filters.brokerBrandName,
        subCounty: filters.subCounty,
        district: filters.district,
        minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
        maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
        fromDate: filters.fromDate,
        toDate: filters.toDate,
      }),
    [
      page,
      filters.customerId,
      filters.query,
      filters.propertyType,
      filters.location,
      filters.brokerCode,
      filters.brokerBrandName,
      filters.subCounty,
      filters.district,
      filters.minPrice,
      filters.maxPrice,
      filters.fromDate,
      filters.toDate,
    ],
  );

  const allSearches = useAdminData(
    (token) => adminApi.searches(token, 1, 1000),
    [],
  );

  const data = searches.data as { searches?: any[]; total?: number } | undefined;

  const sortedSearches = sortByIdDesc(data?.searches ?? []);

  const filtered = sortedSearches.filter((s: any) => {
    if (filters.queryPresence === "with_query" && !s.query) return false;
    if (filters.queryPresence === "no_query" && s.query) return false;
    return true;
  });

  const total = data?.total ?? 0;
  const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const formatFilters = (filters: any) => {
    if (!filters || typeof filters === "string") {
      try {
        const parsed = filters ? JSON.parse(filters) : {};
        return Object.entries(parsed)
          .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
          .map(([k, v]) => `${k}: ${v}`)
          .join(", ");
      } catch {
        return "";
      }
    }
    return Object.entries(filters)
      .filter(([_, v]) => v !== undefined && v !== "" && v !== null)
      .map(([k, v]) => `${k}: ${v}`)
      .join(", ");
  };

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters({
      customerId: undefined,
      query: undefined,
      queryPresence: "all",
      propertyType: undefined,
      location: undefined,
      brokerCode: undefined,
      brokerBrandName: undefined,
      subCounty: undefined,
      district: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
    setPage(1);
  };

  const handleGeneratePDF = async () => {
    const allData = (allSearches.data as { searches?: any[] })?.searches ?? [];
    if (allData.length === 0) return;

    setPdfGenerating(true);
    try {
      const doc = new jsPDF();
      const primaryColor: [number, number, number] = [169, 113, 14];
      const accentGold: [number, number, number] = [209, 160, 84];
      const cardBrown: [number, number, number] = [93, 64, 55];

      const addSectionTitle = (title: string, y: number) => {
        doc.setFontSize(12);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, y);
        return y + 7;
      };

      const addKeyValue = (key: string, value: string, y: number) => {
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);
        doc.setFont("helvetica", "bold");
        doc.text(`${key}:`, 14, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(50, 50, 50);
        doc.text(value, 42, y);
        return y + 5;
      };

      let y = 16;

      const logoDataUrl = await (async () => {
        try {
          const res = await fetch("/logo.svg");
          const svgText = await res.text();
          const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
          const url = URL.createObjectURL(blob);
          const img = new Image();
          img.crossOrigin = "anonymous";
          return await new Promise<string | null>((resolve) => {
            img.onload = () => {
              const canvas = document.createElement("canvas");
              canvas.width = 120;
              canvas.height = 120;
              const ctx = canvas.getContext("2d");
              if (!ctx) { URL.revokeObjectURL(url); resolve(null); return; }
              ctx.fillStyle = "white";
              ctx.fillRect(0, 0, 120, 120);
              ctx.drawImage(img, 0, 0, 120, 120);
              URL.revokeObjectURL(url);
              resolve(canvas.toDataURL("image/png"));
            };
            img.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
            img.src = url;
          });
        } catch {
          return null;
        }
      })();

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, "PNG", 14, y, 24, 24);
      }
      doc.setFontSize(20);
      doc.setTextColor(...primaryColor);
      doc.setFont("helvetica", "bold");
      doc.text("ZCanopy Admin Dashboard", 44, y + 6);
      doc.setFontSize(13);
      doc.setTextColor(...cardBrown);
      doc.setFont("helvetica", "normal");
      doc.text("Customer Searches Report", 44, y + 14);
      y += 30;

      doc.setDrawColor(...accentGold);
      doc.setLineWidth(0.5);
      doc.line(14, y, 196, y);
      y += 8;

      const withQuery = allData.filter((s: any) => s.query).length;
      const withoutQuery = allData.length - withQuery;
      const typeCounts: Record<string, number> = {};
      allData.forEach((s: any) => {
        const t = s.propertyType || "Unknown";
        typeCounts[t] = (typeCounts[t] || 0) + 1;
      });
      const sortedTypes = Object.entries(typeCounts).sort(([, a], [, b]) => (b as number) - (a as number));
      const maxCount = Math.max(...sortedTypes.map(([, v]) => v as number), 1);

      y = addSectionTitle("Summary Statistics", y);
      y = addKeyValue("Total Searches", allData.length.toString(), y);
      y = addKeyValue("With Query", `${withQuery} (${((withQuery / allData.length) * 100).toFixed(1)}%)`, y);
      y = addKeyValue("Without Query", `${withoutQuery} (${((withoutQuery / allData.length) * 100).toFixed(1)}%)`, y);
      y += 6;

      if (sortedTypes.length > 0) {
        doc.setFontSize(10);
        doc.setTextColor(...cardBrown);
        doc.setFont("helvetica", "bold");
        doc.text("Searches by Property Type", 14, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text("(Most to Least)", 14, y + 4);
        y += 8;

        const barHeight = 10;
        const barGap = 4;
        const labelWidth = 30;
        const startX = 14 + labelWidth;
        const maxBarWidth = 140;

        sortedTypes.forEach(([type, count], i) => {
          const countNum = count as number;
          const barWidth = (countNum / maxCount) * maxBarWidth;
          const barY = y + i * (barHeight + barGap);
          doc.setFillColor(...primaryColor);
          doc.roundedRect(startX, barY, Math.max(barWidth, 2), barHeight, 1, 1, "F");
          doc.setTextColor(40, 40, 40);
          doc.text(countNum.toString(), startX + barWidth + 2, barY + barHeight - 2);
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100);
          doc.text(type.charAt(0).toUpperCase() + type.slice(1), startX + maxBarWidth + 4, barY + barHeight - 2);
        });
        y += sortedTypes.length * (barHeight + barGap) + 10;
      }

      doc.setFontSize(10);
      doc.setTextColor(...cardBrown);
      doc.setFont("helvetica", "bold");
      doc.text("Query Presence Overview", 14, y);
      y += 6;

      const totalQ = withQuery + withoutQuery;
      if (totalQ > 0) {
        const barY = y;
        const barHeight = 10;
        const barGap = 4;
        const maxBarWidth = 90;

        const withPct = withQuery / totalQ;
        const withoutPct = withoutQuery / totalQ;

        doc.setFillColor(...primaryColor);
        doc.roundedRect(14, barY, withPct * maxBarWidth, barHeight, 1, 1, "F");
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(7);
        doc.text(`With Query (${withQuery}) — ${withPct.toFixed(0)}%`, 14 + withPct * maxBarWidth + 2, barY + barHeight - 2);

        y += barHeight + barGap;
        doc.setFillColor(...accentGold);
        doc.roundedRect(14, y, withoutPct * maxBarWidth, barHeight, 1, 1, "F");
        doc.setTextColor(40, 40, 40);
        doc.setFontSize(7);
        doc.text(`Without Query (${withoutQuery}) — ${withoutPct.toFixed(0)}%`, 14 + withoutPct * maxBarWidth + 2, y + barHeight - 2);

        y += barHeight + 10;
      } else {
        y += 8;
      }
      doc.setDrawColor(...accentGold);
      doc.setLineWidth(0.3);
      doc.line(14, y, 196, y);
      y += 8;

      y = addSectionTitle("Search Records", y);
      doc.setFontSize(8);
      doc.setTextColor(90, 90, 90);
      doc.setFont("helvetica", "normal");
      doc.text(`Report contains ${allData.length} search record(s).`, 14, y);
      y += 5;

      const searchRows = allData.map((s: any) => [
        s.id,
        s.customerId || "—",
        s.query || "—",
        s.location || "—",
        s.propertyType || "—",
        s.radius ? `${s.radius} km` : "—",
        s.minPrice || s.maxPrice ? `${s.minPrice || 0} — ${s.maxPrice || 0}` : "—",
        `${s.subCounty || ""} / ${s.district || ""}`,
        formatFilters(s.filters) || "—",
        s.resultCount ?? 0,
        Array.isArray(s.resultPropertyIds) && s.resultPropertyIds.length > 0
          ? s.resultPropertyIds.slice(0, 3).join(", ") + (s.resultPropertyIds.length > 3 ? ` +${s.resultPropertyIds.length - 3}` : "")
          : "—",
        formatDate(s.createdAt),
      ]);

      autoTable(doc, {
        startY: y,
        head: [["ID", "Customer", "Query", "Location", "Type", "Radius", "Price Range", "County/District", "Filters", "Results", "Property IDs", "Created"]],
        body: searchRows,
        theme: "striped",
        headStyles: { fillColor: primaryColor, textColor: 255, fontSize: 6 },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 6 },
        didDrawPage: (data: any) => {
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(7);
          doc.setTextColor(150, 150, 150);
          doc.text(
            `Generated on ${new Date().toLocaleString()} | ZCanopy Admin Dashboard | Page ${pageCount} of ${doc.getNumberOfPages()}`,
            14, 285
          );
        },
      });

      doc.save(`searches-report-${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setPdfGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">
            Customer Searches
          </h2>
          <p className="text-sm text-gray-500">Recent search activity across customer sessions.</p>
        </div>
        <button
          onClick={handleGeneratePDF}
          disabled={pdfGenerating || allSearches.loading || !allSearches.data}
          className="hover-gold inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md disabled:opacity-60"
          style={{ backgroundColor: COLORS.accentGold }}
        >
          <FileType className="h-4 w-4" />
          {pdfGenerating ? "Generating..." : "Download PDF"}
        </button>
      </div>

      <Panel title="Filters">
        <SearchFilters filters={filters} onChange={handleFilterChange} onReset={resetFilters} />
      </Panel>

      <Panel title="Filter Usage Analytics">
        {allSearches.loading ? (
          <LoadingState label="Loading analytics" />
        ) : allSearches.error ? (
          <ErrorState message={allSearches.error} />
        ) : (
          <FilterUsageChart
            searches={(allSearches.data as { searches?: any[] })?.searches ?? []}
          />
        )}
      </Panel>

      <Panel title={`Searches (${filtered.length} on this page)`}>
        {searches.loading ? (
          <LoadingState label="Loading searches" />
        ) : searches.error ? (
          <ErrorState message={searches.error} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No searches found.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2 pr-4">ID</th>
                  <th className="py-2 pr-4">Customer ID</th>
                  <th className="py-2 pr-4">Query</th>
                  <th className="py-2 pr-4">Location</th>
                  <th className="py-2 pr-4">Type</th>
                  <th className="py-2 pr-4">Radius (km)</th>
                  <th className="py-2 pr-4">Price Range</th>
                  <th className="py-2 pr-4">County / District</th>
                  <th className="py-2 pr-4">Filters</th>
                  <th className="py-2 pr-4">Result Count</th>
                  <th className="py-2 pr-4">Result Property IDs</th>
                  <th className="py-2">Created At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s: any) => (
                  <tr key={s.id} className="hover:bg-[#D1A054]/5 transition-colors">
                    <td className="py-2.5 pr-4 font-mono text-xs">{s.id}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{s.customerId || "—"}</td>
                    <td className="py-2.5 pr-4">{s.query || "—"}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{s.location || "—"}</td>
                    <td className="py-2.5 pr-4">{s.propertyType || "—"}</td>
                    <td className="py-2.5 pr-4">{s.radius ? `${s.radius} km` : "—"}</td>
                    <td className="py-2.5 pr-4">
                      {s.minPrice || s.maxPrice ? `${s.minPrice || 0} \u2014 ${s.maxPrice || 0}` : "—"}
                    </td>
                    <td className="py-2.5 pr-4">
                      {s.subCounty || s.district ? `${s.subCounty || ""} / ${s.district || ""}` : "—"}
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-gray-500">
                      {formatFilters(s.filters) || "—"}
                    </td>
                    <td className="py-2.5 pr-4">{s.resultCount ?? 0}</td>
                    <td className="py-2.5 pr-4 font-mono text-xs">
                      {Array.isArray(s.resultPropertyIds) && s.resultPropertyIds.length > 0
                        ? s.resultPropertyIds.slice(0, 5).join(", ") + (s.resultPropertyIds.length > 5 ? ` +${s.resultPropertyIds.length - 5} more` : "")
                        : "—"}
                    </td>
                    <td className="py-2.5 text-gray-500">
                      {s.createdAt ? new Date(s.createdAt).toLocaleString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          disabled={page <= 1 || searches.loading}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-3 py-2 text-sm text-gray-500">
          Page {page} of {lastPage}
        </span>
        <button
          disabled={page >= lastPage || searches.loading}
          onClick={() => setPage((p) => Math.min(lastPage, p + 1))}
          className="hover-gold rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm disabled:opacity-50"
        >
          Next
        </button>
        <span className="px-3 py-2 text-sm text-gray-400">
          {total} search{total === 1 ? "" : "es"}
        </span>
      </div>
    </div>
  );
}
