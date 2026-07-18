"use client";

import ZLoadingIndicator from "@/components/ZLoadingIndicator";
import { COLORS } from "@/lib/theme";

export default function LoadingOverlay({ label }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--background)]/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-[var(--zcanopy-surface)] p-8 shadow-lg">
        <ZLoadingIndicator size={72} color={COLORS.primary} label={label} />
      </div>
    </div>
  );
}
