"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { COLORS } from "@/lib/theme";

const CONTACT = {
  phone: "+256741882818",
  email: "support@zcanopy.com",
  location: "Kampala, Uganda",
};

const FAQS = [
  {
    q: "How do I become a broker?",
    a: "Click \"Become a Broker\", complete the sign-up form, verify your email and phone, and finish onboarding in the ZCanopy mobile app using your broker code.",
  },
  {
    q: "How is my identity verified?",
    a: "You provide a valid government-issued ID during sign-up. Our team reviews it before your account is approved to list properties.",
  },
  {
    q: "What happens if fraud is reported?",
    a: "ZCanopy cooperates with authorities. By agreeing to our Terms of Agreement, you consent to your broker information being shared with the relevant authorities in the event of suspected fraud.",
  },
  {
    q: "How do I reset access or get support?",
    a: "Reach out to us by phone or email below and our support team will assist you.",
  },
];

export default function HelpPage() {
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
          Help &amp; Support
        </h1>
        <p className="mt-4 text-sm text-gray-600">
          Need a hand? Browse the FAQs below or contact our team directly.
        </p>

        {/* Contact cards */}
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <a href={`tel:${CONTACT.phone}`} className="rounded-2xl border border-gray-200/60 bg-[var(--zcanopy-surface)] p-5 transition-shadow hover:shadow-md">
            <div className="text-2xl">📞</div>
            <h3 className="mt-3 text-sm font-semibold" style={{ color: COLORS.cardBrown }}>Call us</h3>
            <p className="mt-1 text-sm text-gray-500">{CONTACT.phone}</p>
          </a>
          <a href={`mailto:${CONTACT.email}`} className="rounded-2xl border border-gray-200/60 bg-[var(--zcanopy-surface)] p-5 transition-shadow hover:shadow-md">
            <div className="text-2xl">✉️</div>
            <h3 className="mt-3 text-sm font-semibold" style={{ color: COLORS.cardBrown }}>Email us</h3>
            <p className="mt-1 text-sm text-gray-500">{CONTACT.email}</p>
          </a>
          <div className="rounded-2xl border border-gray-200/60 bg-[var(--zcanopy-surface)] p-5">
            <div className="text-2xl">📍</div>
            <h3 className="mt-3 text-sm font-semibold" style={{ color: COLORS.cardBrown }}>Visit us</h3>
            <p className="mt-1 text-sm text-gray-500">{CONTACT.location}</p>
          </div>
        </div>

        {/* FAQs */}
        <h2 className="mt-12 text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
          Frequently asked questions
        </h2>
        <div className="mt-4 space-y-4">
          {FAQS.map((faq) => (
            <div key={faq.q} className="rounded-2xl border border-gray-200/60 bg-[var(--zcanopy-surface)] p-5">
              <h3 className="font-semibold" style={{ color: COLORS.cardBrown }}>{faq.q}</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>

        <p className="mt-8 text-sm text-gray-500">
          See our <Link href="/terms" className="font-medium text-[var(--zcanopy-primary)] hover:underline">Terms of Agreement</Link> for full details on fraud handling and data disclosure.
        </p>
      </section>

      <Footer />
    </main>
  );
}
