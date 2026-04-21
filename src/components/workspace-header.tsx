"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/context/preferences-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import { LogoutButton } from "./logout-button";
import { NotificationsBell } from "./notifications-bell";
import { PreferencesToolbar } from "./preferences-toolbar";

function sectionMessageKey(pathname: string): MessageKey | null {
  if (pathname === "/appointments" || pathname.startsWith("/appointments/")) return "section.appointments";
  if (pathname === "/documents" || pathname.startsWith("/documents/")) return "section.documents";
  if (pathname === "/chat" || pathname.startsWith("/chat/")) return "section.chat";
  if (pathname === "/mail" || pathname.startsWith("/mail/")) return "section.mail";
  return null;
}

const backButtonClass =
  "inline-flex shrink-0 items-center justify-center rounded-full border border-brand-soft bg-white px-2.5 py-2 text-sm font-medium text-brand-dark shadow-sm transition hover:border-brand-light hover:shadow-card dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:border-zinc-500 sm:px-3";

export function WorkspaceHeader() {
  const pathname = usePathname();
  const { t } = usePreferences();
  const onHome = pathname === "/home" || pathname.startsWith("/home/");
  const sectionKey = sectionMessageKey(pathname);

  if (onHome) {
    return (
      <div className="mx-auto max-w-6xl px-3 py-3 sm:px-6">
        <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
          <Link href="/home" className="flex min-w-0 items-center gap-2 sm:gap-3">
            <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full transition-transform duration-300 ease-out hover:scale-[1.03] sm:h-11 sm:w-11">
              <Image
                src="/LOGO.png"
                alt="PodoMed Excellence"
                fill
                className="object-cover"
                sizes="44px"
                priority
              />
            </span>
            <div className="min-w-0 text-left">
              <p className="font-display text-base leading-tight text-brand-dark tracking-tight sm:text-lg dark:text-brand-light">
                PodoMedExcellence
              </p>
              <p className="text-xs text-ink-muted">Sync</p>
            </div>
          </Link>
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <NotificationsBell />
            <PreferencesToolbar />
            <LogoutButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-3 py-3 sm:px-6">
      <div className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-3">
        <div className="flex min-w-0 justify-start justify-self-start">
          <Link href="/home" className={backButtonClass} aria-label={t("nav.back")}>
            <span aria-hidden className="sm:hidden">
              ←
            </span>
            <span className="hidden sm:inline">← {t("nav.back")}</span>
          </Link>
        </div>

        <div className="col-start-2 flex min-w-0 justify-center justify-self-center px-0.5 text-center sm:max-w-md">
          <div className="min-w-0">
            <p className="font-display text-base leading-tight text-brand-dark sm:text-lg md:text-xl dark:text-brand-light">
              {sectionKey ? t(sectionKey) : ""}
            </p>
            <p className="mt-0.5 hidden text-xs text-ink-muted sm:block sm:text-sm">PodoMedExcellence Sync</p>
          </div>
        </div>

        <div className="col-start-3 flex min-w-0 justify-end justify-self-end">
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <NotificationsBell />
            <PreferencesToolbar />
            <LogoutButton />
          </div>
        </div>
      </div>
    </div>
  );
}
