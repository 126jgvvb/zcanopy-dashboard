"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import ZLoadingIndicator from "@/components/ZLoadingIndicator";
import { COLORS } from "@/lib/theme";

type Fetcher<T> = (token: string) => Promise<T>;

export function useAdminData<T>(fetcher: Fetcher<T>, deps: unknown[] = []) {
  const { admin } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (!admin) return;
    let active = true;
    setLoading(true);
    setError(null);
    fetcherRef.current(admin.token)
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active)
          setError(err instanceof ApiError ? err.message : "Failed to load data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, ...deps]);

  function reload() {
    if (!admin) return;
    setLoading(true);
    setError(null);
    fetcherRef.current(admin.token)
      .then(setData)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Failed to load data."),
      )
      .finally(() => setLoading(false));
  }

  return { data, error, loading, reload };
}

/**
 * Like useAdminData but for public (unauthenticated) endpoints such as the
 * landing page's featured listings. It always attempts the real server first;
 * the underlying apiFetch only falls back to mock data when the server is
 * unreachable or failing (see lib/api.ts).
 */
export function usePublicData<T>(fetcher: (token: string) => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcherRef.current("")
      .then((result) => {
        if (active) setData(result);
      })
      .catch((err) => {
        if (active)
          setError(err instanceof ApiError ? err.message : "Failed to load data.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading };
}

export function Panel({
  title,
  action,
  children,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-6 shadow-[var(--zcanopy-shadow-sm)]">
      {(title || action) && (
        <div className="mb-5 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-base font-semibold tracking-tight text-[var(--zcanopy-card-brown)]">
              {title}
            </h2>
          ) : (
            <span />
          )}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] p-5 shadow-[var(--zcanopy-shadow-sm)] transition-shadow duration-200 hover:shadow-[var(--zcanopy-shadow-md)]">
      <span
        aria-hidden
        className="absolute inset-y-0 left-0 w-0.5 bg-[var(--zcanopy-accent-gold)]"
      />
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--zcanopy-muted)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-[var(--zcanopy-card-brown)]">
        {value}
      </p>
      {hint ? <p className="mt-1 text-xs text-[var(--zcanopy-muted)]">{hint}</p> : null}
    </div>
  );
}

export function LoadingState({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-16">
      <ZLoadingIndicator size={56} color={COLORS.primary} label={label} />
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-red-200/80 bg-red-50/90 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-950/40 dark:text-red-200">
      {message}
    </div>
  );
}
