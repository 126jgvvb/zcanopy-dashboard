"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi, ApiError } from "@/lib/api";
import { COLORS, can, ROLE_LABELS } from "@/lib/theme";

export default function AdminsPage() {
  const { admin } = useAuth();
  const admins = useAdminData((token) => adminApi.admins(token));
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  const canManage = can(admin?.role, "manage_admins");

  async function run(key: string, fn: () => Promise<unknown>) {
    setError(null);
    setActing(key);
    try {
      await fn();
      admins.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setActing(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">
          Administrators ({admins.data?.admins?.length ?? 0})
        </h2>
        {canManage ? (
          <button
            onClick={() => setShowInvite((s) => !s)}
            className="rounded-xl bg-[var(--zcanopy-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {showInvite ? "Close" : "Generate Invite"}
          </button>
        ) : null}
      </div>

      {error ? <ErrorState message={error} /> : null}

      {showInvite && canManage ? (
        <InviteForm
          onGenerated={() => {
            setError(null);
            setShowInvite(false);
          }}
        />
      ) : null}

      <Panel title="All Admins">
        {admins.loading ? (
          <LoadingState label="Loading admins" />
        ) : admins.error ? (
          <ErrorState message={admins.error} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-gray-400">
                <tr>
                  <th className="py-2 pr-4">Username</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(admins.data?.admins ?? []).map((a: any) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="py-2.5 pr-4 font-medium">{a.username}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{a.email}</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs">
                        {ROLE_LABELS[a.role] ?? a.role}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {a.isActive ? "Active" : "Frozen"}
                      </span>
                    </td>
                    <td className="py-2.5">
                      {canManage && a.role !== "super_admin" && a.id !== admin?.id ? (
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={acting === `freeze-${a.id}`}
                            onClick={() =>
                              run(`freeze-${a.id}`, () =>
                                adminApi.freezeAdmin(
                                  admin!.token,
                                  a.id,
                                  !a.isActive,
                                  admin!.id,
                                ),
                              )
                            }
                            className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium hover:bg-gray-200"
                          >
                            {a.isActive ? "Freeze" : "Unfreeze"}
                          </button>
                          <button
                            disabled={acting === `del-${a.id}`}
                            onClick={() =>
                              run(`del-${a.id}`, () =>
                                adminApi.deleteAdmin(admin!.token, a.id, admin!.id),
                              )
                            }
                            className="rounded-lg bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {canManage ? <AddAdminForm onAdded={() => admins.reload()} /> : null}
    </div>
  );
}

function InviteForm({ onGenerated }: { onGenerated: (msg: string) => void }) {
  const { admin } = useAuth();
  const [role, setRole] = useState("admin");
  const [expiry, setExpiry] = useState(24);
  const [code, setCode] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await adminApi.generateInvitationCode(admin!.token, {
        role,
        expiryHours: expiry,
      });
      setCode(res.invitationCode);
      onGenerated("Invitation generated.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Generate Invitation Code">
      <form onSubmit={generate} className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Role
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2"
          >
            <option value="admin">Admin</option>
            <option value="support">Support</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Expiry (hours)
          <input
            type="number"
            min={1}
            value={expiry}
            onChange={(e) => setExpiry(Number(e.target.value))}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl px-4 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: COLORS.primary }}
        >
          {busy ? "Generating…" : "Generate"}
        </button>
      </form>
      {code ? (
        <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          New code: <strong>{code}</strong>
        </p>
      ) : null}
    </Panel>
  );
}

function AddAdminForm({ onAdded }: { onAdded: () => void }) {
  const { admin } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await adminApi.addAdmin(admin!.token, {
        username,
        email,
        password,
        role,
        createdBy: admin!.id,
      });
      onAdded();
      setUsername("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add admin.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel title="Add Admin">
      <form onSubmit={add} className="grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <input
          required
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Temporary password"
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm"
        >
          <option value="admin">Admin</option>
          <option value="support">Support</option>
        </select>
        {error ? (
          <p className="text-sm text-red-600 sm:col-span-2">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={busy}
          className="rounded-xl bg-[var(--zcanopy-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60 sm:col-span-2"
        >
          {busy ? "Adding…" : "Add Admin"}
        </button>
      </form>
    </Panel>
  );
}
