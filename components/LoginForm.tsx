"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ZLoadingIndicator from "@/components/ZLoadingIndicator";
import { COLORS } from "@/lib/theme";
import { ApiError } from "@/lib/api";

const DEV_ACCOUNTS = [
  { label: "Super Admin", email: "superadmin@zcanopy.dev", password: "superadmin123", role: "super_admin" },
  { label: "Admin", email: "admin@zcanopy.dev", password: "admin123", role: "admin" },
  { label: "Support", email: "support@zcanopy.dev", password: "support123", role: "support" },
];

export default function LoginForm({
  redirect,
}: {
  redirect?: string;
}) {
  const router = useRouter();
  const { admin, login, devLogin, bypass, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [devBusy, setDevBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && admin) {
      router.replace("/dashboard");
    }
  }, [admin, authLoading, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(redirect || "/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Unable to sign in. Please check your credentials.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDevLogin(devEmail: string, devPassword: string) {
    setError(null);
    setDevBusy(devEmail);
    try {
      await devLogin(devEmail, devPassword);
      router.replace(redirect || "/dashboard");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Dev login failed.",
      );
    } finally {
      setDevBusy(null);
    }
  }

  function handleBypass() {
    bypass();
    router.replace(redirect || "/dashboard");
  }

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <ZLoadingIndicator size={72} color={COLORS.primary} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-8 shadow-[var(--zcanopy-shadow-md)]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <ZLoadingIndicator size={56} color={COLORS.primary} />
          <h1 className="text-2xl font-semibold tracking-tight text-[var(--zcanopy-card-brown)]">
            ZCanopy Admin
          </h1>
          <p className="text-sm text-[var(--zcanopy-muted)]">Sign in to your admin console</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--zcanopy-card-brown)]">
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2.5 outline-none"
              placeholder="admin@zcanopy.com"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--zcanopy-card-brown)]">
            Password
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2.5 outline-none"
              placeholder="••••••••"
            />
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-[var(--zcanopy-primary)] px-4 py-2.5 font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md disabled:opacity-60"
          >
            {submitting ? (
              <ZLoadingIndicator size={20} color="#ffffff" strokeWidth={3} />
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        <div className="mt-6">
          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--zcanopy-muted)]">
            Dev quick-login
          </p>
          <div className="grid grid-cols-3 gap-2">
            {DEV_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                onClick={() => handleDevLogin(acc.email, acc.password)}
                disabled={devBusy !== null}
                className="rounded-xl border border-[var(--zcanopy-border)] px-2 py-2.5 text-xs font-medium transition-colors hover:border-[var(--zcanopy-primary)] hover:text-[var(--zcanopy-primary)] disabled:opacity-50"
              >
                {devBusy === acc.email ? (
                  <ZLoadingIndicator size={14} color={COLORS.primary} strokeWidth={2} />
                ) : (
                  <>
                    <span className="block font-semibold">{acc.label}</span>
                    <span className="block text-[10px] normal-case opacity-70">{acc.role}</span>
                  </>
                )}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={handleBypass}
            className="mt-3 w-full rounded-xl border-2 border-dashed border-[var(--zcanopy-border)] px-4 py-2.5 text-sm font-semibold text-[var(--zcanopy-muted)] transition-colors hover:border-[var(--zcanopy-primary)] hover:text-[var(--zcanopy-primary)]"
          >
            Bypass login entirely (dev)
          </button>
          <p className="mt-2 text-center text-[10px] text-gray-400">
            For development only. Remove before production.
          </p>
        </div>
      </div>
    </div>
  );
}
