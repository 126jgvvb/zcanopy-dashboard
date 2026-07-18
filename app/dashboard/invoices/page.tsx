/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  useAdminData,
  Panel,
  LoadingState,
  ErrorState,
} from "@/components/ui";
import { adminApi, ApiError } from "@/lib/api";
import { COLORS, can } from "@/lib/theme";

const STATUSES = ["all", "sent", "pending", "failed"] as const;

function formatCurrency(amount: number, currency: string) {
  try {
    return new Intl.NumberFormat("en-UG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-UG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function InvoicesPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const invoices = useAdminData((token) =>
    adminApi.invoices(token, 1, 20, status === "all" ? undefined : status),
  );

  const canManage = can(admin?.role, "manage_finances");
  const rows: any[] = invoices.data?.invoices ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });
  }

  async function handleDelete(ids: string[]) {
    if (ids.length === 0) return;
    setActionError(null);
    setDeleting(true);
    try {
      if (ids.length === 1) {
        await adminApi.deleteInvoice(admin!.token, ids[0]);
      } else {
        await adminApi.deleteInvoices(admin!.token, ids);
      }
      setSelected(new Set());
      invoices.reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : "Failed to delete invoice(s).");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                status === s
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={status === s ? { backgroundColor: COLORS.primary } : {}}
            >
              {s === "all" ? "All invoices" : s}
            </button>
          ))}
        </div>
        {canManage && selected.size > 0 ? (
          <button
            disabled={deleting}
            onClick={() => handleDelete([...selected])}
            className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200 disabled:opacity-60"
          >
            {deleting ? "Deleting…" : `Delete (${selected.size})`}
          </button>
        ) : null}
      </div>

      {actionError ? <ErrorState message={actionError} /> : null}

      <Panel title="Invoices">
        {invoices.loading ? (
          <LoadingState label="Loading invoices" />
        ) : invoices.error ? (
          <ErrorState message={invoices.error} />
        ) : (
          <InvoiceTable
            rows={rows}
            canManage={canManage}
            selected={selected}
            allSelected={allSelected}
            onToggle={toggle}
            onToggleAll={toggleAll}
            onView={(id) => router.push(`/dashboard/invoices/${id}`)}
            onDelete={(id) => handleDelete([id])}
            deleting={deleting}
          />
        )}
      </Panel>
    </div>
  );
}

function InvoiceTable({
  rows,
  canManage,
  selected,
  allSelected,
  onToggle,
  onToggleAll,
  onView,
  onDelete,
  deleting,
}: {
  rows: any[];
  canManage: boolean;
  selected: Set<string>;
  allSelected: boolean;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No invoices found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="w-10 py-3 pr-2">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onToggleAll}
                aria-label="Select all invoices"
                className="h-4 w-4 cursor-pointer accent-[var(--zcanopy-primary)]"
              />
            </th>
            <th className="py-3 pr-4">Invoice</th>
            <th className="py-2 pr-4">Recipient</th>
            <th className="py-2 pr-4">Issue Date</th>
            <th className="py-2 pr-4">Due Date</th>
            <th className="py-2 pr-4">Amount</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((inv) => (
            <tr
              key={inv.id}
              className={`group transition-colors hover:bg-[#D1A054]/5 ${
                selected.has(inv.id) ? "bg-[#D1A054]/10" : ""
              }`}
            >
              <td className="py-3 pr-2">
                <input
                  type="checkbox"
                  checked={selected.has(inv.id)}
                  onChange={() => onToggle(inv.id)}
                  aria-label={`Select ${inv.invoiceNumber}`}
                  className="h-4 w-4 cursor-pointer accent-[var(--zcanopy-primary)]"
                />
              </td>
              <td className="py-3 pr-4">
                <div className="font-medium font-mono">{inv.invoiceNumber}</div>
                <div className="max-w-[220px] truncate text-xs text-gray-400">
                  {inv.description}
                </div>
              </td>
              <td className="py-3 pr-4">
                <div className="font-medium">{inv.recipientName}</div>
                <div className="text-xs text-gray-400">
                  {inv.brokerCode} · {inv.recipientEmail}
                </div>
              </td>
              <td className="py-2 pr-4 text-gray-500">{formatDate(inv.issueDate)}</td>
              <td className="py-2 pr-4 text-gray-500">{formatDate(inv.dueDate)}</td>
              <td className="py-2 pr-4 font-semibold">
                {formatCurrency(inv.amount, inv.currency)}
              </td>
              <td className="py-2 pr-4">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    inv.status === "sent"
                      ? "bg-green-100 text-green-700"
                      : inv.status === "pending"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-red-100 text-red-700"
                  }`}
                >
                  {inv.status}
                </span>
              </td>
              <td className="py-3">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onView(inv.id)}
                    className="hover-gold rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700"
                  >
                    View
                  </button>
                  {canManage ? (
                    <button
                      disabled={deleting}
                      onClick={() => onDelete(inv.id)}
                      className="hover-gold rounded-lg bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-60"
                    >
                      Delete
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
