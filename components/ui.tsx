"use client";

import { useState, useEffect, useRef, type ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";
import { ApiError } from "@/lib/api";
import { getCache, setCache, invalidateCache } from "@/lib/cache";
import ZLoadingIndicator from "@/components/ZLoadingIndicator";
import { COLORS } from "@/lib/theme";

type Fetcher<T> = (token: string) => Promise<T>;

/**
 * Client-side caching hook with stale-while-revalidate semantics.
 *
 * On first mount it shows a loading state, then serves cached data
 * instantly on subsequent mounts while a background fetch refreshes it.
 * A 30-second stale window means data older than 30s is silently
 * revalidated; data newer than that is served from cache without a
 * network request unless the caller explicitly reloads.
 */
export function useAdminData<T>(
  fetcher: Fetcher<T>,
  deps: unknown[] = [],
  options: { maxAge?: number; cacheKey?: string } = {},
) {
  const { admin, refreshToken, loading: authLoading } = useAuth();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  const maxAge = options.maxAge ?? 30_000;
  const key = options.cacheKey ?? "admin-data";

  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  useEffect(() => {
    if (authLoading) {
      setLoading(true);
      return;
    }
    if (!admin) {
      setLoading(false);
      setError("Unauthorized");
      return;
    }
    let active = true;
    setError(null);

    // Serve cached data instantly if available (stale-while-revalidate).
    const cached = getCache<T>(key, maxAge);
    if (cached) {
      setData(cached.value);
      if (!loading) setLoading(false);
    } else {
      setLoading(true);
    }

    // Always attempt a background revalidation.
    fetcherRef.current(admin.token)
      .then((result) => {
        if (!active) return;
        setCache(key, result);
        setData(result);
      })
      .catch(async (err) => {
        if (!active) return;
        // If we already have cached data, don't surface the error — the
        // stale value is still usable and the user can reload manually.
        if (getCache<T>(key)) return;
        if (err instanceof ApiError && err.status === 401) {
          try {
            await refreshToken();
          } catch (refreshErr) {
            if (active) {
              setError(
                refreshErr instanceof ApiError
                  ? refreshErr.message
                  : "Session expired. Please log in again.",
              );
            }
          }
        } else {
          if (active) setError(err instanceof ApiError ? err.message : "Failed to load data.");
        }
      })
      .finally(() => {
        if (active && !getCache<T>(key)) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin, authLoading, refreshToken, key, ...deps]);

  function reload() {
    if (!admin) return;
    setLoading(true);
    setError(null);
    fetcherRef.current(admin.token)
      .then((result) => {
        setCache(key, result);
        setData(result);
      })
      .catch(async (err) => {
        if (err instanceof ApiError && err.status === 401) {
          try {
            await refreshToken();
          } catch (refreshErr) {
            setError(
              refreshErr instanceof ApiError
                ? refreshErr.message
                : "Session expired. Please log in again.",
            );
          }
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load data.");
        }
      })
      .finally(() => setLoading(false));
  }

  return { data, error, loading, reload };
}

/**
 * Force-invalidate cached data for a key (e.g. after a mutation).
 * Pass `undefined` to clear the entire cache (useful on logout).
 */
export function useCacheInvalidation() {
  return invalidateCache;
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
