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
    <div className="space-y-10 animate-fade-up">
      <div className="space-y-2 text-left">
        <h1 className="font-display text-3xl text-ink sm:text-4xl">{t("home.welcome")}</h1>
        <p className="max-w-xl text-ink-muted">{t("home.subtitle")}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {tileDefs.map((tile) => {
          const Icon = tile.icon;
          return (
            <Link
              key={tile.href}
              href={tile.href}
              className={`group relative overflow-hidden rounded-3xl bg-gradient-to-br ${tile.accent} p-8 shadow-card ring-1 ring-brand-soft/80 transition duration-300 hover:-translate-y-1 hover:shadow-lift focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:ring-zinc-700/80 dark:hover:shadow-lift`}
            >
              <div className="flex flex-col items-center gap-5 text-center">
                <span className="flex h-24 w-24 items-center justify-center rounded-3xl bg-white/90 text-brand shadow-inner ring-1 ring-brand-soft transition group-hover:scale-105 dark:bg-zinc-900/90 dark:ring-zinc-700">
                  <Icon className="h-12 w-12" strokeWidth={1.5} aria-hidden />
                </span>
                <div>
                  <p className="font-display text-2xl text-ink">{t(tile.titleKey)}</p>
                  <p className="mt-1 text-sm text-ink-muted">{t(tile.subKey)}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
