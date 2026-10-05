"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ZLoadingIndicator from "@/components/ZLoadingIndicator";
import { COLORS } from "@/lib/theme";
import { ApiError } from "@/lib/api";
import { Eye, EyeOff } from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:4000/api';

function formatLoginError(err: unknown): string {
  if (err instanceof ApiError) {
    const msg = err.message.trim();
    if (!msg) return "Invalid email or password";
    if (/Cannot POST|Cannot GET|Failed to fetch|NetworkError|net::ERR|fetch.*failed|Unable to connect/i.test(msg)) {
      return "Unable to connect to the server. Please try again later.";
    }
    if (/not found|invalid credentials|invalid password|admin not found|bad request|unauthorized|401|403|400/i.test(msg)) {
      return "Invalid email or password";
    }
    return msg;
  }
  return "Unable to sign in. Please check your credentials.";
}

export default function LoginForm({
  redirect,
}: {
  redirect?: string;
}) {
  const router = useRouter();
  const { login, googleLogin, loading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("");
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState("");
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] = useState("");
  const [forgotPasswordStep, setForgotPasswordStep] = useState<"email" | "otp" | "reset">("email");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const targetRedirect = redirect && redirect !== "/home" && redirect !== "/" ? redirect : "/dashboard";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.replace(targetRedirect);
    } catch (err) {
      setError(formatLoginError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPasswordSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setForgotPasswordMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/forgot-password/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }
      setForgotPasswordMessage(data.message || 'OTP sent to your email.');
      setForgotPasswordStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPasswordVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setForgotPasswordMessage(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/forgot-password/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail.trim(), otp: forgotPasswordOtp.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.valid) {
        throw new Error(data.message || 'Invalid OTP');
      }
      setForgotPasswordMessage('OTP verified. Set your new password.');
      setForgotPasswordStep("reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleForgotPasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setForgotPasswordMessage(null);
    if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (forgotPasswordNewPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/admin/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotPasswordEmail.trim(), password: forgotPasswordNewPassword }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to reset password');
      }
      setForgotPasswordMessage('Password reset successfully. You can now sign in.');
      setForgotPasswordMode(false);
      setForgotPasswordStep("email");
      setForgotPasswordEmail("");
      setForgotPasswordOtp("");
      setForgotPasswordNewPassword("");
      setForgotPasswordConfirmPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password');
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    if (!window.google?.accounts?.id) return;
    window.google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
      callback: async (response: { credential?: string }) => {
        if (!response.credential) return;
        setGoogleLoading(true);
        try {
          await googleLogin(response.credential);
          router.replace(redirect || "/dashboard");
        } catch {
          setError("Google sign-in failed. Please try again.");
        } finally {
          setGoogleLoading(false);
        }
      },
    });
    if (googleButtonRef.current) {
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        width: '100%',
        text: 'signin_with',
      });
    }
  }, [login, router, redirect]);

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <ZLoadingIndicator size={72} color={COLORS.primary} label="Loading console" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-8 shadow-[var(--zcanopy-shadow-md)]">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img
            src="/logo.svg"
            alt="ZCanopy"
            className="h-14 w-14 object-contain"
          />
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
            <div className="flex items-center gap-2">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2.5 outline-none"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="flex items-center justify-center rounded-lg border border-[var(--zcanopy-border)] bg-white px-3 py-2.5 text-gray-500 hover:text-gray-700"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </label>

          {error ? (
            <p className="rounded-lg border border-red-200/80 bg-red-50/90 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => { setForgotPasswordMode(true); setError(null); setForgotPasswordMessage(null); }}
              className="text-xs font-medium text-[var(--zcanopy-primary)] hover:underline"
            >
              Forgot password?
            </button>
          </div>

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

          <div className="mt-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--zcanopy-border)]" />
            <span className="text-xs text-[var(--zcanopy-muted)]">or</span>
            <div className="h-px flex-1 bg-[var(--zcanopy-border)]" />
          </div>

          <div ref={googleButtonRef} className="mt-3 flex justify-center" />
          {googleLoading && <p className="text-center text-sm text-gray-500">Signing in with Google...</p>}
        </form>

        {forgotPasswordMode && (
          <div className="mt-6 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-6">
            <h2 className="mb-4 text-lg font-semibold text-[var(--zcanopy-card-brown)]">Reset your password</h2>
            {forgotPasswordStep === "email" && (
              <form onSubmit={handleForgotPasswordSendOtp} className="space-y-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--zcanopy-card-brown)]">
                  Email
                  <input
                    type="email"
                    required
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2.5 outline-none transition focus:border-[var(--zcanopy-primary)] focus:ring-2 focus:ring-[var(--zcanopy-primary)]/30"
                    placeholder="admin@zcanopy.com"
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {forgotPasswordMessage && <p className="text-sm text-green-600">{forgotPasswordMessage}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[var(--zcanopy-primary)] px-4 py-2.5 font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? 'Sending OTP…' : 'Send OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => { setForgotPasswordMode(false); setError(null); setForgotPasswordMessage(null); }}
                  className="w-full text-sm font-medium text-[var(--zcanopy-muted)] hover:text-[var(--zcanopy-card-brown)]"
                >
                  Back to login
                </button>
              </form>
            )}

            {forgotPasswordStep === "otp" && (
              <form onSubmit={handleForgotPasswordVerifyOtp} className="space-y-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--zcanopy-card-brown)]">
                  Enter OTP sent to {forgotPasswordEmail}
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={forgotPasswordOtp}
                    onChange={(e) => setForgotPasswordOtp(e.target.value)}
                    className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2.5 outline-none transition focus:border-[var(--zcanopy-primary)] focus:ring-2 focus:ring-[var(--zcanopy-primary)]/30"
                    placeholder="123456"
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {forgotPasswordMessage && <p className="text-sm text-green-600">{forgotPasswordMessage}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[var(--zcanopy-primary)] px-4 py-2.5 font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? 'Verifying…' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={() => { setForgotPasswordStep("email"); setError(null); setForgotPasswordMessage(null); }}
                  className="w-full text-sm font-medium text-[var(--zcanopy-muted)] hover:text-[var(--zcanopy-card-brown)]"
                >
                  Back
                </button>
              </form>
            )}

            {forgotPasswordStep === "reset" && (
              <form onSubmit={handleForgotPasswordReset} className="space-y-4">
                <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--zcanopy-card-brown)]">
                  New Password
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotPasswordNewPassword}
                    onChange={(e) => setForgotPasswordNewPassword(e.target.value)}
                    className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2.5 outline-none transition focus:border-[var(--zcanopy-primary)] focus:ring-2 focus:ring-[var(--zcanopy-primary)]/30"
                    placeholder="••••••••"
                  />
                </label>
                <label className="flex flex-col gap-1.5 text-sm font-medium text-[var(--zcanopy-card-brown)]">
                  Confirm New Password
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={forgotPasswordConfirmPassword}
                    onChange={(e) => setForgotPasswordConfirmPassword(e.target.value)}
                    className="rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2.5 outline-none transition focus:border-[var(--zcanopy-primary)] focus:ring-2 focus:ring-[var(--zcanopy-primary)]/30"
                    placeholder="••••••••"
                  />
                </label>
                {error && <p className="text-sm text-red-600">{error}</p>}
                {forgotPasswordMessage && <p className="text-sm text-green-600">{forgotPasswordMessage}</p>}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-[var(--zcanopy-primary)] px-4 py-2.5 font-semibold text-white shadow-sm transition-all hover:opacity-90 disabled:opacity-60"
                >
                  {submitting ? 'Resetting…' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
