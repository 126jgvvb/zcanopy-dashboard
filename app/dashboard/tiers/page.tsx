"use client";

import { useEffect, useState } from "react";
import { useAdminData, Panel, StatCard, LoadingState, ErrorState } from "@/components/ui";
import { adminApi } from "@/lib/api";
import { COLORS } from "@/lib/theme";
import { useAuth } from "@/components/AuthProvider";

interface TierPrice {
  tier: string;
  price: number;
}

export default function TiersPage() {
  const { admin } = useAuth();
  const tiersQuery = useAdminData((token) => adminApi.tiers(token));
  const [tiers, setTiers] = useState<TierPrice[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (tiersQuery.data) {
      setTiers(tiersQuery.data);
    }
  }, [tiersQuery.data]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      await Promise.all(
        tiers.map((tier) =>
          adminApi.updateTierPrice(admin!.token, tier.tier, tier.price).catch((err) => {
            throw err;
          }),
        ),
      );
      setMessage("Tier prices updated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update tier prices.");
    } finally {
      setSaving(false);
    }
  };

  const updateTier = (tier: string, price: number) => {
    setTiers((prev) => prev.map((item) => (item.tier === tier ? { ...item, price } : item)));
  };

  if (tiersQuery.loading) return <LoadingState label="Loading tiers" />;
  if (tiersQuery.error) return <ErrorState message={tiersQuery.error} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--zcanopy-card-brown)]">Subscription Tiers</h1>
          <p className="mt-1 text-sm text-gray-500">Adjust broker subscription tier prices. Changes apply immediately.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white shadow-md transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          style={{ backgroundColor: COLORS.primary }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {message && (
        <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {tiers.map((tier) => (
          <Panel key={tier.tier} title={`${tier.tier.charAt(0).toUpperCase() + tier.tier.slice(1)} Tier`}>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Tier Name</label>
                <input
                  type="text"
                  value={tier.tier}
                  disabled
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-500"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Price (UGX)</label>
                <input
                  type="number"
                  value={tier.price}
                  onChange={(e) => updateTier(tier.tier, Number(e.target.value))}
                  className="w-full rounded-xl border border-[var(--zcanopy-border)] bg-white px-4 py-2.5 text-sm outline-none transition focus:border-[var(--zcanopy-primary)] focus:ring-2 focus:ring-[var(--zcanopy-primary)]/30"
                />
              </div>
              <StatCard label="Current Price" value={`UGX ${Number(tier.price || 0).toLocaleString("en-UG")}`} />
            </div>
          </Panel>
        ))}
      </div>
    </div>
  );
}
