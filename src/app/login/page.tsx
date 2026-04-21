import type { Metadata } from "next";
import { LoginView } from "@/components/login-view";

export const metadata: Metadata = {
  title: "Sign in, PodoMedExcellence Sync",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const nextRaw = searchParams?.next;
  const next = typeof nextRaw === "string" ? nextRaw : "/home";

  return <LoginView nextPath={next.startsWith("/") ? next : "/home"} />;
}
