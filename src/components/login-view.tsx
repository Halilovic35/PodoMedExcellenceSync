"use client";

import { LoginForm } from "@/components/login-form";
import { PreferencesToolbar } from "@/components/preferences-toolbar";
import { usePreferences } from "@/context/preferences-provider";

export function LoginView({ nextPath }: { nextPath: string }) {
  const { t } = usePreferences();

  return (
    <div className="relative flex min-h-screen min-h-[100dvh] flex-col items-center justify-center px-3 py-10 sm:px-4 sm:py-12">
      <div className="absolute right-3 top-3 z-10 sm:right-6 sm:top-6">
        <PreferencesToolbar />
      </div>
      <div className="w-full max-w-md rounded-[2rem] bg-[var(--surface-muted)] p-6 shadow-lift ring-1 ring-brand-soft backdrop-blur-sm animate-fade-up sm:p-10 dark:ring-zinc-700/80">
        <div className="mb-8 space-y-2 text-center">
          <p className="font-display text-2xl text-brand-dark sm:text-3xl dark:text-brand-light">
            PodoMedExcellence
          </p>
          <p className="text-sm text-ink-muted">{t("login.tagline")}</p>
        </div>
        <LoginForm nextPath={nextPath} />
        <p className="mt-8 text-center text-xs text-ink-muted">{t("login.footer")}</p>
      </div>
    </div>
  );
}
