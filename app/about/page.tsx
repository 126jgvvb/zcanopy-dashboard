"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { COLORS } from "@/lib/theme";

const VALUES = [
  { icon: "🏠", title: "Trusted Listings", text: "Every property is tied to a verified broker, reducing fraud and building trust." },
  { icon: "✅", title: "Verified Brokers", text: "Brokers pass identity verification before they can list on the Platform." },
  { icon: "📍", title: "Local Expertise", text: "Built in Uganda, for Uganda's property market." },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[var(--zcanopy-background)]">
      <header className="border-b border-gray-200/60 bg-[var(--zcanopy-surface)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link href="/home" className="flex items-center gap-2">
            <span
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
              style={{ backgroundColor: COLORS.accentGold, color: COLORS.cardBrown }}
            >
              Z
            </span>
            <span className="text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
              ZCanopy
            </span>
          </Link>
          <Link href="/home" className="text-sm text-gray-500 hover:text-[var(--zcanopy-primary)]">
            ← Back to home
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-3xl font-bold" style={{ color: COLORS.cardBrown }}>
          About ZCanopy
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-gray-600">
          ZCanopy is Uganda&apos;s elegant property marketplace, connecting verified brokers with clients
          searching for homes, land, and rentals. Our mission is to make property discovery transparent,
          trustworthy, and simple — while giving brokers the tools they need to grow their business.
        </p>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {VALUES.map((v) => (
            <div key={v.title} className="rounded-2xl border border-gray-200/60 bg-[var(--zcanopy-surface)] p-5">
              <div className="text-2xl">{v.icon}</div>
              <h3 className="mt-3 font-semibold" style={{ color: COLORS.cardBrown }}>{v.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{v.text}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl p-6 text-center" style={{ background: `linear-gradient(135deg, ${COLORS.primary}, ${COLORS.cardBrown})` }}>
          <h2 className="text-xl font-bold text-white">Want to list with us?</h2>
          <Link
            href="/brokers/signup"
            className="mt-5 inline-block rounded-xl bg-white px-6 py-3 text-sm font-semibold shadow transition-opacity hover:opacity-90"
            style={{ color: COLORS.primary }}
          >
            Become a broker
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
