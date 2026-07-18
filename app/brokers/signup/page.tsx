"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingShell, PrimaryButton, Field, TextInput } from "@/components/Onboarding";
import { adminApi, ApiError } from "@/lib/api";

function IdUpload({
  label,
  file,
  preview,
  onSelect,
}: {
  label: string;
  file: File | null;
  preview: string | null;
  onSelect: (file: File | null) => void;
}) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium">{label}</p>
      <label
        className={`flex h-36 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed text-center transition-colors ${
          preview ? "border-[var(--zcanopy-primary)]" : "border-gray-300 hover:border-[var(--zcanopy-primary)]"
        }`}
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt={label} className="h-full w-full object-contain" />
        ) : (
          <div className="text-gray-400">
            <div className="text-3xl">🪪</div>
            <p className="mt-1 text-xs">Tap to upload</p>
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onSelect(e.target.files?.[0] ?? null)}
        />
      </label>
      {file ? <p className="mt-1 truncate text-xs text-gray-400">{file.name}</p> : null}
    </div>
  );
}

export default function BrokerSignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [idFront, setIdFront] = useState<File | null>(null);
  const [idBack, setIdBack] = useState<File | null>(null);
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function pick(setFile: (f: File | null) => void, setPreview: (p: string | null) => void) {
    return (file: File | null) => {
      setFile(file);
      setPreview(file ? URL.createObjectURL(file) : null);
    };
  }

  const valid =
    fullName.trim().length > 1 &&
    /^\S+@\S+\.\S+$/.test(email) &&
    phone.trim().length >= 9 &&
    idFront !== null &&
    idBack !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await adminApi.registerBroker({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phone.trim(),
      });
      router.push(
        `/brokers/verify?email=${encodeURIComponent(res.email)}&phone=${encodeURIComponent(
          res.phoneNumber,
        )}&code=${encodeURIComponent(res.brokerCode)}`,
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create your account. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <OnboardingShell
      step={1}
      totalSteps={3}
      title="Become a ZCanopy Broker"
      subtitle="Create your account to start listing properties across Uganda."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Full name">
          <TextInput
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g. Alice Namuli"
            required
          />
        </Field>

        <Field label="Email address">
          <TextInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
          />
        </Field>

        <Field label="Phone number">
          <TextInput
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+256 7XX XXX XXX"
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <IdUpload
            label="National ID — Front"
            file={idFront}
            preview={idFrontPreview}
            onSelect={pick(setIdFront, setIdFrontPreview)}
          />
          <IdUpload
            label="National ID — Back"
            file={idBack}
            preview={idBackPreview}
            onSelect={pick(setIdBack, setIdBackPreview)}
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
        ) : null}

        <PrimaryButton type="submit" loading={submitting} disabled={!valid}>
          Create account
        </PrimaryButton>

        <p className="text-center text-xs text-gray-400">
          By continuing you agree to ZCanopy&apos;s broker terms &amp; privacy policy.
        </p>
      </form>
    </OnboardingShell>
  );
}
