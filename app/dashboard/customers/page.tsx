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
import { adminApi } from "@/lib/api";
import { COLORS, can } from "@/lib/theme";
import { Eye, Search } from "lucide-react";
import { formatDate } from "@/lib/api";

export default function CustomersPage() {
  const { admin } = useAuth();
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [search, setSearch] = useState("");

  const allCustomers = useAdminData(
    (token) => adminApi.customers(token, 1, 50),
    [],
  );

  const filteredCustomers = (allCustomers.data?.customers ?? []).filter((c: any) => {
    const updatedAt = new Date(c.updatedAt);
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 1);
    const computedActive = updatedAt > cutoff;
    if (filter !== "all") {
      const matchStatus = filter === "active" ? computedActive : !computedActive;
      if (!matchStatus) return false;
    }
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      c.firstName?.toLowerCase().includes(query) ||
      c.lastName?.toLowerCase().includes(query) ||
      c.email?.toLowerCase().includes(query) ||
      c.phoneNumber?.toLowerCase().includes(query)
    );
  });

  const customers = {
    loading: allCustomers.loading,
    error: allCustomers.error,
    data: allCustomers.data
      ? {
          customers: filteredCustomers,
          total: filteredCustomers.length,
          page: 1,
          limit: filteredCustomers.length,
        }
      : null,
  };

  const canManage = can(admin?.role, "manage_customers");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                filter === f
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={filter === f ? { backgroundColor: COLORS.primary } : {}}
            >
              {f === "all" ? "All Customers" : f === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone"
          className="w-full bg-transparent text-sm outline-none"
        />
      </div>

      <Panel title="Customers">
        {customers.loading ? (
          <LoadingState label="Loading customers" />
        ) : customers.error ? (
          <ErrorState message={customers.error} />
        ) : (
          <CustomerTable
            rows={customers.data?.customers ?? []}
            canManage={canManage}
            onView={(id) => router.push(`/dashboard/customers/${id}`)}
          />
        )}
      </Panel>
    </div>
  );
}

function CustomerTable({
  rows,
  canManage,
  onView,
}: {
  rows: Array<{
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    isActive: boolean;
    createdAt: number;
    updatedAt: number;
  }>;
  canManage: boolean;
  onView: (id: string) => void;
}) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-400">No customers found.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr>
            <th className="py-3 pr-4">Customer</th>
            <th className="py-2 pr-4">Email</th>
            <th className="py-2 pr-4">Phone</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2 pr-4">Joined</th>
            <th className="py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((c) => {
            const updatedAt = new Date(c.updatedAt);
            const cutoff = new Date();
            cutoff.setMonth(cutoff.getMonth() - 1);
            const computedActive = updatedAt > cutoff;

            return (
              <tr key={c.id} className="group transition-colors hover:bg-[#D1A054]/5">
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: COLORS.primary }}>
                      {c.firstName?.charAt(0).toUpperCase()}{c.lastName?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">{c.firstName} {c.lastName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-4 text-gray-500">{c.email}</td>
                <td className="py-3 pr-4 text-gray-500">{c.phoneNumber || "—"}</td>
                <td className="py-2 pr-4">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      computedActive
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {computedActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="py-2 pr-4 text-gray-500">
                  {formatDate(c.createdAt)}
                </td>
                <td className="py-3">
                  <div className="flex flex-wrap gap-2">
                    {canManage && (
                      <button
                        onClick={() => onView(c.id)}
                        className="hover-gold flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        View
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
