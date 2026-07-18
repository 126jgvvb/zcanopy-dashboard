"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePublicData } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";
import ZLoadingIndicator from "@/components/ZLoadingIndicator";
import Footer from "@/components/Footer";
import ThemeToggle from "@/components/ThemeToggle";

function formatUGX(n: number) {
  try {
    return new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `UGX ${n.toLocaleString()}`;
  }
}

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
            <ThemeToggle />
          </nav>
          <div className="md:hidden">
            <ThemeToggle />
          </div>
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

          <PropertyShowcase />
        </div>
      </section>

      {/* Full-width video */}
      <section className="relative">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl ring-1 ring-black/5">
            <video
              className="h-[320px] w-full object-cover sm:h-[440px]"
              autoPlay
              loop
              muted
              playsInline
              preload="auto"
              poster="https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1600&q=70"
            >
              <source
                src="/sample_vid.mp4"
                type="video/mp4"
              />
            </video>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-black/40 via-black/10 to-black/40">
              <GlowFallingText text="let zcanopy deliver the property to you" />
            </div>
          </div>
          <p className="mt-4 text-center text-sm text-gray-500">
            Discover homes across Uganda — tours, bookings, and verified brokers, all in one place.
          </p>
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

      {/* Payment flow */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <span
            className="inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            style={{ backgroundColor: `${COLORS.accentGold}22`, color: COLORS.primary }}
          >
            Payments
          </span>
          <h2 className="mt-4 text-3xl font-bold" style={{ color: COLORS.cardBrown }}>
            A payment flow you can trust
          </h2>
          <p className="mt-3 text-gray-600">
            From booking to payout, every shilling moves through secure, locally trusted rails.
          </p>
        </div>

        <div className="mt-12 grid gap-5 md:grid-cols-4">
          {[
            { n: "01", t: "Book & pay", d: "Clients pay booking fees and subscriptions instantly via mobile money." },
            { n: "02", t: "Escrow hold", d: "Funds are secured and reconciled automatically against the transaction." },
            { n: "03", t: "Commission split", d: "The platform commission is calculated and the broker's share is earmarked." },
            { n: "04", t: "Payout", d: "Verified brokers withdraw earnings straight to their mobile money wallet." },
          ].map((s) => (
            <div key={s.n} className="rounded-2xl border border-black/5 bg-[var(--zcanopy-surface)] p-6 shadow-sm transition-all duration-300 hover:scale-105 hover:border-yellow-400 hover:shadow-lg">
              <span className="text-3xl font-bold" style={{ color: COLORS.accentGold }}>{s.n}</span>
              <h3 className="mt-3 text-base font-semibold" style={{ color: COLORS.cardBrown }}>{s.t}</h3>
              <p className="mt-2 text-sm text-gray-600">{s.d}</p>
            </div>
          ))}
        </div>

        <div
          className="mt-10 overflow-hidden rounded-3xl p-8 sm:p-10"
          style={{ background: `linear-gradient(135deg, ${COLORS.cardBrown}, ${COLORS.primary})` }}
        >
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Carriers we support today</h3>
              <p className="mt-2 max-w-md text-sm text-white/80">
                ZCanopy settles payments through Uganda&apos;s most widely used mobile money networks,
                with card and bank rails on the roadmap.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {[
                { name: "MTN MoMo", logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/MTN_Logo.svg" },
                { name: "Airtel Money", logo: "https://upload.wikimedia.org/wikipedia/commons/d/da/Airtel_Africa_logo.svg" },
              ].map((c) => (
                <span
                  key={c.name}
                  className="flex items-center gap-2 rounded-2xl bg-white/95 px-4 py-2.5 shadow"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.logo}
                    alt={c.name}
                    className="h-7 w-auto object-contain"
                  />
                </span>
              ))}
            </div>
          </div>
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
      <Footer />
    </main>
  );
}

function PropertyShowcase() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, loading } = usePublicData(() => adminApi.featuredProperties());
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const properties: any[] = data?.properties ?? [];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (properties.length <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % properties.length), 4500);
    return () => clearInterval(t);
  }, [properties.length]);

  const active = properties[index];

  return (
    <div
      className="relative overflow-hidden rounded-3xl bg-[var(--zcanopy-surface)] p-3 shadow-2xl"
      style={{ border: `1px solid ${COLORS.accentGold}55` }}
    >
      <div className="flex items-center justify-between px-2 pb-2 pt-1">
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ backgroundColor: COLORS.accentGold, color: COLORS.cardBrown }}
          >
            Z
          </span>
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Featured listings
          </span>
        </div>
        <span className="flex gap-1.5">
          {properties.map((_, i) => (
            <button
              key={i}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 22 : 8,
                backgroundColor: i === index ? COLORS.primary : "#e5e5e5",
              }}
            />
          ))}
        </span>
      </div>

      {loading ? (
        <div className="flex h-[360px] items-center justify-center">
          <ZLoadingIndicator size={36} color={COLORS.primary} />
        </div>
      ) : active ? (
        <div key={active.id} className="animate-[fadeIn_0.5s_ease]">
          <div className="relative h-52 w-full overflow-hidden rounded-2xl bg-gray-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.imageUrl}
              alt={active.title}
              className="h-full w-full object-cover"
            />
            <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold capitalize text-gray-700 shadow">
              {active.propertyType}
            </span>
            {active.isAvailable ? (
              <span className="absolute right-3 top-3 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 shadow">
                Available
              </span>
            ) : null}
          </div>

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
                  {active.title}
                </h3>
                <p className="mt-0.5 text-xs text-gray-400">📍 {active.location}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-wide text-gray-400">{active.priceLabel}</p>
                <p className="text-lg font-bold" style={{ color: COLORS.primary }}>
                  {formatUGX(active.price)}
                </p>
              </div>
            </div>

            <p className="mt-2 line-clamp-2 text-sm text-gray-600">{active.description}</p>

            <button
              className="mt-4 w-full rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow transition-opacity hover:opacity-90"
              style={{ backgroundColor: COLORS.primary }}
            >
              Your property awaits your call
            </button>
          </div>
        </div>
      ) : (
        <div className="flex h-[360px] items-center justify-center text-sm text-gray-400">
          No listings available.
        </div>
      )}

      <div
        className="absolute -bottom-6 -left-6 hidden h-28 w-28 rounded-2xl sm:block"
        style={{ backgroundColor: `${COLORS.accentGold}33` }}
      />
    </div>
  );
}

function GlowFallingText({ text }: { text: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const w = canvas!.clientWidth;
      const h = canvas!.clientHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      return { w, h };
    }

    let { w, h } = resize();

    const fontSize = Math.max(22, Math.min(46, w / 22));
    ctx.font = `bold ${fontSize}px 'Arial Black', Impact, sans-serif`;

    const HOLD = 90;
    const START_GAP = 6;

    let letters: {
      char: string;
      x: number;
      targetY: number;
      speed: number;
      startFrame: number;
      y: number;
      held: number;
    }[] = [];

    function build() {
      letters = [];
      ctx!.font = `bold ${fontSize}px 'Arial Black', Impact, sans-serif`;
      const totalWidth = ctx!.measureText(text).width;
      let currentX = (w - totalWidth) / 2;
      const targetY = h / 2;
      for (let i = 0; i < text.length; i++) {
        const charWidth = ctx!.measureText(text[i]).width;
        letters.push({
          char: text[i],
          x: currentX,
          targetY,
          speed: 4 + Math.random() * 3,
          startFrame: i * START_GAP,
          y: -100 - i * 20,
          held: 0,
        });
        currentX += charWidth;
      }
    }
    build();

    let frame = 0;
    let raf = 0;

    function animate() {
      ctx!.clearRect(0, 0, w, h);
      frame++;
      letters.forEach((l) => {
        if (frame < l.startFrame) {
          l.y = -100 - Math.random() * 200;
        } else if (l.y < l.targetY) {
          l.y += l.speed;
        } else {
          l.held++;
          if (l.held > HOLD) {
            l.y = -100 - Math.random() * 120;
            l.held = 0;
          }
        }

        const wave = Math.sin((frame - l.startFrame) * 0.1);
        const glowRadius = wave > 0 ? wave * 25 : 0;
        const scale = 1 + (wave > 0 ? wave * 0.05 : 0);

        ctx!.save();
        ctx!.translate(l.x, l.y);
        ctx!.scale(scale, scale);

        for (let i = 8; i > 0; i--) {
          ctx!.fillStyle = `rgba(160, 130, 0, ${1 - i / 8})`;
          ctx!.fillText(l.char, -i, i);
        }

        ctx!.shadowColor = "rgba(255, 235, 0, 1)";
        ctx!.shadowBlur = glowRadius;
        ctx!.fillStyle = "#FFFF00";
        ctx!.fillText(l.char, 0, 0);
        ctx!.restore();
      });
      raf = requestAnimationFrame(animate);
    }
    animate();

    function onResize() {
      const dims = resize();
      w = dims.w;
      h = dims.h;
      build();
    }
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [text]);

  return (
    <canvas
      ref={canvasRef}
      className="block h-full w-full"
      aria-label={text}
    />
  );
}
