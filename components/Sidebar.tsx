"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import {
  LayoutGrid,
  Briefcase,
  Home,
  ArrowLeftRight,
  Percent,
  Wallet,
  FileText,
  Mail,
  UserCog,
  Gauge,
  PanelBottomOpen,
  Search,
} from "lucide-react";
import { COLORS, can, type AdminCapability } from "@/lib/theme";

interface NavItem {
  href: string;
  label: string;
  capability?: AdminCapability;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Overview", capability: "view_dashboard", icon: <LayoutGrid className="h-4 w-4" /> },
  { href: "/dashboard/brokers", label: "Brokers", capability: "manage_brokers", icon: <Briefcase className="h-4 w-4" /> },
  { href: "/dashboard/properties", label: "Properties", capability: "manage_brokers", icon: <Home className="h-4 w-4" /> },
  { href: "/dashboard/transactions", label: "Transactions", capability: "manage_finances", icon: <ArrowLeftRight className="h-4 w-4" /> },
  { href: "/dashboard/commissions", label: "Commissions", capability: "manage_finances", icon: <Percent className="h-4 w-4" /> },
  { href: "/dashboard/wallet", label: "Wallet", capability: "manage_finances", icon: <Wallet className="h-4 w-4" /> },
  { href: "/dashboard/invoices", label: "Invoices", capability: "manage_finances", icon: <FileText className="h-4 w-4" /> },
  { href: "/dashboard/messages", label: "Messages", capability: "manage_messages", icon: <Mail className="h-4 w-4" /> },
  { href: "/dashboard/admins", label: "Admins", capability: "manage_admins", icon: <UserCog className="h-4 w-4" /> },
  { href: "/dashboard/sessions", label: "Sessions", capability: "view_sessions", icon: <Gauge className="h-4 w-4" /> },
  { href: "/dashboard/logs", label: "System Logs", capability: "view_logs", icon: <PanelBottomOpen className="h-4 w-4" /> },
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
    <aside className="flex w-64 flex-col border-r border-black/10 bg-[var(--zcanopy-card-brown)] text-white shadow-[var(--zcanopy-shadow-md)]">
      <div className="flex items-center gap-3 px-6 py-7">
        <span
          className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold shadow-lg ring-1 ring-white/20"
          style={{ backgroundColor: COLORS.accentGold, color: COLORS.cardBrown }}
        >
          Z
        </span>
        <div>
          <span className="text-lg font-semibold tracking-tight">ZCanopy</span>
          <span className="block text-[10px] uppercase tracking-[0.18em] text-white/55">Admin Console</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-1">
        {visible.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`hover-gold flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-all ${
                active
                  ? "bg-[var(--zcanopy-accent-gold)] font-semibold text-[var(--zcanopy-card-brown)] shadow-md"
                  : "text-white/78 hover:text-[#4a2f1c]"
              }`}
            >
              {item.icon}
              {item.label}
              {item.capability === "manage_messages" && (
                <span className="ml-auto flex h-2 w-2 rounded-full bg-green-400" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 p-3">
        <div className="mb-2 rounded-xl bg-white/[0.08] p-3 ring-1 ring-white/10">
          <p className="text-sm font-semibold tracking-tight">{admin.username}</p>
          <p className="text-xs capitalize text-white/55">{admin.role.replace("_", " ")}</p>
        </div>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="hover-gold w-full rounded-xl px-3 py-2.5 text-left text-sm text-white/78"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
