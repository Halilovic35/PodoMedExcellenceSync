import type { Metadata } from "next";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = {
  title: "Sign in · PodoMedExcellence Sync",
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const nextRaw = searchParams?.next;
  const next = typeof nextRaw === "string" ? nextRaw : "/home";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-[2rem] bg-white/90 p-10 shadow-lift ring-1 ring-brand-soft backdrop-blur-sm animate-fade-up">
        <div className="mb-8 text-center space-y-2">
          <p className="font-display text-3xl text-brand-dark">PodoMedExcellence</p>
          <p className="text-sm text-ink-muted">Sync · internal access</p>
        </div>
        <LoginForm nextPath={next.startsWith("/") ? next : "/home"} />
        <p className="mt-8 text-center text-xs text-ink-muted">
          Authorized clinic and family accounts only.
        </p>
      </div>
    </div>
  );
}
