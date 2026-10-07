/**
 * Thin HTTP client for the ZCanopy API Gateway.
 *
 * All admin endpoints are protected by a JWT bearer token (Authorization header).
 * The token returned by the admin `LoginAdmin` gRPC method (a base64 string) is
 * used directly as the bearer token, matching the gateway's JwtAuthGuard.
 */

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://api-gateway-production-f9cc.up.railway.app/api";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function toDate(value: unknown): Date {
  if (value instanceof Date) return value;
  if (typeof value === "number") return new Date(value);
  if (typeof value === "string") return new Date(value);
  if (value && typeof value === "object" && "low" in value && "high" in value) {
    const high = (value as { high: number }).high || 0;
    const low = (value as { low: number }).low || 0;
    const unsigned = (value as { unsigned?: boolean }).unsigned;
    const ms = unsigned
      ? high * 0x100000000 + low
      : high * 0x100000000 + (low >>> 0);
    return new Date(ms);
  }
  return new Date(0);
}

export function formatDate(value: unknown): string {
  const d = toDate(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}


export interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  token?: string | null;
  query?: Record<string, string | number | boolean | undefined>;
  fallback?: unknown;
}

export interface TierPrice {
  tier: string;
  price: number;
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
        const parsed = JSON.parse(text) as Record<string, unknown>;
        data = parsed.encrypted ? await decryptResponse(parsed) : parsed;
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

    if (typeof window !== 'undefined') {
      console.log('[apiFetch] raw server response', path, JSON.parse(JSON.stringify(data)));
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
    // Wrap raw network errors in a user-friendly ApiError.
    if (!(err instanceof ApiError)) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      const friendly = /Cannot POST|Cannot GET|Failed to fetch|NetworkError|fetch.*failed|net::ERR/i.test(rawMessage)
        ? "Unable to connect to the server. Please check your connection or try again later."
        : rawMessage;
      throw new ApiError(friendly, 0);
    }
    throw err;
  }
}

export interface PresignResponse {
  uploadUrl: string;
  key: string;
  publicUrl: string;
}

async function getUploadPresignedUrl(filename: string, contentType: string, folder = 'properties'): Promise<PresignResponse> {
  const res = await fetch(`${API_BASE}/upload/presign`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, contentType, folder }),
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error(`Failed to get upload URL: ${res.status}`);
  }

  const text = await res.text();
  if (!text) return { uploadUrl: '', key: '', publicUrl: '' };
  try {
    const parsed = JSON.parse(text);
    return parsed.encrypted ? await decryptResponse(parsed) : parsed;
  } catch {
    return { uploadUrl: '', key: '', publicUrl: '' };
  }
}

export async function uploadToSpaces(file: File, folder = 'properties'): Promise<string> {
  try {
    const { uploadUrl, publicUrl } = await getUploadPresignedUrl(file.name, file.type, folder);

    if (!uploadUrl) {
      throw new Error('Missing upload URL from presign response');
    }

    const res = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`);
    }

    return publicUrl;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return uploadToSpacesViaProxy(file, folder);
    }
    throw error;
  }
}

async function uploadToSpacesViaProxy(file: File, folder = 'properties'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload/proxy?folder=${encodeURIComponent(folder)}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Proxy upload failed: ${res.status} - ${text}`);
  }

  const data = await res.json();
  return data.publicUrl;
}

import { mockData, MOCK_CUSTOMERS } from "@/lib/mockData";
import { decryptResponse } from "@/lib/crypto";

export const adminApi = {
  login: (email: string, password: string) =>
    apiFetch<{
      id: string;
      username: string;
      email: string;
      role: string;
      token: string;
      accessToken?: string;
      refreshToken?: string;
    }>(
      "/auth/login",
      { method: "POST", body: { email, password } },
    ).then((result) => ({
      ...result,
      token: result.token || result.accessToken || "",
      refreshToken: result.refreshToken || "",
    })),

  devLogin: (email: string, password: string) =>
    apiFetch<{ id: string; username: string; email: string; role: string; token: string; refreshToken?: string }>(
      "/auth/dev-login",
      { method: "POST", body: { email, password } },
    ),

  refresh: (refreshToken: string) =>
    apiFetch<{ token: string; accessToken?: string; refreshToken?: string }>(
      "/auth/refresh",
      { method: "POST", body: { token: refreshToken } },
    ).then((result) => ({
      token: result.token || result.accessToken || "",
      refreshToken: result.refreshToken || "",
    })),

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
    ).then((data) => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const entries = (data as any)?.entries;
        if (!entries || entries.length === 0) {
          return mockData.income();
        }
      }
      return data;
    }),

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

  property: (token: string, propertyId: string) =>
    apiFetch(`/admin/properties/${propertyId}`, { token, fallback: mockData.property(propertyId) }),

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

  updateAdminUsername: (token: string, adminId: string, username: string) =>
    apiFetch(`/admin/admins/${adminId}/username`, {
      method: "PUT",
      token,
      body: { username },
      fallback: { success: true, message: "Username updated (mock)" },
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

  sendWithdrawalOtp: (token: string, payload: { email: string; amount: number; walletType?: string }) =>
    apiFetch("/admin/withdraw/otp/send", { method: "POST", token, body: payload, fallback: { success: true, message: "OTP sent to admin email", expiresIn: 300 } }),

  verifyWithdrawalOtp: (token: string, payload: { email: string; otp: string }) =>
    apiFetch("/admin/withdraw/otp/verify", { method: "POST", token, body: payload, fallback: { success: true, message: "OTP verified successfully", valid: true } }),

  tiers: (token: string) =>
    apiFetch<{ tiers: TierPrice[] }>("/admin/tiers", { token, fallback: { tiers: [{ tier: "fibrous", price: 25000 }, { tier: "buttress", price: 50000 }, { tier: "prop", price: 0 }] } }),

  updateTierPrice: (token: string, tier: string, price: number) =>
    apiFetch(`/admin/tiers/${tier}`, {
      method: "PUT",
      token,
      body: { price },
      fallback: { success: true, message: "Tier price updated (mock)" },
    }),

  logs: (token: string, page = 1, limit = 10, level?: string, service?: string) =>
    apiFetch("/admin/logs", {
      token,
      query: { page, limit, level: level ?? "", service: service ?? "" },
      fallback: mockData.logs(page, limit, level, service),
    }),

  activeSessions: (token: string) =>
    apiFetch("/admin/customers/active-sessions", { token, fallback: mockData.activeSessions() }),

  searches: (
    token: string,
    page = 1,
    limit = 20,
    filters: {
      customerId?: string;
      query?: string;
      propertyType?: string;
      location?: string;
      brokerCode?: string;
      brokerBrandName?: string;
      subCounty?: string;
      district?: string;
      minPrice?: number;
      maxPrice?: number;
      fromDate?: string;
      toDate?: string;
      lat?: number;
      lng?: number;
      radiusKm?: number;
    } = {},
  ) =>
    apiFetch("/admin/searches", {
      token,
      query: {
        page,
        limit,
        customerId: filters.customerId ?? "",
        query: filters.query ?? "",
        propertyType: filters.propertyType ?? "",
        location: filters.location ?? "",
        brokerCode: filters.brokerCode ?? "",
        brokerBrandName: filters.brokerBrandName ?? "",
        subCounty: filters.subCounty ?? "",
        district: filters.district ?? "",
        minPrice: filters.minPrice ?? 0,
        maxPrice: filters.maxPrice ?? 0,
        fromDate: filters.fromDate ?? "",
        toDate: filters.toDate ?? "",
        lat: filters.lat ?? 0,
        lng: filters.lng ?? 0,
        radiusKm: filters.radiusKm ?? 0,
      },
      fallback: mockData.searches(page, limit, filters),
    }),

  searchById: (token: string, id: string) =>
    apiFetch(`/admin/searches/${id}`, { token }),

  customers: (token: string, page = 1, limit = 10, isActive?: boolean, search?: string) =>
    apiFetch("/admin/customers", {
      token,
      query: { page, limit, isActive, search: search || '' },
      fallback: mockData.customers(page, limit, isActive, search),
    }),

  customerDetails: (token: string, customerId: string) =>
    apiFetch(`/admin/customers/${customerId}`, { token, fallback: mockData.customerDetails(customerId) }),

  customerTransactions: (token: string, customerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/customers/${customerId}/transactions`, { token, query: { page, limit }, fallback: mockData.customerTransactions(customerId, page, limit) }),

  customerInvoices: (token: string, customerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/customers/${customerId}/invoices`, { token, query: { page, limit }, fallback: mockData.customerInvoices(customerId, page, limit) }),

  customerBookings: (token: string, customerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/customers/${customerId}/bookings`, { token, query: { page, limit }, fallback: mockData.customerBookings(customerId, page, limit) }),

  customerFavorites: (token: string, customerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/customers/${customerId}/favorites`, { token, query: { page, limit }, fallback: mockData.customerFavorites(customerId, page, limit) }),

  exportCustomers: (token: string, isActive?: boolean) =>
    apiFetch("/admin/customers/export", { token, query: { isActive: isActive ?? "" }, fallback: { csv: "id,email,firstName,lastName,phoneNumber,isVerified,authProvider,isActive,createdAt\n" + MOCK_CUSTOMERS.map(c => `${c.id},${c.email},${c.firstName},${c.lastName},${c.phoneNumber},${c.isVerified},${c.authProvider},${c.isActive},${c.createdAt}`).join("\n") } }),

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
    apiFetch<{ success: boolean; message: string; expiresInSeconds?: number }>(
      "/broker/register",
      { method: "POST", body: payload, fallback: { success: true, message: "Account created (mock)" } },
    ),

  sendBrokerOtp: (email: string, phoneNumber: string) =>
    apiFetch("/broker/otp/send", { method: "POST", body: { email, phoneNumber }, fallback: { success: true, message: "OTP sent (mock)", devCode: "123456" } }),

  verifyBrokerOtp: (email: string, phoneNumber: string, emailCode: string, phoneCode: string) =>
    apiFetch("/broker/otp/verify", {
      method: "POST",
      body: { email, phoneNumber, emailCode, phoneCode },
      fallback: { success: true, message: "Verified (mock)" },
    }),

  sendForgotPasswordOtp: (email: string) =>
    apiFetch<{ success: boolean; message: string }>("/admin/forgot-password/otp/send", { method: "POST", body: { email }, fallback: { success: true, message: "OTP sent (mock)" } }),

  verifyForgotPasswordOtp: (email: string, otp: string) =>
    apiFetch<{ success: boolean; message: string; valid: boolean }>("/admin/forgot-password/otp/verify", { method: "POST", body: { email, otp }, fallback: { success: true, message: "OTP verified (mock)", valid: true } }),

  resetPassword: (email: string, password: string) =>
    apiFetch<{ success: boolean; message: string }>("/admin/forgot-password/reset", { method: "POST", body: { email, password }, fallback: { success: true, message: "Password reset (mock)" } }),

  featuredProperties: () =>
    apiFetch("/public/properties/featured", { fallback: mockData.featuredProperties() }),

  comments: (token: string, page = 1, limit = 20, propertyId?: string) =>
    apiFetch("/admin/comments", {
      token,
      query: { page, limit, propertyId: propertyId ?? "" },
      fallback: mockData.comments(page, limit, propertyId),
    }),
};

export const authApi = {
  login: (email: string, password: string) => adminApi.login(email, password),
};
