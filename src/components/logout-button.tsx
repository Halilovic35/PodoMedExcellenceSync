"use client";

import { LogOut } from "lucide-react";
import { usePreferences } from "@/context/preferences-provider";

export function LogoutButton() {
  const { t } = usePreferences();
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
      className="inline-flex items-center gap-2 rounded-full border border-brand-soft bg-white px-4 py-2 text-sm font-medium text-brand-dark shadow-sm transition hover:border-brand-light hover:shadow-card dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      {t("nav.signOut")}
    </button>
  );
}
