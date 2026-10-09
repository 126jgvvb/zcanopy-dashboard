"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Sidebar from "@/components/Sidebar";
import ZLoadingIndicator from "@/components/ZLoadingIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import CookieBanner from "@/components/CookieBanner";
import { COLORS } from "@/lib/theme";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { admin, loading } = useAuth();

  useEffect(() => {
    console.log('[DashboardLayout] guard', { loading, admin: !!admin });
    if (!loading && !admin) {
      console.log('[DashboardLayout] redirecting to /login');
      try {
        router.replace("/login");
      } catch (err) {
        console.log('[DashboardLayout] router.replace failed', err);
        window.location.href = "/login";
      }
    }
  }, [admin, loading, router]);

  if (loading || !admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
        <ZLoadingIndicator size={72} color={COLORS.primary} label="Loading console" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar admin={admin} />
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)]/75 px-4 py-3 backdrop-blur-md sm:px-8 sm:py-4">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-tight text-[var(--zcanopy-card-brown)]">ZCanopy Admin</h1>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold tracking-tight">{admin.username}</p>
              <p className="text-xs capitalize text-[var(--zcanopy-muted)]">{admin.role.replace("_", " ")}</p>
            </div>
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full font-semibold text-white shadow-md ring-2 ring-[var(--zcanopy-accent-gold)]/40 sm:h-10 sm:w-10"
              style={{ backgroundColor: COLORS.primary }}
            >
              {admin.username.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 [animation:fadeIn_0.35s_ease]">{children}</main>
        <CookieBanner />
      </div>
    </div>
  );
}
