"use client";

import Link from "next/link";
import { CalendarDays, FileText, Mail, MessageCircle } from "lucide-react";
import { usePreferences } from "@/context/preferences-provider";

const tileDefs = [
  {
    href: "/appointments",
    titleKey: "home.tile.appointments" as const,
    subKey: "home.tile.appointmentsSub" as const,
    icon: CalendarDays,
    accent: "from-brand-soft to-white",
  },
  {
    href: "/documents",
    titleKey: "home.tile.documents" as const,
    subKey: "home.tile.documentsSub" as const,
    icon: FileText,
    accent: "from-white to-brand-soft",
  },
  {
    href: "/chat",
    titleKey: "home.tile.chat" as const,
    subKey: "home.tile.chatSub" as const,
    icon: MessageCircle,
    accent: "from-brand-muted/40 to-white",
  },
  {
    href: "/mail",
    titleKey: "home.tile.mail" as const,
    subKey: "home.tile.mailSub" as const,
    icon: Mail,
    accent: "from-white to-brand-muted/50",
  },
] as const;

export function HomeView() {
  const { t } = usePreferences();

  return (
    <div className="min-w-0 space-y-8 animate-fade-up sm:space-y-10">
      <div className="space-y-2 text-left">
        <h1 className="font-display text-2xl text-ink sm:text-3xl md:text-4xl">{t("home.welcome")}</h1>
        <p className="max-w-xl text-sm text-ink-muted sm:text-base">{t("home.subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4">
        {tileDefs.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className={`group relative min-w-0 overflow-hidden rounded-3xl bg-gradient-to-br ${tile.accent} p-6 shadow-card ring-1 ring-brand-soft/80 transition duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:p-8 dark:ring-zinc-700/80 dark:hover:shadow-lift`}
            >
              <div className="flex flex-col items-center gap-4 text-center sm:gap-5">
                <span className="flex h-20 w-20 items-center justify-center rounded-3xl bg-white/90 text-brand shadow-inner ring-1 ring-brand-soft transition group-hover:scale-105 sm:h-24 sm:w-24 dark:bg-zinc-900/90 dark:ring-zinc-700">
                  <Icon className="h-10 w-10 sm:h-12 sm:w-12" strokeWidth={1.5} aria-hidden />
                </span>
                <div className="min-w-0 px-1">
                  <p className="font-display text-xl text-ink sm:text-2xl">{t(tile.titleKey)}</p>
                  <p className="mt-1 text-xs text-ink-muted sm:text-sm">{t(tile.subKey)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
