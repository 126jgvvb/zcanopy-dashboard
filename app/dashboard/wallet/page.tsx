"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAdminData, Panel, StatCard } from "@/components/ui";
import { adminApi, ApiError } from "@/lib/api";
import { COLORS, can } from "@/lib/theme";

const currency = (n: number, cur = "UGX") =>
  `${cur} ${Number(n || 0).toLocaleString("en-UG")}`;

export default function WalletPage() {
  const { admin } = useAuth();
  const wallet = useAdminData((token) => adminApi.wallet(token));

  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [provider, setProvider] = useState<"MTN" | "AIRTEL">("MTN");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canManage = can(admin?.role, "manage_finances");

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const res = await adminApi.withdraw(admin!.token, {
        amount: Number(amount),
        phoneNumber: phone,
        provider,
      });
      setResult(res?.message ?? "Withdrawal initiated.");
      wallet.reload();
      setAmount("");
      setPhone("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Withdrawal failed.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Wallet Balance"
          value={
            wallet.loading
              ? "…"
              : currency(wallet.data?.balance ?? 0, wallet.data?.currency)
          }
          hint={wallet.data?.name}
        />
      </div>

      <Panel title="Withdraw to Mobile Money">
        {!canManage ? (
          <p className="py-4 text-sm text-gray-400">
            You do not have permission to perform withdrawals.
          </p>
        ) : (
          <form onSubmit={handleWithdraw} className="max-w-md space-y-4">
            <label className="flex flex-col gap-1 text-sm font-medium">
              Amount (UGX)
              <input
                type="number"
                required
                min={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--zcanopy-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Phone Number
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--zcanopy-primary)]"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium">
              Provider
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value as "MTN" | "AIRTEL")}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--zcanopy-primary)]"
              >
                <option value="MTN">MTN</option>
                <option value="AIRTEL">AIRTEL</option>
              </select>
            </label>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {result ? (
              <p className="text-sm text-green-600">{result}</p>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: COLORS.primary }}
            >
              {submitting ? "Processing…" : "Withdraw"}
            </button>
          </form>
        )}
      </Panel>
    </div>
  );
}
