"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { de, enUS } from "date-fns/locale";
import { messagesDe, messagesEn, type MessageKey } from "@/lib/i18n/messages";

export type AppLocale = "de" | "en";
export type AppTheme = "light" | "dark";

type TParams = Record<string, string | number>;

type PreferencesContextValue = {
  locale: AppLocale;
  setLocale: (l: AppLocale) => void;
  theme: AppTheme;
  setTheme: (t: AppTheme) => void;
  toggleTheme: () => void;
  t: (key: MessageKey, vars?: TParams) => string;
  dateLocale: typeof de | typeof enUS;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const LOCALE_KEY = "pme_locale";
const THEME_KEY = "pme_theme";

function interpolate(template: string, vars?: TParams) {
  if (!vars) return template;
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>("de");
  const [theme, setThemeState] = useState<AppTheme>("light");
  const skipLocalePulse = useRef(true);
  const skipThemePulse = useRef(true);
  useEffect(() => {
    try {
      const l = window.localStorage.getItem(LOCALE_KEY);
      if (l === "en" || l === "de") setLocaleState(l);
      const th = window.localStorage.getItem(THEME_KEY);
      if (th === "dark" || th === "light") setThemeState(th);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      window.localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = locale === "de" ? "de" : "en";
    try {
      window.localStorage.setItem(LOCALE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  useEffect(() => {
    if (skipLocalePulse.current) {
      skipLocalePulse.current = false;
      return;
    }

    document.body.classList.add("pme-locale-pulse");
    const timer = window.setTimeout(() => {
      document.body.classList.remove("pme-locale-pulse");
    }, 450);

    return () => {
      window.clearTimeout(timer);
      document.body.classList.remove("pme-locale-pulse");
    };
  }, [locale]);

  useEffect(() => {
    if (skipThemePulse.current) {
      skipThemePulse.current = false;
      return;
    }

    document.documentElement.classList.add("pme-theme-pulse");
    const timer = window.setTimeout(() => {
      document.documentElement.classList.remove("pme-theme-pulse");
    }, 600);

    return () => {
      window.clearTimeout(timer);
      document.documentElement.classList.remove("pme-theme-pulse");
    };
  }, [theme]);

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l);
  }, []);

  const setTheme = useCallback((t: AppTheme) => {
    setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  const dict = locale === "de" ? messagesDe : messagesEn;

  const t = useCallback(
    (key: MessageKey, vars?: TParams) => interpolate(dict[key] as string, vars),
    [dict],
  );

  const dateLocale = useMemo(() => (locale === "de" ? de : enUS), [locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      theme,
      setTheme,
      toggleTheme,
      t,
      dateLocale,
    }),
    [locale, setLocale, theme, setTheme, toggleTheme, t, dateLocale],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return ctx;
}
