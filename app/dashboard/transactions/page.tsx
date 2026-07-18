/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";

const currency = (n: number) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

export default function TransactionsPage() {
  const [page, setPage] = useState(1);

  const tx = useAdminData(
    (token) => adminApi.transactions(token, page, 20),
    [page],
  );

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">
        Transactions ({tx.data?.total ?? 0})
      </h2>

      <Panel title="All Transactions">
        {tx.loading ? (
          <LoadingState label="Loading transactions" />
        ) : tx.error ? (
          <ErrorState message={tx.error} />
        ) : (tx.data?.transactions?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No transactions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Date</th>
                  <th className="py-2 pr-4">Recipient</th>
                  <th className="py-2 pr-4">Reason</th>
                  <th className="py-2 pr-4">Amount</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(tx.data?.transactions ?? []).map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 text-gray-500">
                      {t.date ? new Date(t.date).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-2.5 pr-4 font-medium">{t.recipientName}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{t.reason}</td>
                    <td className="py-2.5 pr-4 font-semibold">
                      {currency(t.amount)}
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                        {t.status}
                      </span>
                    </td>
                    <td className="py-2.5 text-xs text-gray-400">
                      {t.referenceNumber}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <div className="flex justify-center gap-2">
        <button
          disabled={page <= 1}
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          className="rounded-lg bg-white px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Previous
        </button>
        <span className="px-2 py-1.5 text-sm text-gray-500">Page {page}</span>
        <button
          disabled={(tx.data?.transactions?.length ?? 0) < 20}
          onClick={() => setPage((p) => p + 1)}
          className="rounded-lg bg-white px-3 py-1.5 text-sm disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
