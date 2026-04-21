"use client";

import { Moon, Sun } from "lucide-react";
import { usePreferences } from "@/context/preferences-provider";

const btnBase =
  "inline-flex h-9 min-w-[2.25rem] transform items-center justify-center rounded-full border text-xs font-semibold transition-transform transition-colors duration-300 ease-out active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export function PreferencesToolbar() {
  const { locale, setLocale, theme, setTheme, t } = usePreferences();

  return (
    <div className="flex flex-wrap items-center justify-end gap-1.5" role="group" aria-label="Display">
      <div className="flex rounded-full border border-brand-soft/80 bg-white/90 p-0.5 shadow-sm transition-transform transition-colors duration-300 ease-out dark:border-zinc-600 dark:bg-zinc-900/90">
        <button
          type="button"
          onClick={() => setLocale("de")}
          className={`${btnBase} border-transparent px-2.5 ${
            locale === "de"
              ? "bg-brand text-white shadow-sm"
              : "text-brand-dark hover:bg-brand-soft/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
          aria-pressed={locale === "de"}
          aria-label={t("prefs.langDe")}
        >
          {t("prefs.langDe")}
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`${btnBase} border-transparent px-2.5 ${
            locale === "en"
              ? "bg-brand text-white shadow-sm"
              : "text-brand-dark hover:bg-brand-soft/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
          aria-pressed={locale === "en"}
          aria-label={t("prefs.langEn")}
        >
          {t("prefs.langEn")}
        </button>
      </div>

      <div className="flex rounded-full border border-brand-soft/80 bg-white/90 p-0.5 shadow-sm transition-transform transition-colors duration-300 ease-out dark:border-zinc-600 dark:bg-zinc-900/90">
        <button
          type="button"
          onClick={() => setTheme("light")}
          className={`${btnBase} border-transparent px-2.5 ${
            theme === "light"
              ? "bg-brand text-white shadow-sm"
              : "text-brand-dark hover:bg-brand-soft/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
          aria-pressed={theme === "light"}
          aria-label={t("prefs.themeLight")}
        >
          <Sun className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setTheme("dark")}
          className={`${btnBase} border-transparent px-2.5 ${
            theme === "dark"
              ? "bg-brand text-white shadow-sm"
              : "text-brand-dark hover:bg-brand-soft/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
          }`}
          aria-pressed={theme === "dark"}
          aria-label={t("prefs.themeDark")}
        >
          <Moon className="h-4 w-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
