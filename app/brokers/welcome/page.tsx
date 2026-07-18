"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { OnboardingShell, PrimaryButton } from "@/components/Onboarding";
import { COLORS } from "@/lib/theme";

function BrokerWelcomePageInner() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const code = params.get("code") ?? "";

  return (
    <OnboardingShell
      step={3}
      totalSteps={3}
      title="Application received"
      subtitle="Your email and phone are confirmed. Keep your broker code safe."
    >
      <div className="flex flex-col gap-5">
        <div className="rounded-2xl border border-[var(--zcanopy-accent-gold)] bg-[#D1A054]/10 p-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-2xl">
            ⏳
          </div>
          <p className="text-sm font-medium text-gray-600">Your broker code is</p>
          <p className="mt-1 break-all rounded-xl bg-white px-4 py-3 font-mono text-lg font-bold" style={{ color: COLORS.primary }}>
            {code || "BRK-XXXX"}
          </p>
          <p className="mt-2 text-xs text-gray-500">
            Use this code to complete your sign-up in the ZCanopy mobile app. Do not share it with customers.
          </p>
        </div>

        <div className="space-y-3 rounded-2xl bg-gray-50 p-5">
          <p className="text-sm font-semibold" style={{ color: COLORS.cardBrown }}>
            What happens next?
          </p>
          <ol className="space-y-2 text-sm text-gray-600">
            <li className="flex gap-2">
              <span className="font-semibold" style={{ color: COLORS.primary }}>1.</span>
              Open the ZCanopy mobile app and enter your broker code to finish creating your account.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold" style={{ color: COLORS.primary }}>2.</span>
              Our team reviews your uploaded National ID documents for verification.
            </li>
            <li className="flex gap-2">
              <span className="font-semibold" style={{ color: COLORS.primary }}>3.</span>
              Once approved, we&apos;ll email you a confirmation — only then can you list properties.
            </li>
          </ol>
        </div>

        <p className="text-center text-xs text-gray-400">
          Verification typically takes 1–2 business days. Watch your inbox at{" "}
          <span className="font-medium text-gray-600">{email || "your email"}</span>.
        </p>

        <PrimaryButton onClick={() => (window.location.href = "/login")}>
          Done
        </PrimaryButton>
      </div>
    </OnboardingShell>
  );
}

export default function BrokerWelcomePage() {
  return (
    <Suspense fallback={null}>
      <BrokerWelcomePageInner />
    </Suspense>
  );
}
