"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CalendarDays, FileText, MessageCircle } from "lucide-react";
import { useNotifications, type NotificationItem } from "@/context/notifications-provider";
import { usePreferences } from "@/context/preferences-provider";

function iconForType(type: NotificationItem["type"]) {
  if (type === "chat") return MessageCircle;
  if (type === "appointments") return CalendarDays;
  return FileText;
}

export function NotificationsBell() {
  const { t } = usePreferences();
  const { unreadCount, items, markAllRead, markRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-brand-soft/80 bg-white/90 text-brand-dark shadow-sm transition hover:bg-brand-soft/40 dark:border-zinc-600 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="true"
        aria-label={t("notif.bellAria")}
      >
        <Bell className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white dark:ring-zinc-900">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          className="absolute right-0 z-40 mt-2 w-[min(calc(100vw-1.5rem),20rem)] rounded-2xl border border-brand-soft/80 bg-[var(--surface-muted)] py-2 shadow-lift ring-1 ring-black/5 dark:border-zinc-600 dark:bg-zinc-950 dark:ring-white/10"
          role="menu"
        >
          <div className="flex items-center justify-between gap-2 border-b border-brand-soft/50 px-3 pb-2 dark:border-zinc-700/80">
            <p className="text-xs font-semibold text-ink-muted">{t("notif.panelTitle")}</p>
            {unreadCount > 0 ? (
              <button
                type="button"
                onClick={() => markAllRead()}
                className="text-xs font-medium text-brand-dark hover:underline dark:text-brand-light"
              >
                {t("notif.markAllRead")}
              </button>
            ) : null}
          </div>
          <ul className="max-h-[min(70vh,22rem)] overflow-y-auto overscroll-contain py-1">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-ink-muted">{t("notif.empty")}</li>
            ) : (
              items.map((n) => {
                const Icon = iconForType(n.type);
                return (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => {
                        markRead(n.id);
                        setOpen(false);
                      }}
                      className={`flex gap-2 px-3 py-2.5 text-left text-sm transition hover:bg-brand-soft/35 dark:hover:bg-zinc-800/80 ${
                        n.read ? "opacity-70" : "font-medium text-ink"
                      }`}
                      role="menuitem"
                    >
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
                      <span className="min-w-0 flex-1 break-words leading-snug">{n.title}</span>
                    </Link>
                  </li>
                );
              })
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
