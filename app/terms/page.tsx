"use client";

import Link from "next/link";
import Footer from "@/components/Footer";
import { COLORS } from "@/lib/theme";

interface Section {
  id: string;
  title: string;
  body: string[];
}

const SECTIONS: Section[] = [
  {
    id: "acceptance",
    title: "1. Acceptance of Terms",
    body: [
      "By registering for, accessing, or using ZCanopy (the \"Platform\") as a broker, agent, or client, you agree to be bound by this Terms of Agreement. If you do not agree with any part of these terms, you must not use the Platform.",
    ],
  },
  {
    id: "eligibility",
    title: "2. Broker Eligibility & Verification",
    body: [
      "Brokers must provide accurate identity information, including a valid government-issued ID, phone number, and email address. ZCanopy reserves the right to verify this information and to suspend or terminate any account that provides false, misleading, or incomplete details.",
      "You are responsible for keeping your broker code confidential and for all activity conducted under your account.",
    ],
  },
  {
    id: "conduct",
    title: "3. Acceptable Use & Prohibited Conduct",
    body: [
      "You agree not to use the Platform for any unlawful, fraudulent, or deceptive purpose. This includes, but is not limited to, listing properties you are not authorised to represent, misrepresenting property details, or collecting payments under false pretenses.",
    ],
  },
  {
    id: "fraud",
    title: "4. Fraud, Investigations & Cooperation with Authorities",
    body: [
      "ZCanopy has zero tolerance for fraud. In the event that fraudulent, criminal, or otherwise unlawful activity is suspected or reported in connection with your account or transactions, you expressly consent and agree that ZCanopy may disclose your personal and account information — including your full name, identity documents, phone number, email address, transaction history, and any related records — to the relevant law enforcement agencies, regulatory bodies, or other competent authorities.",
      "This disclosure may occur with or without prior notice to you, to the extent permitted by applicable law, and you waive any objection to such disclosure where it is made in good faith for the purpose of investigating, preventing, or prosecuting fraud or other unlawful conduct.",
      "You agree to cooperate fully with ZCanopy and any authorities in any investigation relating to your use of the Platform.",
    ],
  },
  {
    id: "commissions",
    title: "5. Commissions, Fees & Payments",
    body: [
      "Brokers agree to the applicable subscription fees, platform commissions, and payment terms as displayed on the Platform. ZCanopy may deduct platform commissions from transactions processed through the Platform.",
    ],
  },
  {
    id: "liability",
    title: "6. Limitation of Liability",
    body: [
      "ZCanopy acts as a marketplace connecting brokers and clients. We are not a party to the agreements between brokers and their clients and are not liable for the conduct of any user or the accuracy of any listing.",
    ],
  },
  {
    id: "privacy",
    title: "7. Privacy",
    body: [
      "We collect and process personal data in accordance with applicable data protection laws. By using the Platform you consent to the collection, storage, and processing of your data for the purposes of operating the Platform, verifying identities, and — where necessary — cooperating with authorities as described in Section 4.",
    ],
  },
  {
    id: "termination",
    title: "8. Suspension & Termination",
    body: [
      "ZCanopy may suspend or terminate your access to the Platform at any time, with or without notice, if you breach these terms or engage in conduct that harms the Platform, other users, or the public.",
    ],
  },
  {
    id: "changes",
    title: "9. Changes to These Terms",
    body: [
      "We may update these terms from time to time. Continued use of the Platform after changes take effect constitutes acceptance of the revised terms.",
    ],
  },
  {
    id: "contact",
    title: "10. Contact Us",
    body: [
      "For questions about these terms, contact us at support@zcanopy.com or +256741882818, Kampala, Uganda.",
    ],
  },
];

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-[var(--zcanopy-background)]">
      {/* Header */}
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
          Terms of Agreement
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Last updated: {new Date().toLocaleDateString("en-UG", { year: "numeric", month: "long", day: "numeric" })}
        </p>

        <div className="mt-10 space-y-10">
          {SECTIONS.map((section) => (
            <div key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
                {section.title}
              </h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-gray-600">
                {section.body.map((paragraph, i) => (
                  <p key={i}>{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--zcanopy-accent-gold)] bg-[#D1A054]/10 p-6">
          <p className="text-sm text-gray-700">
            By registering as a broker on ZCanopy, you acknowledge that you have read and agree to these
            terms, including your consent to the disclosure of your broker information to the relevant
            authorities in the event of suspected fraud (see Section 4).
          </p>
          <Link
            href="/brokers/signup"
            className="mt-5 inline-block rounded-xl px-6 py-3 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
            style={{ backgroundColor: COLORS.primary }}
          >
            Agree & Become a Broker
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
