/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";

const currency = (n: number) =>
  `UGX ${Number(n || 0).toLocaleString("en-UG")}`;

const TIER_LIMITS: Record<string, { maxProperties: number; maxPhotos: number; maxVideos: number; maxVideoSizeMB: number }> = {
  fibrous: { maxProperties: 12, maxPhotos: 25, maxVideos: 2, maxVideoSizeMB: 12 * 1024 },
  buttress: { maxProperties: 16, maxPhotos: 50, maxVideos: 4, maxVideoSizeMB: 4 * 1024 },
  prop: { maxProperties: 5, maxPhotos: 15, maxVideos: 1, maxVideoSizeMB: 500 },
};

function formatBytes(mb: number) {
  if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
  return `${mb} MB`;
}

export default function BrokerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { admin } = useAuth();
  const details = useAdminData(
    (token) => adminApi.brokerDetails(token, id),
    [id],
  );
  const properties = useAdminData(
    (token) => adminApi.brokerProperties(token, id, 1, 10),
    [id],
  );
  const transactions = useAdminData(
    (token) => adminApi.transactions(token, 1, 10, id),
    [id],
  );

  if (details.loading) return <LoadingState label="Loading broker" />;
  if (details.error) return <ErrorState message={details.error} />;

  const broker = details.data?.broker ?? {};
  const wallet = details.data?.walletBalance ?? broker.walletBalance ?? 0;
  const txs = details.data?.transactions ?? [];
  const messages = details.data?.messages ?? [];
  const bookings = details.data?.bookings ?? [];
  const props = properties.data?.properties ?? [];
  const limits = TIER_LIMITS[broker.subscriptionTier?.toLowerCase?.()] ?? TIER_LIMITS.prop;

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/brokers"
        className="inline-flex items-center gap-1 text-sm font-medium hover:underline"
        style={{ color: COLORS.primary }}
      >
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to brokers
      </Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-6">
          <Panel title="Profile">
            <div className="flex flex-col items-center text-center">
              <div
                className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white shadow-lg"
                style={{ backgroundColor: COLORS.primary }}
              >
                {broker.username?.charAt(0).toUpperCase()}
              </div>
              <h3 className="mt-3 text-lg font-bold" style={{ color: COLORS.cardBrown }}>
                {broker.username}
              </h3>
              <p className="text-xs text-gray-400">{broker.title || "Broker"}</p>
              <span
                className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize"
                style={{
                  backgroundColor: `${COLORS.primary}15`,
                  color: COLORS.primary,
                }}
              >
                {broker.subscriptionTier || "prop"} tier
              </span>
            </div>
            <div className="mt-5 space-y-2.5 text-sm">
              <InfoRow label="Email" value={broker.email} />
              <InfoRow label="Phone" value={broker.phoneNumber} />
              <InfoRow label="Code" value={broker.brokerCode} mono />
              <InfoRow label="Location" value={broker.location} />
              <InfoRow label="Wallet" value={currency(wallet)} highlight />
              <InfoRow label="Verified" value={broker.isVerified ? "Yes" : "No"} />
              <InfoRow label="Active" value={broker.isActive ? "Yes" : "No"} />
              <InfoRow label="Member since" value={broker.createdAt ? new Date(broker.createdAt).toLocaleDateString() : "—"} />
            </div>
          </Panel>

          <Panel title="Bio">
            <p className="text-sm leading-relaxed text-gray-600">
              {broker.bio || "No bio provided yet. This broker has not added a personal description."}
            </p>
          </Panel>

          <Panel title="Tier Limits">
            <div className="space-y-3">
              <LimitRow label="Properties" used={props.length} max={limits.maxProperties} />
              <LimitRow label="Photos" used={props.reduce((s: number, p: any) => s + (p.photoCount ?? 0), 0)} max={limits.maxPhotos} />
              <LimitRow label="Videos" used={props.reduce((s: number, p: any) => s + (p.videoCount ?? 0), 0)} max={limits.maxVideos} />
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Max video size</span>
                <span className="font-medium">{formatBytes(limits.maxVideoSizeMB)}</span>
              </div>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Panel title="Wallet Balance">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold" style={{ color: COLORS.cardBrown }}>
                {currency(wallet)}
              </span>
              <span className="text-sm text-gray-400">available</span>
            </div>
            <div className="mt-4 flex gap-3">
              <button className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90" style={{ backgroundColor: COLORS.primary }}>
                Withdraw
              </button>
              <button className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50">
                Transaction History
              </button>
            </div>
          </Panel>

          <Panel title="Identity Verification">
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Names awaiting approval
              </p>
              <p className="mt-1 text-sm font-medium text-amber-900">
                {broker.legalName || broker.username}
              </p>
              {broker.idNumber ? (
                <p className="text-xs text-amber-700">ID No: {broker.idNumber}</p>
              ) : null}
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <IdImage label="National ID — Front" src={broker.idFrontUrl} />
              <IdImage label="National ID — Back" src={broker.idBackUrl} />
            </div>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => adminApi.approveDocument(admin!.token, id, { namesMatched: true })}
                className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90"
                style={{ backgroundColor: COLORS.primary }}
              >
                Approve & Match Names
              </button>
              <button
                onClick={() => adminApi.approveDocument(admin!.token, id, { namesMatched: false })}
                className="rounded-xl bg-red-100 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-200"
              >
                Reject
              </button>
            </div>
          </Panel>

          <Panel title="Recent Transactions">
            {transactions.loading ? (
              <LoadingState />
            ) : (txs?.length ?? 0) === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No transactions.</p>
            ) : (
              <div className="space-y-3">
                {(txs ?? []).map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 transition-colors hover:border-[var(--zcanopy-accent-gold)] hover:shadow-sm">
                    <div className="flex items-center gap-3">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-lg text-xs font-bold text-white"
                        style={{ backgroundColor: t.status === "completed" ? "#16a34a" : t.status === "pending" ? COLORS.accentGold : "#dc2626" }}
                      >
                        {t.type?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{t.reason || t.reasonForPayment || "Transaction"}</p>
                        <p className="text-xs text-gray-400">
                          {t.date ? new Date(t.date).toLocaleDateString() : ""} · {t.status || "pending"}
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold" style={{ color: COLORS.cardBrown }}>
                      {currency(t.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Properties">
            {properties.loading ? (
              <LoadingState />
            ) : props.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No properties.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {props.map((p: any) => (
                  <div
                    key={p.id}
                    className="group flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-[var(--zcanopy-accent-gold)]"
                  >
                    <div className="relative h-52 w-full overflow-hidden rounded-t-2xl bg-gray-100">
                      {p.imageUrl && p.imageUrl[0] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imageUrl[0]}
                          alt={p.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="text-center">
                            <div className="text-4xl">🏠</div>
                            <p className="mt-1 text-xs text-gray-400">Property Image</p>
                          </div>
                        </div>
                      )}
                      <div className="absolute right-2 top-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs ${p.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-1 flex-col p-4">
                      <p className="font-medium">{p.title}</p>
                      <p className="text-xs text-gray-400">{p.location}</p>
                      <p className="mt-2 text-xs text-gray-500 line-clamp-2">{p.description}</p>
                      <div className="mt-3 space-y-2">
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Photos</span>
                            <span className="font-medium text-gray-700">
                              {p.photoCount ?? 0} / {p.maxPhotos ?? limits.maxPhotos}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {Array.from({ length: p.maxPhotos ?? limits.maxPhotos }).map((_, idx) => (
                              <div
                                key={idx}
                                className="h-10 w-10 rounded border border-dashed border-gray-200 flex items-center justify-center text-xs"
                                style={{
                                  backgroundColor: idx < (p.photoCount ?? 0) ? COLORS.primary : "transparent",
                                  color: idx < (p.photoCount ?? 0) ? "#ffffff" : "#d1d5db",
                                  borderStyle: idx < (p.photoCount ?? 0) ? "solid" : "dashed",
                                }}
                              >
                                {idx < (p.photoCount ?? 0) ? "📷" : ""}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Videos</span>
                            <span className="font-medium text-gray-700">
                              {p.videoCount ?? 0} / {p.maxVideos ?? limits.maxVideos}
                            </span>
                          </div>
                          <div className="mt-1 flex gap-1.5">
                            {Array.from({ length: p.maxVideos ?? limits.maxVideos }).map((_, idx) => (
                              <div
                                key={idx}
                                className="h-16 flex-1 rounded border border-dashed border-gray-200 flex items-center justify-center text-base"
                                style={{
                                  backgroundColor: idx < (p.videoCount ?? 0) ? COLORS.accentGold : "transparent",
                                  color: idx < (p.videoCount ?? 0) ? "#ffffff" : "#d1d5db",
                                  borderStyle: idx < (p.videoCount ?? 0) ? "solid" : "dashed",
                                }}
                              >
                                {idx < (p.videoCount ?? 0) ? "▶" : ""}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Messages">
            {messages.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No messages.</p>
            ) : (
              <div className="space-y-3">
                {messages.map((m: any) => (
                  <div key={m.id} className="flex items-start gap-3 rounded-xl border border-gray-100 p-3">
                    <span
                      className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: m.read ? COLORS.accentGold : COLORS.primary }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{m.senderName || "System"}</p>
                        <span className="text-[10px] text-gray-400">
                          {m.sentAt ? new Date(m.sentAt).toLocaleString() : ""}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{m.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>

          <Panel title="Bookings">
            {bookings.length === 0 ? (
              <p className="py-6 text-center text-sm text-gray-400">No bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {bookings.map((b: any) => (
                  <div key={b.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-3">
                    <div>
                      <p className="text-sm font-medium">{b.propertyTitle}</p>
                      <p className="text-xs text-gray-400">
                        {b.customerName} · {b.date ? new Date(b.date).toLocaleDateString() : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{currency(b.amount)}</p>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${b.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                        {b.status || "pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, mono, highlight }: { label: string; value?: string | number; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-gray-400">{label}</span>
      <span className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""} ${highlight ? "text-base font-bold" : ""}`} style={highlight ? { color: COLORS.primary } : { color: COLORS.cardBrown }}>
        {value ?? "—"}
      </span>
    </div>
  );
}

function LimitRow({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500">{label}</span>
        <span className="font-medium" style={{ color: COLORS.cardBrown }}>
          {used} / {max}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${pct}%`,
            backgroundColor: pct >= 90 ? "#dc2626" : pct >= 70 ? COLORS.accentGold : COLORS.primary,
          }}
        />
      </div>
    </div>
  );
}

function IdImage({ label, src }: { label: string; src?: string }) {
  const [zoom, setZoom] = useState(1);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {src ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-100"
              aria-label="Zoom out"
            >
              −
            </button>
            <span className="w-10 text-center text-xs font-medium text-gray-500">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(4, +(z + 0.25).toFixed(2)))}
              className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-300 text-sm font-bold text-gray-600 hover:bg-gray-100"
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        ) : null}
      </div>
      <div className="flex h-64 w-full items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
        {src ? (
          <div
            className="h-full w-full overflow-auto"
            style={{ cursor: zoom > 1 ? "zoom-in" : "default" }}
          >
            <div
              className="flex h-full w-full items-center justify-center"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "center",
                transition: "transform 0.15s ease-out",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={label}
                className="max-h-full max-w-full object-contain"
              />
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            <div className="text-3xl">🪪</div>
            <p className="mt-1 text-xs">No image uploaded</p>
          </div>
        )}
      </div>
    </div>
  );
}
