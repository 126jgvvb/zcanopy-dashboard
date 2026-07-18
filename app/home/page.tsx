"use client";

import Link from "next/link";
import { COLORS } from "@/lib/theme";
import ZLoadingIndicator from "@/components/ZLoadingIndicator";

const FEATURES = [
  {
    icon: "🏠",
    title: "List with ease",
    text: "Brokers upload properties with photos and video, set availability, and reach buyers across Uganda.",
  },
  {
    icon: "🤝",
    title: "Smart connections",
    text: "Every broker gets a unique broker code clients use in the mobile app to discover their listings.",
  },
  {
    icon: "📊",
    title: "Transparent earnings",
    text: "Track commissions, bookings, and payouts in real time with clear, auditable reporting.",
  },
  {
    icon: "🛡️",
    title: "Verified & trusted",
    text: "Document verification and OTP confirmation keep the marketplace safe for everyone.",
  },
  {
    icon: "💬",
    title: "Unified messaging",
    text: "Coordinate with clients and brokers from one console — email and SMS, fully logged.",
  },
  {
    icon: "⚡",
    title: "Instant invoicing",
    text: "The notification service auto-generates and delivers invoices for subscriptions and listings.",
  },
];

const STATS = [
  { value: "12k+", label: "Active listings" },
  { value: "3k+", label: "Verified brokers" },
  { value: "UGX 22M+", label: "Paid out in commissions" },
  { value: "99.9%", label: "Platform uptime" },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Nav */}
      <header className="sticky top-0 z-20 border-b border-gray-200/60 bg-[var(--zcanopy-surface)]/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span
              className="flex h-9 w-9 items-center justify-center rounded-xl text-base font-bold text-white shadow"
              style={{ backgroundColor: COLORS.accentGold, color: COLORS.cardBrown }}
            >
              Z
            </span>
            <span className="text-lg font-bold tracking-tight" style={{ color: COLORS.cardBrown }}>
              ZCanopy
            </span>
          </div>
          <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
            <a href="#features" className="hover:text-[var(--zcanopy-primary)]">Features</a>
            <a href="#how" className="hover:text-[var(--zcanopy-primary)]">How it works</a>
            <a href="#stats" className="hover:text-[var(--zcanopy-primary)]">Impact</a>
          </nav>
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
            style={{ backgroundColor: COLORS.primary }}
          >
            Admin console
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(900px 500px at 80% -10%, rgba(209,160,84,0.25), transparent), radial-gradient(700px 500px at 0% 0%, rgba(169,113,14,0.12), transparent)",
          }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
          <div>
            <span
              className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
              style={{ backgroundColor: `${COLORS.accentGold}22`, color: COLORS.primary }}
            >
              Real estate, reimagined
            </span>
            <h1 className="mt-5 text-4xl font-bold leading-tight sm:text-5xl" style={{ color: COLORS.cardBrown }}>
              The marketplace where Uganda&apos;s brokers thrive.
            </h1>
            <p className="mt-5 max-w-lg text-base text-gray-600">
              ZCanopy connects verified property brokers with clients through a single,
              elegant platform — listings, bookings, commissions, and payments, all in one place.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/brokers/signup"
                className="rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-md transition-opacity hover:opacity-90"
                style={{ backgroundColor: COLORS.primary }}
              >
                Become a broker
              </Link>
              <a
                href="#features"
                className="rounded-xl border border-gray-300 px-5 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-[var(--zcanopy-primary)] hover:text-[var(--zcanopy-primary)]"
              >
                Explore features
              </a>
            </div>
          </div>

          <div className="relative">
            <div
              className="rounded-3xl bg-[var(--zcanopy-surface)] p-6 shadow-2xl"
              style={{ border: `1px solid ${COLORS.accentGold}55` }}
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white shadow"
                  style={{ backgroundColor: COLORS.accentGold, color: COLORS.cardBrown }}
                >
                  Z
                </span>
                <div>
                  <p className="font-semibold" style={{ color: COLORS.cardBrown }}>ZCanopy Console</p>
                  <p className="text-xs text-gray-400">Live broker activity</p>
                </div>
              </div>
              <div className="mt-5 space-y-3">
                {[
                  { t: "New booking · Kololo Apartment", s: "UGX 850,000", c: "#16a34a" },
                  { t: "Subscription · Fibrous tier", s: "UGX 1,250,000", c: COLORS.primary },
                  { t: "Broker verified · BRK-004", s: "Approved", c: "#16a34a" },
                  { t: "Invoice sent · INV-2026-006", s: "UGX 850,000", c: COLORS.accentGold },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2.5">
                    <span className="text-sm text-gray-600">{row.t}</span>
                    <span className="text-sm font-semibold" style={{ color: row.c }}>{row.s}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5 flex items-center justify-center">
                <ZLoadingIndicator size={28} color={COLORS.primary} />
              </div>
            </div>
            <div
              className="absolute -bottom-6 -left-6 hidden h-28 w-28 rounded-2xl sm:block"
              style={{ backgroundColor: `${COLORS.accentGold}33` }}
            />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="border-y border-gray-200/60 bg-[var(--zcanopy-surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-12 md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold" style={{ color: COLORS.primary }}>{s.value}</p>
              <p className="mt-1 text-sm text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold" style={{ color: COLORS.cardBrown }}>Everything brokers need</h2>
          <p className="mt-3 text-gray-600">
            A complete toolkit to list, connect, and earn — built for clarity and trust.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl bg-[var(--zcanopy-surface)] p-6 shadow-sm transition-all hover:shadow-md"
              style={{ border: "1px solid rgba(0,0,0,0.05)" }}
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                style={{ backgroundColor: `${COLORS.accentGold}22` }}
              >
                {f.icon}
              </div>
              <h3 className="mt-4 text-lg font-semibold" style={{ color: COLORS.cardBrown }}>{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="bg-[var(--zcanopy-surface)]">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold" style={{ color: COLORS.cardBrown }}>How it works</h2>
            <p className="mt-3 text-gray-600">From sign-up to your first payout in three simple steps.</p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { n: "01", t: "Create your account", d: "Sign up, confirm email & phone with an OTP, and upload your National ID." },
              { n: "02", t: "Get verified", d: "Our team reviews your documents, then emails your confirmation and broker code." },
              { n: "03", t: "List & earn", d: "Finish setup in the mobile app, publish properties, and track commissions live." },
            ].map((step) => (
              <div key={step.n} className="relative rounded-2xl border border-gray-100 bg-[var(--background)] p-6">
                <span className="text-4xl font-bold" style={{ color: `${COLORS.accentGold}` }}>{step.n}</span>
                <h3 className="mt-3 text-lg font-semibold" style={{ color: COLORS.cardBrown }}>{step.t}</h3>
                <p className="mt-2 text-sm text-gray-600">{step.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div
          className="overflow-hidden rounded-3xl p-10 text-center shadow-xl sm:p-14"
          style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.cardBrown})` }}
        >
          <h2 className="text-3xl font-bold text-white">Ready to grow your brokerage?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Join thousands of verified brokers on Uganda&apos;s most elegant property marketplace.
          </p>
          <Link
            href="/brokers/signup"
            className="mt-7 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold shadow transition-opacity hover:opacity-90"
            style={{ color: COLORS.primary }}
          >
            Become a broker today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200/60 bg-[var(--zcanopy-surface)]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm text-gray-500 sm:flex-row">
          <div className="flex items-center gap-2">
            <span
              className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ backgroundColor: COLORS.accentGold, color: COLORS.cardBrown }}
            >
              Z
            </span>
            <span className="font-semibold" style={{ color: COLORS.cardBrown }}>ZCanopy</span>
          </div>
          <p>© {new Date().getFullYear()} ZCanopy. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-[var(--zcanopy-primary)]">Admin</Link>
            <Link href="/brokers/signup" className="hover:text-[var(--zcanopy-primary)]">Brokers</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
