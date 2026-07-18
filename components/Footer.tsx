"use client";

import Link from "next/link";
import { COLORS } from "@/lib/theme";

/**
 * ZCanopy public site footer.
 *
 * Contains company/help/legal navigation plus direct contact details
 * (location, phone, email) and a "Become a broker" call to action.
 */

const CONTACT = {
  phone: "+256741882818",
  email: "support@zcanopy.com",
  location: "Kampala, Uganda",
};

const COMPANY_LINKS: { label: string; href: string }[] = [
  { label: "About", href: "/about" },
  { label: "Help & Support", href: "/help" },
  { label: "Become a Broker", href: "/brokers/signup" },
];

const LEGAL_LINKS: { label: string; href: string }[] = [
  { label: "Terms of Agreement", href: "/terms" },
  { label: "Privacy Policy", href: "/terms#privacy" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200/60 bg-[var(--zcanopy-surface)]">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold"
                style={{ backgroundColor: COLORS.accentGold, color: COLORS.cardBrown }}
              >
                Z
              </span>
              <span className="text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
                ZCanopy
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm text-gray-500">
              Uganda&apos;s elegant property marketplace connecting verified brokers with clients.
            </p>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: COLORS.cardBrown }}>
              Company
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-500">
              {COMPANY_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-[var(--zcanopy-primary)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: COLORS.cardBrown }}>
              Legal
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-500">
              {LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="transition-colors hover:text-[var(--zcanopy-primary)]">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: COLORS.cardBrown }}>
              Contact
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-gray-500">
              <li className="flex items-start gap-2">
                <span aria-hidden>📍</span>
                <span>{CONTACT.location}</span>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>📞</span>
                <a href={`tel:${CONTACT.phone}`} className="transition-colors hover:text-[var(--zcanopy-primary)]">
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span aria-hidden>✉️</span>
                <a href={`mailto:${CONTACT.email}`} className="transition-colors hover:text-[var(--zcanopy-primary)]">
                  {CONTACT.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-gray-200/60 pt-6 text-sm text-gray-500 sm:flex-row">
          <p>© {year} ZCanopy. All rights reserved.</p>
          <div className="flex gap-5">
            <Link href="/login" className="hover:text-[var(--zcanopy-primary)]">Admin</Link>
            <Link href="/brokers/signup" className="hover:text-[var(--zcanopy-primary)]">Brokers</Link>
            <Link href="/terms" className="hover:text-[var(--zcanopy-primary)]">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
