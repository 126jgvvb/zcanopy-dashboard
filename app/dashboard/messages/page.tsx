/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi, ApiError } from "@/lib/api";
import { can, COLORS } from "@/lib/theme";
import { RecipientPicker, type RecipientOption } from "@/components/RecipientPicker";
import { Search } from "lucide-react";

const RATING_FILTERS = ["all", "5", "4", "3", "2", "1"] as const;

export default function MessagesPage() {
  const { admin } = useAuth();
  const [liveTick, setLiveTick] = useState(0);
  const [brokers, setBrokers] = useState<RecipientOption[]>([]);
  const [customers, setCustomers] = useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);
  const [ratingFilter, setRatingFilter] = useState<(typeof RATING_FILTERS)[number]>("all");
  const [commentSearch, setCommentSearch] = useState("");
  const [notifSearch, setNotifSearch] = useState("");
  const [notifType, setNotifType] = useState("all");
  const [notifChannel, setNotifChannel] = useState("all");

  useEffect(() => {
    const interval = setInterval(() => setLiveTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const system = useAdminData((token) => adminApi.systemMessages(token, 1, 15), [liveTick]);
  const comments = useAdminData((token) => adminApi.comments(token, 1, 15), [liveTick]);
  const notifications = useAdminData((token) => adminApi.notifications(token, { limit: 15 }), [liveTick]);

  useEffect(() => {
    setLoadingRecipients(true);
    Promise.all([
      adminApi.brokers(admin!.token, 1, 100).catch(() => ({ brokers: [] })),
      adminApi.comments(admin!.token, 1, 100).catch(() => ({ comments: [] })),
    ]).then(([brokersData, commentsData]) => {
      const brokerOptions: RecipientOption[] = (brokersData.brokers ?? []).map((b: any) => ({
        id: b.id,
        name: b.username,
        email: b.email,
        phone: b.phoneNumber,
        type: "broker" as const,
      }));
      const customerOptions: RecipientOption[] = (commentsData.comments ?? []).map((c: any) => ({
        id: c.id,
        name: c.customerName,
        phone: c.customerPhone,
        type: "customer" as const,
      }));
      setBrokers(brokerOptions);
      setCustomers(customerOptions);
      setLoadingRecipients(false);
    });
  }, [admin]);

  const canManage = can(admin?.role, "manage_messages");

  const filteredComments = (comments.data?.comments ?? []).filter((c: any) => {
    if (ratingFilter !== "all" && String(c.rating ?? "") !== ratingFilter) return false;
    const query = commentSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      (c.customerName ?? "").toLowerCase().includes(query) ||
      (c.comment ?? "").toLowerCase().includes(query) ||
      (c.customerPhone ?? "").toLowerCase().includes(query)
    );
  });

  const notifTypes: string[] = Array.from(new Set((notifications.data?.notifications ?? []).map((n: any) => n.type).filter(Boolean)));
  const notifChannels: string[] = Array.from(new Set((notifications.data?.notifications ?? []).map((n: any) => n.channel).filter(Boolean)));

  const filteredNotifications = (notifications.data?.notifications ?? []).filter((n: any) => {
    if (notifType !== "all" && n.type !== notifType) return false;
    if (notifChannel !== "all" && n.channel !== notifChannel) return false;
    const query = notifSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      (n.title ?? "").toLowerCase().includes(query) ||
      (n.content ?? "").toLowerCase().includes(query) ||
      (n.recipient ?? "").toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-semibold" style={{ color: COLORS.cardBrown }}>
          Messages
        </h2>
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
        </span>
        <span className="text-xs text-gray-400">Live updates every 15s</span>
      </div>

      <Panel title="System Messages">
        {system.loading ? (
          <LoadingState label="Loading messages" />
        ) : system.error ? (
          <ErrorState message={system.error} />
        ) : (system.data?.messages?.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No system messages.</p>
        ) : (
          <ul className="space-y-2">
            {(system.data?.messages ?? []).map((m: any, i: number) => (
              <li key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition-colors hover:border-[var(--zcanopy-accent-gold)] hover:shadow-md">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: COLORS.cardBrown }}>{m.title}</p>
                  <span className="text-xs text-gray-400">
                    {m.createdAt ? new Date(m.createdAt).toLocaleString() : ""}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Client Messages</h3>
        <div className="flex gap-2">
          {RATING_FILTERS.map((r) => (
            <button
              key={r}
              onClick={() => setRatingFilter(r)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-all ${
                ratingFilter === r
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={ratingFilter === r ? { backgroundColor: COLORS.primary } : {}}
            >
              {r === "all" ? "All" : `${r} ★`}
            </button>
          ))}
        </div>
      </div>

      <Panel title={`Client Messages (${filteredComments.length})`}>
        {comments.loading ? (
          <LoadingState />
        ) : filteredComments.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No client messages.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={commentSearch}
                  onChange={(e) => setCommentSearch(e.target.value)}
                  placeholder="Search comments..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <select
                value={ratingFilter}
                onChange={(e) => setRatingFilter(e.target.value as any)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
              >
                <option value="all">All ratings</option>
                <option value="5">5 ★</option>
                <option value="4">4 ★</option>
                <option value="3">3 ★</option>
                <option value="2">2 ★</option>
                <option value="1">1 ★</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">Customer</th>
                    <th className="py-2 pr-4">Phone</th>
                    <th className="py-2 pr-4">Comment</th>
                    <th className="py-2 pr-4">Rating</th>
                    <th className="py-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredComments.map((c: any) => (
                    <tr key={c.id} className="transition-colors hover:bg-[#D1A054]/5">
                      <td className="py-2 pr-4 font-medium">{c.customerName || "-"}</td>
                      <td className="py-2 pr-4 text-gray-600">{c.customerPhone || "-"}</td>
                      <td className="py-2 pr-4 text-gray-700">{c.comment || "-"}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
                          {c.rating ?? 0} / 5
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">
                        {c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="Sent Notifications">
        {notifications.loading ? (
          <LoadingState />
        ) : filteredNotifications.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No notifications yet.</p>
        ) : (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                  value={notifSearch}
                  onChange={(e) => setNotifSearch(e.target.value)}
                  placeholder="Search notifications..."
                  className="w-full bg-transparent text-sm outline-none"
                />
              </div>
              <select
                value={notifType}
                onChange={(e) => setNotifType(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
              >
                <option value="all">All types</option>
                {notifTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <select
                value={notifChannel}
                onChange={(e) => setNotifChannel(e.target.value)}
                className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
              >
                <option value="all">All channels</option>
                {notifChannels.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs uppercase text-gray-400">
                  <tr>
                    <th className="py-2 pr-4">Title</th>
                    <th className="py-2 pr-4">Type</th>
                    <th className="py-2 pr-4">Channel</th>
                    <th className="py-2 pr-4">Recipient</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2">Sent At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredNotifications.map((n: any) => (
                    <tr key={n.id} className="transition-colors hover:bg-[#D1A054]/5">
                      <td className="py-2 pr-4 font-medium">{n.title || n.type || "-"}</td>
                      <td className="py-2 pr-4 text-gray-600">{n.type}</td>
                      <td className="py-2 pr-4 text-gray-600">{n.channel}</td>
                      <td className="py-2 pr-4 text-gray-600">{n.recipient || "-"}</td>
                      <td className="py-2 pr-4">
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium">
                          {n.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-500">
                        {n.createdAt ? new Date(n.createdAt).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Panel>

      {canManage ? <SendMessageComposer brokers={brokers} customers={customers} loadingRecipients={loadingRecipients} /> : null}
    </div>
  );
}

function SendMessageComposer({ brokers, customers, loadingRecipients }: { brokers: RecipientOption[]; customers: RecipientOption[]; loadingRecipients: boolean }) {
  const { admin } = useAuth();
  const [recipientType, setRecipientType] = useState<"broker" | "customer">("broker");
  const [selectedRecipient, setSelectedRecipient] = useState<RecipientOption | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<"email" | "sms">("email");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setDone(null);
    setSubmitting(true);
    try {
      await adminApi.sendMessage(admin!.token, {
        adminId: admin!.id,
        adminUsername: admin!.username,
        recipientType,
        recipientEmail: channel === "email" ? selectedRecipient?.email : undefined,
        recipientPhone: channel === "sms" ? selectedRecipient?.phone : undefined,
        recipientName: selectedRecipient?.name || selectedRecipient?.id || "",
        messageType: "custom",
        subject,
        body,
        channel,
      });
      setDone("Message queued successfully.");
      setSubject("");
      setBody("");
      setSelectedRecipient(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send.");
    } finally {
      setSubmitting(false);
    }
  }

  const recipientOptions = recipientType === "broker" ? brokers : customers;

  return (
    <Panel title="Send Message">
      <form onSubmit={handleSend} className="max-w-xl space-y-3">
        <div className="flex gap-3">
          <select
            value={recipientType}
            onChange={(e) => {
              setRecipientType(e.target.value as "broker" | "customer");
              setSelectedRecipient(null);
            }}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
          >
            <option value="broker">Broker</option>
            <option value="customer">Customer</option>
          </select>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value as "email" | "sms")}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)]"
          >
            <option value="email">Email</option>
            <option value="sms">SMS</option>
          </select>
        </div>

        <RecipientPicker
          recipientType={recipientType}
          value={selectedRecipient?.id || ""}
          onChange={(id, option) => setSelectedRecipient(option)}
          options={recipientOptions}
          loading={loadingRecipients}
        />

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)] transition-colors"
        />
        <textarea
          required
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Message body"
          className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-[var(--zcanopy-primary)] transition-colors"
        />
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {done ? <p className="text-sm text-green-600">{done}</p> : null}
        <button
          type="submit"
          disabled={submitting || !selectedRecipient}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 disabled:opacity-60"
          style={{ backgroundColor: COLORS.primary }}
        >
          {submitting ? "Sending…" : "Send"}
        </button>
      </form>
    </Panel>
  );
}
