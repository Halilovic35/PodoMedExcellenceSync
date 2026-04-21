"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { usePreferences } from "@/context/preferences-provider";
import { useRealtime } from "@/hooks/use-realtime";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
};

export function ChatPanel() {
  const { t, dateLocale } = usePreferences();
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [me, setMe] = useState<{ id: string; name: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/chat");
    if (!res.ok) return;
    const data = (await res.json()) as { items: ChatMessage[] };
    setItems(data.items);
  }, []);

  useEffect(() => {
    void (async () => {
      const meRes = await fetch("/api/auth/me");
      if (meRes.ok) {
        const j = (await meRes.json()) as { user: { id: string; name: string } | null };
        if (j.user) setMe({ id: j.user.id, name: j.user.name });
      }
    })();
    void load();
  }, [load]);

  useRealtime({
    onChatMessage: (payload) => {
      const msg = payload as ChatMessage;
      if (!msg?.id) return;
      setItems((prev) => {
        if (prev.some((p) => p.id === msg.id)) return prev;
        return [...prev, msg];
      });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items]);

  const sendMessage = useCallback(async () => {
    const text = body.trim();
    if (!text) return;
    setBody("");
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text }),
    });
    if (res.ok) {
      const data = (await res.json()) as { item: ChatMessage };
      setItems((prev) => (prev.some((p) => p.id === data.item.id) ? prev : [...prev, data.item]));
    }
  }, [body]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void sendMessage();
  }

  function onComposerKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 pb-[env(safe-area-inset-bottom,0px)] animate-fade-up sm:gap-6">
      <div className="shrink-0 space-y-2">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{t("chat.title")}</h1>
        <p className="text-sm text-ink-muted sm:text-base">{t("chat.subtitle")}</p>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain rounded-[2rem] bg-[var(--surface-muted)] p-3 shadow-card ring-1 ring-brand-soft sm:p-6 dark:ring-zinc-700/80">
        {items.length === 0 ? (
          <p className="py-16 text-center text-sm text-ink-muted">{t("chat.empty")}</p>
        ) : (
          items.map((m) => {
            const mine = me && m.user.id === me.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[min(85%,22rem)] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                    mine
                      ? "rounded-br-md bg-brand text-white"
                      : "rounded-bl-md bg-brand-soft/60 text-ink dark:bg-zinc-800 dark:text-zinc-100"
                  }`}
                >
                  <p
                    className={`mb-1 text-xs font-semibold ${
                      mine ? "text-white/90" : "text-brand-dark dark:text-brand-light"
                    }`}
                  >
                    {m.user.name}
                  </p>
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-2 text-[11px] ${mine ? "text-white/80" : "text-ink-muted"}`}>
                    {format(new Date(m.createdAt), "d MMM yyyy, HH:mm", { locale: dateLocale })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={onSubmit}
        className="flex shrink-0 flex-col gap-2 rounded-[2rem] bg-[var(--surface-muted)] p-3 shadow-card ring-1 ring-brand-soft sm:flex-row sm:items-end sm:gap-3 dark:ring-zinc-700/80"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={onComposerKeyDown}
          rows={2}
          placeholder={t("chat.placeholder")}
          className="min-h-[2.75rem] w-full flex-1 resize-none rounded-2xl border border-transparent bg-transparent px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-muted focus:ring-0 sm:min-h-0"
        />
        <button
          type="submit"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center self-end rounded-2xl bg-brand text-white shadow transition hover:bg-brand-dark sm:self-auto"
          aria-label={t("chat.sendAria")}
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
