import { use } from "react";
import LoginForm from "@/components/LoginForm";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = use(searchParams);
  const redirect = typeof resolved.redirect === "string" ? resolved.redirect : undefined;

  return <LoginForm redirect={redirect} />;
}
