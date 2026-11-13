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

/** A phone number registered against a landlord on the landlord registry. */
export interface LandlordPhone {
  phoneNumber: string;
  isPrimary: boolean;
  label: string;
}

/**
 * The landlord's registered numbers plus the one currently selected to
 * receive their SMS OTPs.
 */
export interface LandlordRegistryPhonesResponse {
  success: boolean;
  message?: string;
  landlordNin: string;
  landlordFullName: string;
  phones: LandlordPhone[];
  selectedPhoneNumber: string;
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
/**
 * Mock fallbacks are a development convenience only.
 *
 * In production a failed request must surface the error: the admin console
 * moves real money (withdrawals, commissions, tier prices) and approves real
 * verifications, so answering with fake data would be worse than an error.
 */
function mockFallbackAllowed(): boolean {
  return process.env.NODE_ENV === "development";
}

function shouldUseFallback(err: unknown): boolean {
  // Network / connection failure (server down, CORS, DNS, offline).
  if (!(err instanceof ApiError)) return true;
  // Server-side failure.
  return err.status >= 500 || err.status === 0;
}

 
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

    return data as T;
  } catch (err) {
    // Only fall back to mock data when the server is actually down/failing,
    // not for client errors (auth, validation, not-found, etc.).
    if (fallback !== undefined && mockFallbackAllowed() && shouldUseFallback(err)) {
      if (typeof console !== "undefined") {
        console.warn(
          `[api] Server request to "${path}" failed (${err instanceof ApiError ? err.status : "network error"}). Falling back to mock data (development only).`,
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
    apiFetch("/admin/commissions", { token}),

  brokerCommissions: (token: string) =>
    apiFetch("/admin/broker-commissions", { token}),

  currentCommission: (token: string) =>
    apiFetch("/admin/commission/current", { token}),

  monthlyIncome: (token: string) =>
    apiFetch<{ entries: { month: string; income: number }[] }>(
      "/admin/income/monthly",
      { token},
    ).then(async (data) => {
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        const entries = (data as any)?.entries;
        if (!entries || entries.length === 0) {
          // Development only, and loaded on demand so the mock catalogue never
          // reaches the production bundle.
          const { mockData } = await import("@/lib/mockData");
          return mockData.income();
        }
      }
      return data;
    }),

  brokers: (token: string, page = 1, limit = 10) =>
    apiFetch("/admin/brokers", { token, query: { page, limit }}),

  recentSignups: (token: string, limit = 10) =>
    apiFetch("/admin/recent/signups", { token, query: { limit }}),

  pendingVerifications: (token: string, page = 1, limit = 10) =>
    apiFetch("/admin/pending/verifications", { token, query: { page, limit }}),

  pendingDocuments: (token: string) =>
    apiFetch("/admin/pending/documents", { token}),

  properties: (token: string, page = 1, limit = 10, brokerCode?: string) =>
    apiFetch("/admin/properties", {
      token,
      query: { page, limit, brokerCode: brokerCode ?? "" },
    }),

  propertyLocations: (token: string) =>
    apiFetch("/admin/property/locations", { token}),

  property: (token: string, propertyId: string) =>
    apiFetch(`/admin/properties/${propertyId}`, { token }),

  brokerDetails: (token: string, brokerId: string) =>
    apiFetch(`/admin/brokers/${brokerId}/details`, { token }),

  brokerProperties: (token: string, brokerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/brokers/${brokerId}/properties`, {
      token,
      query: { page, limit },
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
    }),

  /* ---- Landlord & title (UgNLIS) verifications ---- */

  landlordVerifications: (
    token: string,
    page = 1,
    limit = 20,
    status = "all",
    brokerCode?: string,
  ) =>
    apiFetch<{ verifications: any[]; total: number; page: number; limit: number }>(
      "/admin/landlord-verifications",
      {
        token,
        query: { page, limit, status, brokerCode: brokerCode ?? "" },
      },
    ),

  approveLandlordVerification: (
    token: string,
    verificationId: string,
    payload: { instrumentNumber: string },
  ) =>
    apiFetch(`/admin/landlord-verifications/${verificationId}/approve`, {
      method: "POST",
      token,
      body: payload,
    }),

  rejectLandlordVerification: (
    token: string,
    verificationId: string,
    payload: { reason: string },
  ) =>
    apiFetch(`/admin/landlord-verifications/${verificationId}/reject`, {
      method: "POST",
      token,
      body: payload,
    }),

  /* ---- Landlord phone numbers (landlord registry) ---- */

  landlordRegistryPhones: (token: string, landlordNin: string) =>
    apiFetch<LandlordRegistryPhonesResponse>(
      `/admin/landlord-registry/${encodeURIComponent(landlordNin)}/phones`,
      {
        token,
      },
    ),

  addLandlordRegistryPhone: (
    token: string,
    landlordNin: string,
    payload: { phoneNumber: string; label?: string },
  ) =>
    apiFetch<LandlordRegistryPhonesResponse>(
      `/admin/landlord-registry/${encodeURIComponent(landlordNin)}/phones`,
      {
        method: "POST",
        token,
        body: payload,
      },
    ),

  selectLandlordRegistryPhone: (
    token: string,
    landlordNin: string,
    payload: { phoneNumber: string },
  ) =>
    apiFetch<LandlordRegistryPhonesResponse>(
      `/admin/landlord-registry/${encodeURIComponent(landlordNin)}/phones/select`,
      {
        method: "POST",
        token,
        body: payload,
      },
    ),

  removeLandlordRegistryPhone: (
    token: string,
    landlordNin: string,
    payload: { phoneNumber: string },
  ) =>
    apiFetch<LandlordRegistryPhonesResponse>(
      `/admin/landlord-registry/${encodeURIComponent(landlordNin)}/phones/remove`,
      {
        method: "POST",
        token,
        body: payload,
      },
    ),

  approveAllPending: (token: string) =>
    apiFetch("/admin/pending/verifications/approve-all", {
      method: "POST",
      token,
    }),

  deleteBroker: (token: string, brokerId: string) =>
    apiFetch(`/admin/brokers/${brokerId}`, { method: "DELETE", token}),

  editBrokerTier: (token: string, brokerId: string, tier: string) =>
    apiFetch(`/admin/brokers/${brokerId}/tier`, {
      method: "PUT",
      token,
      body: { tier },
    }),

  admins: (token: string) => apiFetch("/admin/admins", { token}),

  addAdmin: (token: string, payload: Record<string, unknown>) =>
    apiFetch("/admin/admins", { method: "POST", token, body: payload}),

  deleteAdmin: (token: string, adminId: string, deletedBy: string) =>
    apiFetch(`/admin/admins/${adminId}`, {
      method: "DELETE",
      token,
      body: { deletedBy },
    }),

  freezeAdmin: (token: string, adminId: string, freeze: boolean, updatedBy: string) =>
    apiFetch(`/admin/admins/${adminId}/freeze`, {
      method: "PUT",
      token,
      body: { freeze, updatedBy },
    }),

  updateAdminUsername: (token: string, adminId: string, username: string) =>
    apiFetch(`/admin/admins/${adminId}/username`, {
      method: "PUT",
      token,
      body: { username },
    }),

  generateInvitationCode: (
    token: string,
    payload: { role: string; expiryHours: number },
  ) =>
    apiFetch("/admin/invitation-code", { method: "POST", token, body: payload}),

  /**
   * Stops the escrow sweep from retrying a reversal that keeps failing. The
   * provider rejects the disbursement, so every sweep burns a provider call
   * and writes another failed transaction row for a booking that will never
   * succeed.
   */
  stopBookingReversal: (token: string, bookingCode: string, reason?: string) =>
    apiFetch(`/admin/bookings/${encodeURIComponent(bookingCode)}/stop-reversal`, {
      method: "POST",
      token,
      body: { reason: reason || "" },
    }),

  /** Starts the escrow sweep retrying a booking again. */
  resumeBookingReversal: (token: string, bookingCode: string) =>
    apiFetch(`/admin/bookings/${encodeURIComponent(bookingCode)}/resume-reversal`, {
      method: "POST",
      token,
    }),

  transactions: (token: string, page = 1, limit = 10, brokerId?: string, reason?: string) =>
    apiFetch("/admin/transactions", {
      token,
      query: { page, limit, brokerId: brokerId ?? "", reason: reason ?? "" },
    }),

  systemMessages: (token: string, page = 1, limit = 10) =>
    apiFetch("/admin/system/messages", { token, query: { page, limit }}),

  clientMessages: (token: string, page = 1, limit = 10) =>
    apiFetch("/admin/client/messages", { token, query: { page, limit }}),

  sendMessage: (token: string, payload: Record<string, unknown>) =>
    apiFetch("/admin/messages/send", { method: "POST", token, body: payload}),

  sendMessageToAudience: (token: string, payload: Record<string, unknown>) =>
    apiFetch<{ success: boolean; sent: number; failed: number; message: string }>("/admin/messages/send-to-audience", { method: "POST", token, body: payload}),

  notifications: (token: string, query?: Record<string, string | number | undefined>) =>
    apiFetch("/admin/notifications", { token, query}),

  wallet: (token: string, walletId?: string) =>
    apiFetch("/admin/wallet", { token, query: { walletId: walletId ?? "" }}),

  withdraw: (token: string, payload: Record<string, unknown>) =>
    apiFetch("/admin/withdraw", { method: "POST", token, body: payload}),

  sendWithdrawalOtp: (token: string, payload: { email: string; amount: number; walletType?: string }) =>
    apiFetch("/admin/withdraw/otp/send", { method: "POST", token, body: payload}),

  verifyWithdrawalOtp: (token: string, payload: { email: string; otp: string }) =>
    apiFetch("/admin/withdraw/otp/verify", { method: "POST", token, body: payload}),

  tiers: (token: string) =>
    apiFetch<{ tiers: TierPrice[] }>("/admin/tiers", { token}),

  updateTierPrice: (token: string, tier: string, price: number) =>
    apiFetch(`/admin/tiers/${tier}`, {
      method: "PUT",
      token,
      body: { price },
    }),

  logs: (token: string, page = 1, limit = 10, level?: string, service?: string) =>
    apiFetch("/admin/logs", {
      token,
      query: { page, limit, level: level ?? "", service: service ?? "" },
    }),

  activeSessions: (token: string) =>
    apiFetch("/admin/customers/active-sessions", { token}),

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
    }),

  searchById: (token: string, id: string) =>
    apiFetch(`/admin/searches/${id}`, { token }),

  deleteSearch: (token: string, searchId: string) =>
    apiFetch(`/admin/searches/${searchId}`, { method: "DELETE", token}),

  deleteSearches: (token: string, searchIds: string[]) =>
    apiFetch("/admin/searches/batch-delete", { method: "DELETE", token, body: { searchIds }}),

  customers: (token: string, page = 1, limit = 10, isActive?: boolean, search?: string) =>
    apiFetch("/admin/customers", {
      token,
      query: { page, limit, isActive, search: search || '' },
    }),

  customerDetails: (token: string, customerId: string) =>
    apiFetch(`/admin/customers/${customerId}`, { token}),

  customerTransactions: (token: string, customerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/customers/${customerId}/transactions`, { token, query: { page, limit }}),

  customerInvoices: (token: string, customerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/customers/${customerId}/invoices`, { token, query: { page, limit }}),

  customerBookings: (token: string, customerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/customers/${customerId}/bookings`, { token, query: { page, limit }}),

  customerFavorites: (token: string, customerId: string, page = 1, limit = 10) =>
    apiFetch(`/admin/customers/${customerId}/favorites`, { token, query: { page, limit }}),

  exportCustomers: (token: string, isActive?: boolean) =>
    apiFetch("/admin/customers/export", { token, query: { isActive: isActive ?? "" }}),

  invoices: (token: string, page = 1, limit = 10, status?: string) =>
    apiFetch("/admin/invoices", {
      token,
      query: { page, limit, status: status ?? "" },
    }),

  deleteInvoice: (token: string, invoiceId: string) =>
    apiFetch(`/admin/invoices/${invoiceId}`, { method: "DELETE", token}),

  deleteInvoices: (token: string, invoiceIds: string[]) =>
    apiFetch("/admin/invoices/batch-delete", { method: "DELETE", token, body: { invoiceIds }}),

  registerBroker: (payload: {
    fullName: string;
    email: string;
    phoneNumber: string;
    idFrontUrl?: string;
    idBackUrl?: string;
  }) =>
    apiFetch<{ success: boolean; message: string; expiresInSeconds?: number }>(
      "/broker/register",
      { method: "POST", body: payload},
    ),

  sendBrokerOtp: (email: string, phoneNumber: string) =>
    apiFetch("/broker/otp/send", { method: "POST", body: { email, phoneNumber }}),

  verifyBrokerOtp: (email: string, phoneNumber: string, emailCode: string, phoneCode: string) =>
    apiFetch("/broker/otp/verify", {
      method: "POST",
      body: { email, phoneNumber, emailCode, phoneCode },
    }),

  sendForgotPasswordOtp: (email: string) =>
    apiFetch<{ success: boolean; message: string }>("/admin/forgot-password/otp/send", { method: "POST", body: { email }}),

  verifyForgotPasswordOtp: (email: string, otp: string) =>
    apiFetch<{ success: boolean; message: string; valid: boolean }>("/admin/forgot-password/otp/verify", { method: "POST", body: { email, otp }}),

  resetPassword: (email: string, password: string) =>
    apiFetch<{ success: boolean; message: string }>("/admin/forgot-password/reset", { method: "POST", body: { email, password }}),

  featuredProperties: () =>
    apiFetch("/public/properties/featured", {}),

  comments: (token: string, page = 1, limit = 20, propertyId?: string) =>
    apiFetch("/admin/comments", {
      token,
      query: { page, limit, propertyId: propertyId ?? "" },
    }),
};

export const authApi = {
  login: (email: string, password: string) => adminApi.login(email, password),
};
