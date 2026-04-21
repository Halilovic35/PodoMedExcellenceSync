"use client";

import { useState } from "react";
import { usePreferences } from "@/context/preferences-provider";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const { t } = usePreferences();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        setError(data?.error ?? t("login.errorGeneric"));
        return;
      }
      window.location.href = nextPath;
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink" htmlFor="email">
          {t("login.email")}
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full rounded-2xl border border-brand-soft bg-white px-4 py-3 text-ink shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-600 dark:bg-zinc-950"
          required
        />
      </div>
      <div className="space-y-2">
        <label className="block text-sm font-medium text-ink" htmlFor="password">
          {t("login.password")}
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-2xl border border-brand-soft bg-white px-4 py-3 text-ink shadow-sm outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-zinc-600 dark:bg-zinc-950"
          required
        />
      </div>
      {error ? (
        <p className="text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-brand px-4 py-3 text-center text-sm font-semibold text-white shadow-card transition hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? t("login.submitting") : t("login.submit")}
      </button>
    </form>
  );
}
