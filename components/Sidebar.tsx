"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { COLORS, can, type AdminCapability } from "@/lib/theme";

interface NavItem {
  href: string;
  label: string;
  capability?: AdminCapability;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", capability: "view_dashboard", icon: "▦" },
  { href: "/dashboard/brokers", label: "Brokers", capability: "manage_brokers", icon: "◉" },
  { href: "/dashboard/properties", label: "Properties", capability: "manage_brokers", icon: "⌂" },
  { href: "/dashboard/transactions", label: "Transactions", capability: "manage_finances", icon: "⇄" },
  { href: "/dashboard/commissions", label: "Commissions", capability: "manage_finances", icon: "%" },
  { href: "/dashboard/wallet", label: "Wallet", capability: "manage_finances", icon: "₵" },
  { href: "/dashboard/messages", label: "Messages", capability: "manage_messages", icon: "✉" },
  { href: "/dashboard/admins", label: "Admins", capability: "manage_admins", icon: "★" },
  { href: "/dashboard/sessions", label: "Sessions", capability: "view_sessions", icon: "◷" },
  { href: "/dashboard/logs", label: "System Logs", capability: "view_logs", icon: "≣" },
];

export default function Sidebar({
  admin,
}: {
  admin: { username: string; role: string };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const visible = NAV_ITEMS.filter(
    (item) => !item.capability || can(admin.role, item.capability),
  );

  return (
    <aside className="flex w-64 flex-col border-r border-gray-200/50 bg-[var(--zcanopy-card-brown)] text-white shadow-xl">
      <div className="flex items-center gap-3 px-6 py-6">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl font-bold text-lg shadow-lg"
          style={{ backgroundColor: COLORS.accentGold, color: COLORS.cardBrown }}
        >
          Z
        </span>
        <div>
          <span className="text-lg font-bold tracking-tight">ZCanopy</span>
          <span className="block text-[10px] uppercase tracking-widest text-white/60">Admin Console</span>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {visible.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                active
                  ? "bg-[var(--zcanopy-accent-gold)] font-semibold text-[var(--zcanopy-card-brown)] shadow-md"
                  : "text-white/80 hover:bg-[#D1A054]/20 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
              {item.capability === "manage_messages" && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-green-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-xl bg-white/10 p-3">
          <p className="text-sm font-semibold">{admin.username}</p>
          <p className="text-xs text-white/60 capitalize">{admin.role.replace("_", " ")}</p>
        </div>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/80 transition-colors hover:bg-white/10"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
