"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import ZLoadingIndicator from "@/components/ZLoadingIndicator";
import { COLORS } from "@/lib/theme";

export default function Home() {
  const router = useRouter();
  const { admin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    router.replace(admin ? "/dashboard" : "/login");
  }, [admin, loading, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--background)]">
      <ZLoadingIndicator size={72} color={COLORS.primary} label="ZCanopy Admin" />
    </div>
  );
}
