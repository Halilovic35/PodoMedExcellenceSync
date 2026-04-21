"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { usePreferences } from "@/context/preferences-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import { useRealtime } from "@/hooks/use-realtime";

type DocumentRow = {
  id: string;
  title: string;
  note: string;
  status: string;
  version: number;
  mime: string;
  size: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy: { name: string };
};

const statuses = ["Uploaded", "In Progress", "Completed", "Ready to Print"] as const;

const statusToKey: Record<(typeof statuses)[number], MessageKey> = {
  Uploaded: "docs.status.uploaded",
  "In Progress": "docs.status.inProgress",
  Completed: "docs.status.completed",
  "Ready to Print": "docs.status.readyToPrint",
};

export function DocumentsPanel() {
  const { t, dateLocale } = usePreferences();
  const [items, setItems] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [pendingUploadNote, setPendingUploadNote] = useState("");
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/documents");
    if (!res.ok) return;
    const data = (await res.json()) as { items: DocumentRow[] };
    setItems(data.items);
    setNoteDrafts((prev) => {
      const next = { ...prev };
      for (const row of data.items) {
        if (next[row.id] === undefined) next[row.id] = row.note;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  useRealtime({
    onDocumentsChanged: () => {
      void load();
    },
  });

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [items],
  );

  async function uploadNew(files: FileList | File[]) {
    const list = Array.from(files);
    const note = pendingUploadNote.trim();
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      if (note) fd.append("note", note);
      await fetch("/api/documents", { method: "POST", body: fd });
    }
    setPendingUploadNote("");
    void load();
  }

  async function patchDoc(id: string, body: { note?: string; status?: string }) {
    await fetch(`/api/documents/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    void load();
  }

  async function replaceFile(id: string, file: File) {
    const fd = new FormData();
    fd.append("file", file);
    await fetch(`/api/documents/${id}/file`, { method: "POST", body: fd });
    void load();
  }

  async function removeDoc(id: string) {
    if (!confirm(t("docs.deleteConfirm"))) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    void load();
  }

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="space-y-2">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{t("docs.title")}</h1>
        <p className="text-ink-muted">{t("docs.subtitle")}</p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files?.length) void uploadNew(e.dataTransfer.files);
        }}
        className={`rounded-[2rem] border-2 border-dashed px-6 py-14 text-center transition ${
          dragOver ? "border-brand bg-brand-soft/50" : "border-brand-soft bg-[var(--surface-muted)]"
        } shadow-card dark:border-zinc-600 dark:bg-zinc-900/60`}
      >
        <UploadCloud className="mx-auto mb-4 h-12 w-12 text-brand" strokeWidth={1.25} />
        <p className="font-medium text-ink">{t("docs.dragHere")}</p>
        <p className="mt-1 text-sm text-ink-muted">{t("docs.dragHint")}</p>
        <div className="mx-auto mt-6 w-full max-w-lg space-y-1 text-left">
          <label className="text-xs font-medium text-ink-muted" htmlFor="docs-upload-caption">
            {t("docs.uploadCaptionLabel")}
          </label>
          <textarea
            id="docs-upload-caption"
            rows={2}
            value={pendingUploadNote}
            onChange={(e) => setPendingUploadNote(e.target.value)}
            placeholder={t("docs.uploadCaptionPlaceholder")}
            className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 dark:border-zinc-600 dark:bg-zinc-950"
          />
          <p className="text-xs text-ink-muted">{t("docs.uploadCaptionHint")}</p>
        </div>
        <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-card transition hover:bg-brand-dark">
          {t("docs.browse")}
          <input
            type="file"
            className="hidden"
            multiple
            onChange={(e) => {
              if (e.target.files?.length) void uploadNew(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-ink">{t("docs.library")}</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-full border border-brand-soft px-3 py-2 text-sm text-brand-dark transition hover:bg-brand-soft/40 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            <RefreshCw className="h-4 w-4" />
            {t("docs.refresh")}
          </button>
        </div>
        {loading ? (
          <p className="text-ink-muted">{t("docs.loading")}</p>
        ) : sorted.length === 0 ? (
          <p className="text-ink-muted">{t("docs.empty")}</p>
        ) : (
          <ul className="space-y-4">
            {sorted.map((doc) => (
              <li
                key={doc.id}
                className="space-y-4 rounded-3xl bg-[var(--surface-muted)] p-6 shadow-card ring-1 ring-brand-soft dark:ring-zinc-700/80"
              >
                <p className="font-display text-xl text-ink break-words">{doc.title}</p>
                <p className="text-sm text-ink">
                  {t("docs.uploadMeta", {
                    name: doc.uploadedBy.name,
                    datetime: format(new Date(doc.createdAt), "d MMM yyyy HH:mm", {
                      locale: dateLocale,
                    }),
                  })}
                </p>
                <p className="text-xs text-ink-muted">
                  {t("docs.techMeta", {
                    version: doc.version,
                    sizeKb: (doc.size / 1024).toFixed(1),
                  })}
                </p>

                <div className="space-y-1">
                  <span className="text-xs font-medium text-ink-muted">{t("docs.notesLabel")}</span>
                  <textarea
                    value={noteDrafts[doc.id] ?? ""}
                    onChange={(e) =>
                      setNoteDrafts((prev) => ({ ...prev, [doc.id]: e.target.value }))
                    }
                    rows={3}
                    className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 dark:border-zinc-600 dark:bg-zinc-950"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void patchDoc(doc.id, { note: noteDrafts[doc.id] ?? "" }).then(() =>
                        setNoteDrafts((p) => ({ ...p, [doc.id]: noteDrafts[doc.id] ?? "" })),
                      )
                    }
                    className="mt-2 rounded-full bg-brand/90 px-4 py-2 text-xs font-semibold text-white hover:bg-brand"
                  >
                    {t("docs.saveNote")}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  <a
                    href={`/api/documents/${doc.id}/file`}
                    className="inline-flex items-center gap-1 rounded-full border border-brand-soft px-3 py-2 text-sm text-brand-dark transition hover:bg-brand-soft/40 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800"
                  >
                    <Download className="h-4 w-4" />
                    {t("docs.download")}
                  </a>
                  <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-brand-soft px-3 py-2 text-sm text-brand-dark transition hover:bg-brand-soft/40 dark:border-zinc-600 dark:text-zinc-100 dark:hover:bg-zinc-800">
                    <UploadCloud className="h-4 w-4" />
                    {t("docs.newVersion")}
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void replaceFile(doc.id, f);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => void removeDoc(doc.id)}
                    className="inline-flex items-center gap-1 rounded-full border border-red-100 px-3 py-2 text-sm text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
                  >
                    <Trash2 className="h-4 w-4" />
                    {t("docs.delete")}
                  </button>
                </div>

                <label className="block max-w-xs space-y-1">
                  <span className="text-xs font-medium text-ink-muted">{t("docs.statusLabel")}</span>
                  <select
                    value={doc.status}
                    onChange={(e) => void patchDoc(doc.id, { status: e.target.value })}
                    className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 dark:border-zinc-600 dark:bg-zinc-950"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {t(statusToKey[s])}
                      </option>
                    ))}
                  </select>
                </label>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
