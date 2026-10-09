"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useAdminData, Panel, LoadingState, ErrorState } from "@/components/ui";
import { adminApi, ApiError } from "@/lib/api";
import { COLORS, can, ROLE_LABELS } from "@/lib/theme";
import { Search } from "lucide-react";

const STATUSES = ["all", "active", "inactive"] as const;

export default function AdminsPage() {
  const { admin } = useAuth();
  const admins = useAdminData((token) => adminApi.admins(token));
  const [error, setError] = useState<string | null>(null);
  const [acting, setActing] = useState<string | null>(null);
  const [showInvite, setShowInvite] = useState(false);
  const [status, setStatus] = useState<(typeof STATUSES)[number]>("all");
  const [search, setSearch] = useState("");
  const [editingAdmin, setEditingAdmin] = useState<any | null>(null);
  const [editUsername, setEditUsername] = useState("");

  const canManage = can(admin?.role, "manage_admins");

  const filtered = (admins.data?.admins ?? []).filter((a: any) => {
    if (status === "active" && !a.isActive) return false;
    if (status === "inactive" && a.isActive) return false;
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return (
      a.username?.toLowerCase().includes(query) ||
      a.email?.toLowerCase().includes(query)
    );
  });

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition-all sm:px-4 sm:py-1.5 filter-btn ${
                status === s
                  ? "text-white shadow-md"
                  : "bg-white text-gray-600 hover:bg-gray-100"
              }`}
              style={status === s ? { backgroundColor: COLORS.primary } : {}}
            >
              {s === "all" ? "All admins" : s === "active" ? "Active" : "Inactive"}
            </button>
          ))}
        </div>
        {canManage ? (
          <button
            onClick={() => setShowInvite((s) => !s)}
            className="rounded-xl bg-[var(--zcanopy-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md"
          >
            {showInvite ? "Close" : "Generate Invite"}
          </button>
        ) : null}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-[var(--zcanopy-border)] bg-[var(--zcanopy-surface)] px-3 py-2">
        <Search className="h-4 w-4 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by username or email"
          className="w-full bg-transparent text-sm outline-none"
        />
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

      <Panel title={`All Admins (${filtered.length})`}>
        {admins.loading ? (
          <LoadingState label="Loading admins" />
        ) : admins.error ? (
          <ErrorState message={admins.error} />
        ) : filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">No admins found.</p>
        ) : (
          <div className="responsive-table-wrap">
            <table className="w-full text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.12em] text-[var(--zcanopy-muted)]">
                <tr>
                  <th className="py-3 pr-4">Username</th>
                  <th className="py-3 pr-4">Email</th>
                  <th className="py-3 pr-4">Role</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--zcanopy-border)]">
                {filtered.map((a: any) => (
                   <tr key={a.id} className="transition-colors hover:bg-[rgba(209,160,84,0.08)]">
                    <td className="py-2.5 pr-4 font-medium">{a.username}</td>
                    <td className="py-2.5 pr-4 text-gray-500">{a.email}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          a.role === "super_admin"
                            ? "bg-purple-100 text-purple-700"
                            : a.role === "admin"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-200 text-gray-700"
                        }`}
                      >
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
                      {canManage && a.id !== admin?.id ? (
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
                            className="hover-gold rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700"
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
                            className="hover-gold rounded-lg bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700"
                          >
                            Delete
                          </button>
                          <button
                            disabled={acting === `edit-${a.id}`}
                            onClick={() => {
                              setEditingAdmin(a);
                              setEditUsername(a.username || "");
                            }}
                            className="hover-gold rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700"
                          >
                            Edit
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

      {editingAdmin ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-2xl border border-[var(--zcanopy-border)] bg-white p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--zcanopy-card-brown)]">Edit Admin</h3>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-200"
              >
                Close
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingAdmin) return;
                run(`edit-${editingAdmin.id}`, () =>
                  adminApi.updateAdminUsername(admin!.token, editingAdmin.id, editUsername),
                );
                setEditingAdmin(null);
              }}
              className="mt-4 space-y-3"
            >
              <label className="flex flex-col gap-1 text-sm">
                Username
                <input
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="rounded-xl border border-gray-300 bg-white px-3 py-2"
                  required
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <button
                type="submit"
                disabled={acting === `edit-${editingAdmin?.id}`}
                className="rounded-xl bg-[var(--zcanopy-primary)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
              >
                {acting === `edit-${editingAdmin?.id}` ? "Saving…" : "Save"}
              </button>
            </form>
          </div>
        </div>
      ) : null}

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
            <option value="super_admin">Super Admin</option>
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
          <option value="super_admin">Super Admin</option>
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
