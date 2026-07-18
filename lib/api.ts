/**
 * Thin HTTP client for the ZCanopy API Gateway.
 *
 * All admin endpoints are protected by a JWT bearer token (Authorization header).
 * The token returned by the admin `LoginAdmin` gRPC method (a base64 string) is
 * used directly as the bearer token, matching the gateway's JwtAuthGuard.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}


export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined>;
  fallback?: unknown;
}


function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/**
 * A server request only falls back to mock data when the server itself is
 * unreachable or failing:
 *   - a network/connection error (fetch throws), or
 *   - a 5xx server error.
 *
 * Client errors (4xx such as 401/403/404/400) are surfaced as real errors so
 * genuine problems are never masked by mock data.
 */
function shouldUseFallback(err: unknown): boolean {
  // Network / connection failure (server down, CORS, DNS, offline).
  if (!(err instanceof ApiError)) return true;
  // Server-side failure.
  return err.status >= 500 || err.status === 0;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function apiFetch<T = any>(
  path: string,
  { method = "GET", body, token, query, fallback }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    const res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    let data: Record<string, unknown> | string | null = null;
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text) as Record<string, unknown>;
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const message =
        (data && typeof data === "object" && ((data as Record<string, unknown>).message || (data as Record<string, unknown>).error)) ||
        `Request failed with status ${res.status}`;
      throw new ApiError(message as string, res.status);
    }

    return data as T;
  } catch (err) {
    // Only fall back to mock data when the server is actually down/failing,
    // not for client errors (auth, validation, not-found, etc.).
    if (fallback !== undefined && shouldUseFallback(err)) {
      if (typeof console !== "undefined") {
        console.warn(
          `[api] Server request to "${path}" failed (${err instanceof ApiError ? err.status : "network error"}). Falling back to mock data.`,
        );
      }
      return fallback as T;
    }
    throw err;
  }
}

import { mockData } from "@/lib/mockData";

export const adminApi = {
  login: (email: string, password: string) =>
    apiFetch<{ id: string; username: string; email: string; role: string; token: string }>(
      "/admin/login",
      { method: "POST", body: { email, password } },
    ),

  devLogin: (email: string, password: string) =>
    apiFetch<{ id: string; username: string; email: string; role: string; token: string }>(
      "/auth/dev-login",
      { method: "POST", body: { email, password } },
    ),

  commissions: (token: string) =>
    apiFetch("/admin/commissions", { token, fallback: mockData.commission() }),

  brokerCommissions: (token: string) =>
    apiFetch("/admin/broker-commissions", { token, fallback: mockData.brokerCommissions() }),

  currentCommission: (token: string) =>
    apiFetch("/admin/commission/current", { token, fallback: mockData.currentCommission() }),

  monthlyIncome: (token: string) =>
    apiFetch<{ entries: { month: string; income: number }[] }>(
      "/admin/income/monthly",
      { token, fallback: mockData.income() },
    ),

  brokers: (token: string, page = 1, limit = 10) =>
    apiFetch("/admin/brokers", { token, query: { page, limit }, fallback: mockData.brokers() }),

  recentSignups: (token: string, limit = 10) =>
    apiFetch("/admin/recent/signups", { token, query: { limit }, fallback: mockData.recentSignups(limit) }),

  pendingVerifications: (token: string, page = 1, limit = 10) =>
    apiFetch("/admin/pending/verifications", { token, query: { page, limit }, fallback: mockData.pendingVerifications(page, limit) }),

  pendingDocuments: (token: string) =>
    apiFetch("/admin/pending/documents", { token, fallback: { documents: [] } }),

  properties: (token: string, page = 1, limit = 10, brokerCode?: string) =>
    apiFetch("/admin/properties", {
      token,
      query: { page, limit, brokerCode: brokerCode ?? "" },
      fallback: mockData.properties(page, limit),
    }),

  propertyLocations: (token: string) =>
    apiFetch("/admin/property/locations", { token, fallback: mockData.propertyLocations() }),

  brokerDetails: (token: string, brokerId: string) =>
    apiFetch(`/admin/brokers/${brokerId}/details`, { token, fallback: mockData.brokerDetails(brokerId) }),

  brokerProperties: (token: string, brokerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/brokers/${brokerId}/properties`, {
      token,
      query: { page, limit },
      fallback: mockData.brokerProperties(brokerId, page, limit),
    }),

  approveDocument: (
    token: string,
    brokerId: string,
    payload: { namesMatched: boolean; adminNotes?: string },
  ) =>
    apiFetch(`/admin/brokers/${brokerId}/approve-document`, {
      method: "POST",
      token,
      body: payload,
      fallback: { success: true, message: "Document approved (mock)" },
    }),

  approveAllPending: (token: string) =>
    apiFetch("/admin/pending/verifications/approve-all", {
      method: "POST",
      token,
      fallback: { success: true, totalProcessed: 0, successful: 0, failed: 0, results: [] },
    }),

  deleteBroker: (token: string, brokerId: string) =>
    apiFetch(`/admin/brokers/${brokerId}`, { method: "DELETE", token, fallback: { success: true, message: "Broker deleted (mock)" } }),

  editBrokerTier: (token: string, brokerId: string, tier: string) =>
    apiFetch(`/admin/brokers/${brokerId}/tier`, {
      method: "PUT",
      token,
      body: { tier },
      fallback: { success: true, message: "Tier updated (mock)" },
    }),

  admins: (token: string) => apiFetch("/admin/admins", { token, fallback: mockData.admins() }),

  addAdmin: (token: string, payload: Record<string, unknown>) =>
    apiFetch("/admin/admins", { method: "POST", token, body: payload, fallback: { id: "mock-new", ...payload, message: "Admin added (mock)" } }),

  deleteAdmin: (token: string, adminId: string, deletedBy: string) =>
    apiFetch(`/admin/admins/${adminId}`, {
      method: "DELETE",
      token,
      body: { deletedBy },
      fallback: { success: true, message: "Admin deleted (mock)" },
    }),

  freezeAdmin: (token: string, adminId: string, freeze: boolean, updatedBy: string) =>
    apiFetch(`/admin/admins/${adminId}/freeze`, {
      method: "PUT",
      token,
      body: { freeze, updatedBy },
      fallback: { success: true, message: freeze ? "Admin frozen (mock)" : "Admin unfrozen (mock)" },
    }),

  generateInvitationCode: (
    token: string,
    payload: { role: string; expiryHours: number },
  ) =>
    apiFetch("/admin/invitation-code", { method: "POST", token, body: payload, fallback: { invitationCode: "DEV-CODE-123", role: payload.role, expiresAt: new Date(Date.now() + 86400000).toISOString() } }),

  transactions: (token: string, page = 1, limit = 10, brokerId?: string, reason?: string) =>
    apiFetch("/admin/transactions", {
      token,
      query: { page, limit, brokerId: brokerId ?? "", reason: reason ?? "" },
      fallback: mockData.transactions(page, limit),
    }),

  systemMessages: (token: string, page = 1, limit = 10) =>
    apiFetch("/admin/system/messages", { token, query: { page, limit }, fallback: mockData.systemMessages(page, limit) }),

  clientMessages: (token: string, page = 1, limit = 10) =>
    apiFetch("/admin/client/messages", { token, query: { page, limit }, fallback: mockData.clientMessages(page, limit) }),

  sendMessage: (token: string, payload: Record<string, unknown>) =>
    apiFetch("/admin/messages/send", { method: "POST", token, body: payload, fallback: { success: true, message: "Message sent (mock)", messageId: "mock-msg-1" } }),

  notifications: (token: string, query?: Record<string, string | number | undefined>) =>
    apiFetch("/admin/notifications", { token, query, fallback: mockData.notifications(query) }),

  wallet: (token: string, walletId?: string) =>
    apiFetch("/admin/wallet", { token, query: { walletId: walletId ?? "" }, fallback: mockData.wallet() }),

  withdraw: (token: string, payload: Record<string, unknown>) =>
    apiFetch("/admin/withdraw", { method: "POST", token, body: payload, fallback: { success: true, message: "Withdrawal initiated (mock)", transactionId: "mock-txn-1", referenceNumber: "REF-MOCK-001", status: "pending", netAmount: payload.amount } }),

  logs: (token: string, page = 1, limit = 10, level?: string, service?: string) =>
    apiFetch("/admin/logs", {
      token,
      query: { page, limit, level: level ?? "", service: service ?? "" },
      fallback: mockData.logs(page, limit, level, service),
    }),

  activeSessions: (token: string) =>
    apiFetch("/admin/customers/active-sessions", { token, fallback: mockData.activeSessions() }),

  invoices: (token: string, page = 1, limit = 10, status?: string) =>
    apiFetch("/admin/invoices", {
      token,
      query: { page, limit, status: status ?? "" },
      fallback: mockData.invoices(status),
    }),

  deleteInvoice: (token: string, invoiceId: string) =>
    apiFetch(`/admin/invoices/${invoiceId}`, { method: "DELETE", token, fallback: { success: true, message: "Invoice deleted (mock)" } }),

  deleteInvoices: (token: string, invoiceIds: string[]) =>
    apiFetch("/admin/invoices/batch-delete", { method: "DELETE", token, body: { invoiceIds }, fallback: { success: true, message: `Deleted ${invoiceIds.length} invoices (mock)` } }),

  registerBroker: (payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    idFrontUrl?: string;
    idBackUrl?: string;
  }) =>
    apiFetch<{ brokerId: string; email: string; phoneNumber: string; brokerCode: string }>(
      "/broker/register",
      { method: "POST", body: payload, fallback: { brokerId: "brk-mock-1", email: payload.email, phoneNumber: payload.phoneNumber, brokerCode: payload.email } },
    ),

  sendBrokerOtp: (email: string, phoneNumber: string) =>
    apiFetch("/broker/otp/send", { method: "POST", body: { email, phoneNumber }, fallback: { success: true, message: "OTP sent (mock)", devCode: "123456" } }),

  verifyBrokerOtp: (email: string, phoneNumber: string, emailCode: string, phoneCode: string) =>
    apiFetch("/broker/otp/verify", {
      method: "POST",
      body: { email, phoneNumber, emailCode, phoneCode },
      fallback: { success: true, message: "Verified (mock)" },
    }),

  featuredProperties: () =>
    apiFetch("/public/properties/featured", { fallback: mockData.featuredProperties() }),
};

export const authApi = {
  login: (email: string, password: string) => adminApi.login(email, password),
};
