/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OnboardingShell, PrimaryButton } from "@/components/Onboarding";
import { adminApi, ApiError } from "@/lib/api";
import { COLORS } from "@/lib/theme";

const OTP_LENGTH = 6;

function OtpRow({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? "");
  function setAt(i: number, d: string) {
    const next = digits.slice();
    next[i] = d;
    onChange(next.join("").slice(0, OTP_LENGTH));
  }
  return (
    <div className="flex justify-between gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          inputMode="numeric"
          maxLength={1}
          value={d}
          disabled={disabled}
          onChange={(e) => {
            const v = e.target.value.replace(/\D/g, "");
            setAt(i, v.slice(-1));
            const next = (e.target as HTMLInputElement).nextElementSibling as HTMLInputElement | null;
            if (v && next) next.focus();
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digits[i]) {
              const prev = (e.target as HTMLInputElement).previousElementSibling as HTMLInputElement | null;
              prev?.focus();
            }
          }}
          className="h-12 w-11 rounded-xl border border-gray-300 bg-white text-center text-lg font-semibold outline-none focus:border-[var(--zcanopy-primary)] focus:ring-2 focus:ring-[var(--zcanopy-primary)]/30 disabled:bg-gray-50"
        />
      ))}
    </div>
  );
}

export default function BrokerVerifyPage() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const phone = params.get("phone") ?? "";
  const code = params.get("code") ?? "";

  const [emailCode, setEmailCode] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  async function sendOtp() {
    try {
      const res = await adminApi.sendBrokerOtp(email, phone);
      if ((res as any).devCode) {
        setInfo(`Dev code: ${(res as any).devCode} (use for both email & phone)`);
      }
    } catch {
      setError("Failed to send verification codes. Please retry.");
    }
  }

  useEffect(() => {
    if (email && phone) sendOtp();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, phone]);

  const ready = emailCode.length === OTP_LENGTH && phoneCode.length === OTP_LENGTH;

  async function handleVerify() {
    setError(null);
    setSubmitting(true);
    try {
      await adminApi.verifyBrokerOtp(email, phone, emailCode, phoneCode);
      router.push(`/brokers/welcome?email=${encodeURIComponent(email)}&code=${encodeURIComponent(code)}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Invalid code. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setInfo(null);
    try {
      await sendOtp();
    } finally {
      setResending(false);
    }
  }

  if (!email || !phone) {
    return (
      <OnboardingShell step={2} totalSteps={3} title="Verification">
        <p className="text-center text-sm text-gray-500">
          Missing details. Please start from the signup page.
        </p>
        <button
          onClick={() => router.replace("/brokers/signup")}
          className="mt-4 w-full text-center text-sm font-semibold"
          style={{ color: COLORS.primary }}
        >
          Back to signup
        </button>
      </OnboardingShell>
    );
  }

  return (
    <OnboardingShell
      step={2}
      totalSteps={3}
      title="Confirm your details"
      subtitle="We sent a 6-digit code to your email and phone number."
    >
      <div className="flex flex-col gap-5">
        <div>
          <p className="mb-1.5 text-sm font-medium">Email code</p>
          <p className="mb-2 text-xs text-gray-400">{email}</p>
          <OtpRow value={emailCode} onChange={setEmailCode} disabled={submitting} />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium">Phone code</p>
          <p className="mb-2 text-xs text-gray-400">{phone}</p>
          <OtpRow value={phoneCode} onChange={setPhoneCode} disabled={submitting} />
        </div>

        {info ? <p className="text-center text-xs text-gray-400">{info}</p> : null}
        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <PrimaryButton onClick={handleVerify} loading={submitting} disabled={!ready}>
          Verify &amp; continue
        </PrimaryButton>

        <button
          onClick={handleResend}
          disabled={resending}
          className="text-center text-sm font-medium text-gray-500 hover:text-[var(--zcanopy-primary)] disabled:opacity-60"
        >
          {resending ? "Resending…" : "Didn't get a code? Resend"}
        </button>
      </div>
    </OnboardingShell>
  );
}
