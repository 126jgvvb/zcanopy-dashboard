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

  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);

  const canManage = can(admin?.role, "manage_finances");

  async function handleSendOtp(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError("Enter a valid amount.");
      return;
    }
    setError(null);
    setResult(null);
    setSubmitting(true);
    try {
      const res = await adminApi.sendWithdrawalOtp(admin!.token, {
        email: admin!.email,
        amount: Number(amount),
        walletType: "platform_commission",
      });
      setResult(res?.message ?? "OTP sent to your email.");
      setOtpSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send OTP.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setVerifying(true);
    try {
      const res = await adminApi.verifyWithdrawalOtp(admin!.token, {
        email: admin!.email,
        otp,
      });
      if (res?.valid) {
        setVerified(true);
        setResult("OTP verified. You can now withdraw.");
      } else {
        setError(res?.message ?? "Invalid OTP.");
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "OTP verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!verified) {
      setError("Verify the withdrawal OTP first.");
      return;
    }
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
      setOtp("");
      setOtpSent(false);
      setVerified(false);
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

            {!otpSent && (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}
              >
                {submitting ? "Sending OTP…" : "Send Withdrawal OTP"}
              </button>
            )}

            {otpSent && !verified && (
              <form onSubmit={handleVerifyOtp} className="space-y-3">
                <label className="flex flex-col gap-1 text-sm font-medium">
                  Enter OTP sent to {admin?.email}
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="rounded-xl border border-gray-300 bg-white px-3 py-2 outline-none focus:border-[var(--zcanopy-primary)]"
                  />
                </label>
                <button
                  type="submit"
                  disabled={verifying}
                  className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                  style={{ backgroundColor: COLORS.primary }}
                >
                  {verifying ? "Verifying…" : "Verify OTP"}
                </button>
              </form>
            )}

            {verified && (
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: COLORS.primary }}
              >
                {submitting ? "Processing…" : "Withdraw"}
              </button>
            )}

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {result ? <p className="text-sm text-green-600">{result}</p> : null}
          </form>
        )}
      </Panel>
    </div>
  );
}
