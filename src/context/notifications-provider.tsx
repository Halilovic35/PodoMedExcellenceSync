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
import { useRealtime } from "@/hooks/use-realtime";
import { usePreferences } from "@/context/preferences-provider";

export type NotificationItem = {
  id: string;
  type: "chat" | "appointments" | "documents";
  title: string;
  createdAt: number;
  href: string;
  read: boolean;
};

type NotificationsContextValue = {
  unreadCount: number;
  items: NotificationItem[];
  markAllRead: () => void;
  markRead: (id: string) => void;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const DING_SRC = "/notification-ding.mp4";
const SOUND_DEBOUNCE_MS = 1800;

function previewChatBody(body: string) {
  const t = body.replace(/\s+/g, " ").trim();
  if (t.length <= 48) return t;
  return `${t.slice(0, 47)}…`;
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { t } = usePreferences();
  const tRef = useRef(t);
  tRef.current = t;

  const meIdRef = useRef<string | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const lastSoundAt = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return;
      const j = (await res.json()) as { user: { id: string } | null };
      const id = j.user?.id ?? null;
      meIdRef.current = id;
    })();
  }, []);

  const playDingIfVisible = useCallback(() => {
    if (typeof document === "undefined" || document.visibilityState !== "visible") return;
    const now = Date.now();
    if (now - lastSoundAt.current < SOUND_DEBOUNCE_MS) return;
    lastSoundAt.current = now;
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio(DING_SRC);
        audioRef.current.preload = "auto";
      }
      audioRef.current.currentTime = 0;
      audioRef.current.volume = 0.55;
      void audioRef.current.play().catch(() => {});
    } catch {
      /* ignore */
    }
  }, []);

  const pushNotif = useCallback((partial: Omit<NotificationItem, "read" | "createdAt">) => {
    setItems((prev) => {
      const next: NotificationItem = {
        ...partial,
        read: false,
        createdAt: Date.now(),
      };
      if (prev.some((p) => p.id === next.id)) return prev;
      return [next, ...prev].slice(0, 40);
    });
  }, []);

  useRealtime({
    onChatMessage: (payload) => {
      const me = meIdRef.current;
      if (!me) return;
      const msg = payload as {
        id?: string;
        body?: string;
        user?: { id: string; name: string };
      };
      if (!msg?.id || !msg.user?.id || msg.user.id === me) return;

      pushNotif({
        id: `chat:${msg.id}`,
        type: "chat",
        title: `${msg.user.name}: ${previewChatBody(String(msg.body ?? ""))}`,
        href: "/chat",
      });
      if (document.visibilityState === "visible") playDingIfVisible();
    },
    onAppointmentsChanged: (p) => {
      const me = meIdRef.current;
      if (!me) return;
      if (p?.actorUserId && p.actorUserId === me) return;
      pushNotif({
        id: `appt:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "appointments",
        title: tRef.current("notif.appointmentTitle"),
        href: "/appointments",
      });
      if (document.visibilityState === "visible") playDingIfVisible();
    },
    onDocumentsChanged: (p) => {
      const me = meIdRef.current;
      if (!me) return;
      if (p?.actorUserId && p.actorUserId === me) return;
      pushNotif({
        id: `doc:${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: "documents",
        title: tRef.current("notif.documentTitle"),
        href: "/documents",
      });
      if (document.visibilityState === "visible") playDingIfVisible();
    },
  });

  const unreadCount = useMemo(() => items.filter((i) => !i.read).length, [items]);

  const markAllRead = useCallback(() => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }, []);

  const markRead = useCallback((id: string) => {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, read: true } : i)));
  }, []);

  const value = useMemo(
    () => ({ unreadCount, items, markAllRead, markRead }),
    [unreadCount, items, markAllRead, markRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("NotificationsProvider missing");
  return ctx;
}
