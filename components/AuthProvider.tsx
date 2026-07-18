"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { adminApi, ApiError } from "@/lib/api";

export interface AdminProfile {
  id: string;
  username: string;
  email: string;
  role: string;
  token: string;
}

interface AuthContextValue {
  admin: AdminProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AdminProfile>;
  devLogin: (email: string, password: string) => Promise<AdminProfile>;
  logout: () => void;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "zcanopy_admin_session";
const COOKIE_NAME = "zcanopy_admin_token";

const DEV_ADMIN: AdminProfile = {
  id: "dev-superadmin-1",
  username: "Dev Super Admin",
  email: "superadmin@zcanopy.dev",
  role: "super_admin",
  token: "dev-token-super-admin",
};

function setTokenCookie(token: string) {
  document.cookie = `${COOKIE_NAME}=${token}; path=/; max-age=${60 * 60 * 24 * 7}; samesite=lax`;
}

function clearTokenCookie() {
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; samesite=lax`;
}

function clearDevBypassCookie() {
  document.cookie = `zcanopy_dev_bypass=; path=/; max-age=0; samesite=lax`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AdminProfile;
        if (active) setAdmin(parsed);
      } else {
        const bypass = document.cookie
          .split("; ")
          .find((c) => c.startsWith("zcanopy_dev_bypass="));
        if (bypass) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(DEV_ADMIN));
          setTokenCookie(DEV_ADMIN.token);
          setAdmin(DEV_ADMIN);
        }
      }
    } catch {
      // ignore corrupt storage
    } finally {
      if (active) setLoading(false);
    }
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await adminApi.login(email, password);
    if (!result?.token) {
      throw new ApiError("Invalid login response", 401);
    }
    const profile: AdminProfile = {
      id: result.id,
      username: result.username,
      email: result.email,
      role: result.role,
      token: result.token,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setTokenCookie(profile.token);
    setAdmin(profile);
    return profile;
  }, []);

  const devLogin = useCallback(async (email: string, password: string) => {
    const result = await adminApi.devLogin(email, password);
    if (!result?.token) {
      throw new ApiError("Invalid dev login response", 401);
    }
    const profile: AdminProfile = {
      id: result.id,
      username: result.username,
      email: result.email,
      role: result.role,
      token: result.token,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    setTokenCookie(profile.token);
    setAdmin(profile);
    return profile;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    clearTokenCookie();
    clearDevBypassCookie();
    setAdmin(null);
  }, []);

  const getToken = useCallback(() => admin?.token ?? null, [admin]);

  return (
    <AuthContext.Provider value={{ admin, loading, login, devLogin, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
