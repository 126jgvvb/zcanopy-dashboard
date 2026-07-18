/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi, ApiError } from "@/lib/api";
import { can, COLORS } from "@/lib/theme";
import { RecipientPicker, type RecipientOption } from "@/components/RecipientPicker";

export default function MessagesPage() {
  const { admin } = useAuth();
  const [liveTick, setLiveTick] = useState(0);
  const [brokers, setBrokers] = useState<RecipientOption[]>([]);
  const [customers, setCustomers] = useState<RecipientOption[]>([]);
  const [loadingRecipients, setLoadingRecipients] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setLiveTick((t) => t + 1), 15000);
    return () => clearInterval(interval);
  }, []);

  const system = useAdminData((token) => adminApi.systemMessages(token, 1, 15), [liveTick]);
  const client = useAdminData((token) => adminApi.clientMessages(token, 1, 15), [liveTick]);
  const notifications = useAdminData((token) =>
    adminApi.notifications(token, { limit: 15 }),
    [liveTick],
  );

  useEffect(() => {
    setLoadingRecipients(true);
    Promise.all([
      adminApi.brokers(admin!.token, 1, 100).catch(() => ({ brokers: [] })),
      adminApi.clientMessages(admin!.token, 1, 100).catch(() => ({ messages: [] })),
    ]).then(([brokersData, clientsData]) => {
      const brokerOptions: RecipientOption[] = (brokersData.brokers ?? []).map((b: any) => ({
        id: b.id,
        name: b.username,
        email: b.email,
        phone: b.phoneNumber,
        type: "broker" as const,
      }));
      const customerOptions: RecipientOption[] = (clientsData.messages ?? []).map((m: any) => ({
        id: m.id,
        name: m.senderName,
        phone: m.senderPhone,
        type: "customer" as const,
      }));
      setBrokers(brokerOptions);
      setCustomers(customerOptions);
      setLoadingRecipients(false);
    });
  }, [admin]);

  const canManage = can(admin?.role, "manage_messages");

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

      <Panel title="Client Messages">
        {client.loading ? (
          <LoadingState />
        ) : (client.data?.messages?.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">No client messages.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(client.data?.messages ?? []).map((m: any, i: number) => (
              <li key={i} className="py-3 transition-colors hover:bg-[#D1A054]/5">
                <p className="text-sm">
                  <span className="font-medium">{m.senderName}</span>{" "}
                  <span className="text-gray-400">({m.senderPhone})</span>
                </p>
                <p className="text-xs text-gray-500">{m.message}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Sent Notifications">
        {notifications.loading ? (
          <LoadingState />
        ) : (notifications.data?.notifications?.length ?? 0) === 0 ? (
          <p className="py-6 text-center text-sm text-gray-400">
            No sent notifications yet.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {(notifications.data?.notifications ?? []).map((n: any, i: number) => (
              <li key={i} className="flex items-center justify-between py-3 text-sm transition-colors hover:bg-[#D1A054]/5">
                <div>
                  <p className="font-medium">{n.subject ?? n.type}</p>
                  <p className="text-xs text-gray-400">
                    {n.recipientEmail || n.recipientPhone}
                  </p>
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs">
                  {n.status}
                </span>
              </li>
            ))}
          </ul>
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
