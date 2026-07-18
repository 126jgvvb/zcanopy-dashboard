export const COLORS = {
  primary: "#A9710E",
  primaryAlt: "#A9610E",
  cardBrown: "#5D4037",
  accentGold: "#D1A054",
  background: "#F5F5F5",
  surface: "#FFFFFF",
  surfaceDark: "#1E1E1E",
  scaffoldDark: "#121212",
} as const;

export type AdminRole = "super_admin" | "admin" | "support";

export const ROLE_LABELS: Record<AdminRole | string, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  support: "Support",
};

export function can(role: string | undefined, action: AdminCapability): boolean {
  if (!role) return false;
  if (role === "super_admin") return true;
  if (role === "admin") {
    return ADMIN_ALLOWED.has(action);
  }
  if (role === "support") {
    return SUPPORT_ALLOWED.has(action);
  }
  return false;
}

export type AdminCapability =
  | "view_dashboard"
  | "manage_brokers"
  | "manage_admins"
  | "manage_finances"
  | "manage_messages"
  | "view_logs"
  | "view_sessions";

const ADMIN_ALLOWED = new Set<AdminCapability>([
  "view_dashboard",
  "manage_brokers",
  "manage_finances",
  "manage_messages",
  "view_logs",
  "view_sessions",
]);

const SUPPORT_ALLOWED = new Set<AdminCapability>([
  "view_dashboard",
  "manage_messages",
  "view_logs",
]);
