"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Send } from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";

type ChatMessage = {
  id: string;
  body: string;
  createdAt: string;
  user: { id: string; name: string };
};

export function ChatPanel() {
  const [items, setItems] = useState<ChatMessage[]>([]);
  const [body, setBody] = useState("");
  const [meId, setMeId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/chat");
    if (!res.ok) return;
    const data = (await res.json()) as { items: ChatMessage[] };
    setItems(data.items);
  }, []);

  useEffect(() => {
    void (async () => {
      const me = await fetch("/api/auth/me");
      if (me.ok) {
        const j = (await me.json()) as { user: { id: string } | null };
        if (j.user) setMeId(j.user.id);
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

  async function send(e: React.FormEvent) {
    e.preventDefault();
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
  }

  return (
    <div className="flex flex-col gap-6 h-[calc(100vh-8rem)] min-h-[420px] animate-fade-up">
      <div className="space-y-2 shrink-0">
        <h1 className="font-display text-3xl text-ink">Chat</h1>
        <p className="text-ink-muted">Internal messages — no refresh needed.</p>
      </div>

      <div className="flex-1 overflow-y-auto rounded-[2rem] bg-white/95 p-4 sm:p-6 shadow-card ring-1 ring-brand-soft space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-ink-muted text-center py-16">No messages yet. Say hello.</p>
        ) : (
          items.map((m) => {
            const mine = meId && m.user.id === meId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-3xl px-4 py-3 text-sm shadow-sm ${
                    mine
                      ? "bg-brand text-white rounded-br-md"
                      : "bg-brand-soft/60 text-ink rounded-bl-md"
                  }`}
                >
                  {!mine ? (
                    <p className="text-xs font-semibold text-brand-dark mb-1">{m.user.name}</p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p
                    className={`mt-2 text-[11px] ${
                      mine ? "text-white/80" : "text-ink-muted"
                    }`}
                  >
                    {format(new Date(m.createdAt), "d MMM yyyy · HH:mm")}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={send}
        className="shrink-0 flex gap-3 items-end rounded-[2rem] bg-white/95 p-3 shadow-card ring-1 ring-brand-soft"
      >
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Type a message…"
          className="flex-1 resize-none rounded-2xl border border-transparent bg-transparent px-3 py-2 text-sm outline-none focus:ring-0"
        />
        <button
          type="submit"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand text-white shadow hover:bg-brand-dark transition"
          aria-label="Send"
        >
          <Send className="h-5 w-5" />
        </button>
      </form>
    </div>
  );
}
