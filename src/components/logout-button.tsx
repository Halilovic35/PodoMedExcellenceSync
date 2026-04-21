"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
      className="inline-flex items-center gap-2 rounded-full border border-brand-soft bg-white px-4 py-2 text-sm font-medium text-brand-dark shadow-sm transition hover:border-brand-light hover:shadow-card"
    >
      <LogOut className="h-4 w-4" aria-hidden />
      Sign out
    </button>
  );
}
