"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Download, RefreshCw, Trash2, UploadCloud } from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";

type DocumentRow = {
  id: string;
  title: string;
  note: string;
  status: string;
  version: number;
  mime: string;
  size: number;
  updatedAt: string;
  uploadedBy: { name: string };
};

const statuses = ["Uploaded", "In Progress", "Completed", "Ready to Print"] as const;

export function DocumentsPanel() {
  const [items, setItems] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragOver, setDragOver] = useState(false);
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
    for (const file of list) {
      const fd = new FormData();
      fd.append("file", file);
      await fetch("/api/documents", { method: "POST", body: fd });
    }
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
    if (!confirm("Delete this document?")) return;
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    void load();
  }

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Documents</h1>
        <p className="text-ink-muted">
          Upload from the clinic or home. Notes and status updates sync instantly for the team.
        </p>
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
          dragOver ? "border-brand bg-brand-soft/50" : "border-brand-soft bg-white/90"
        } shadow-card`}
      >
        <UploadCloud className="mx-auto h-12 w-12 text-brand mb-4" strokeWidth={1.25} />
        <p className="font-medium text-ink">Drag files here</p>
        <p className="text-sm text-ink-muted mt-1">or choose files from your device</p>
        <label className="mt-6 inline-flex cursor-pointer items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-card hover:bg-brand-dark transition">
          Browse files
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
          <h2 className="text-lg font-semibold text-ink">Library</h2>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-full border border-brand-soft px-3 py-2 text-sm text-brand-dark hover:bg-brand-soft/40"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        {loading ? (
          <p className="text-ink-muted">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-ink-muted">No documents yet. Upload a file to begin.</p>
        ) : (
          <ul className="space-y-4">
            {sorted.map((doc) => (
              <li
                key={doc.id}
                className="rounded-3xl bg-white/95 p-6 shadow-card ring-1 ring-brand-soft space-y-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-1">
                    <p className="font-display text-xl text-ink break-words">{doc.title}</p>
                    <p className="text-xs text-ink-muted">
                      v{doc.version} · {(doc.size / 1024).toFixed(1)} KB ·{" "}
                      {format(new Date(doc.updatedAt), "d MMM yyyy HH:mm")} · {doc.uploadedBy.name}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <a
                      href={`/api/documents/${doc.id}/file`}
                      className="inline-flex items-center gap-1 rounded-full border border-brand-soft px-3 py-2 text-sm text-brand-dark hover:bg-brand-soft/40"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </a>
                    <label className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-brand-soft px-3 py-2 text-sm text-brand-dark hover:bg-brand-soft/40">
                      <UploadCloud className="h-4 w-4" />
                      New version
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
                      className="inline-flex items-center gap-1 rounded-full border border-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="space-y-1 md:col-span-1">
                    <span className="text-xs font-medium text-ink-muted">Status</span>
                    <select
                      value={doc.status}
                      onChange={(e) => void patchDoc(doc.id, { status: e.target.value })}
                      className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
                    >
                      {statuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="space-y-1 md:col-span-2">
                    <span className="text-xs font-medium text-ink-muted">Instructions / notes</span>
                    <textarea
                      value={noteDrafts[doc.id] ?? ""}
                      onChange={(e) =>
                        setNoteDrafts((prev) => ({ ...prev, [doc.id]: e.target.value }))
                      }
                      rows={3}
                      className="w-full rounded-2xl border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
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
                      Save note
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
