"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRealtime } from "@/hooks/use-realtime";

type Appointment = {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  notes: string;
  user: { name: string };
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AppointmentsPanel() {
  const [items, setItems] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/appointments");
    if (!res.ok) return;
    const data = (await res.json()) as { items: Appointment[] };
    setItems(data.items);
  }, []);

  useEffect(() => {
    void load().finally(() => setLoading(false));
  }, [load]);

  useRealtime({
    onAppointmentsChanged: () => {
      void load();
    },
  });

  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [items],
  );

  async function createAppointment(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !start || !end) return;
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: title.trim(),
        startAt: new Date(start).toISOString(),
        endAt: new Date(end).toISOString(),
        notes,
      }),
    });
    if (!res.ok) return;
    setTitle("");
    setStart("");
    setEnd("");
    setNotes("");
    void load();
  }

  async function patchAppointment(id: string, patch: Partial<Appointment>) {
    const body: Record<string, string> = {};
    if (patch.title !== undefined) body.title = patch.title;
    if (patch.notes !== undefined) body.notes = patch.notes;
    if (patch.startAt !== undefined) body.startAt = new Date(patch.startAt).toISOString();
    if (patch.endAt !== undefined) body.endAt = new Date(patch.endAt).toISOString();
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setEditingId(null);
    void load();
  }

  async function deleteAppointment(id: string) {
    if (!confirm("Delete this appointment?")) return;
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    void load();
  }

  return (
    <div className="space-y-10 animate-fade-up">
      <div className="space-y-2">
        <h1 className="font-display text-3xl text-ink">Appointments</h1>
        <p className="text-ink-muted">Shared schedule — changes appear for everyone right away.</p>
      </div>

      <form
        onSubmit={createAppointment}
        className="rounded-3xl bg-white/95 p-6 shadow-card ring-1 ring-brand-soft space-y-4"
      >
        <div className="flex items-center gap-2 text-brand-dark font-medium">
          <Plus className="h-5 w-5" />
          New appointment
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-ink-muted">Title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-2xl border border-brand-soft px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
              placeholder="e.g. Follow-up visit"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-ink-muted">Start</span>
            <input
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-2xl border border-brand-soft px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-ink-muted">End</span>
            <input
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-2xl border border-brand-soft px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>
          <label className="space-y-1 md:col-span-2">
            <span className="text-sm text-ink-muted">Notes (optional)</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-2xl border border-brand-soft px-4 py-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
            />
          </label>
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-card hover:bg-brand-dark transition"
        >
          Save appointment
        </button>
      </form>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-ink">Upcoming</h2>
        {loading ? (
          <p className="text-ink-muted">Loading…</p>
        ) : sorted.length === 0 ? (
          <p className="text-ink-muted">No appointments yet.</p>
        ) : (
          <ul className="space-y-3">
            {sorted.map((a) => (
              <li
                key={a.id}
                className="rounded-3xl bg-white/95 p-5 shadow-card ring-1 ring-brand-soft flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
              >
                {editingId === a.id ? (
                  <EditBlock
                    appointment={a}
                    onCancel={() => setEditingId(null)}
                    onSave={(patch) => void patchAppointment(a.id, patch)}
                  />
                ) : (
                  <>
                    <div className="space-y-1 min-w-0">
                      <p className="font-display text-xl text-ink">{a.title}</p>
                      <p className="text-sm text-brand-dark font-medium">
                        {format(new Date(a.startAt), "EEE d MMM yyyy · HH:mm")} –{" "}
                        {format(new Date(a.endAt), "HH:mm")}
                      </p>
                      <p className="text-xs text-ink-muted">By {a.user.name}</p>
                      {a.notes ? <p className="text-sm text-ink-muted pt-2">{a.notes}</p> : null}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingId(a.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-brand-soft px-3 py-2 text-sm text-brand-dark hover:bg-brand-soft/40"
                      >
                        <Pencil className="h-4 w-4" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void deleteAppointment(a.id)}
                        className="inline-flex items-center gap-1 rounded-full border border-red-100 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function EditBlock({
  appointment,
  onCancel,
  onSave,
}: {
  appointment: Appointment;
  onCancel: () => void;
  onSave: (patch: Partial<Appointment>) => void;
}) {
  const [title, setTitle] = useState(appointment.title);
  const [start, setStart] = useState(toLocalInput(appointment.startAt));
  const [end, setEnd] = useState(toLocalInput(appointment.endAt));
  const [notes, setNotes] = useState(appointment.notes);

  return (
    <div className="w-full space-y-3">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm text-ink-muted">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-2xl border border-brand-soft px-3 py-2 outline-none focus:border-brand"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-ink-muted">Start</span>
          <input
            type="datetime-local"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="w-full rounded-2xl border border-brand-soft px-3 py-2 outline-none focus:border-brand"
          />
        </label>
        <label className="space-y-1">
          <span className="text-sm text-ink-muted">End</span>
          <input
            type="datetime-local"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="w-full rounded-2xl border border-brand-soft px-3 py-2 outline-none focus:border-brand"
          />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm text-ink-muted">Notes</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-2xl border border-brand-soft px-3 py-2 outline-none focus:border-brand"
          />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onSave({
              title,
              startAt: new Date(start).toISOString(),
              endAt: new Date(end).toISOString(),
              notes,
            })
          }
          className="rounded-full bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Save
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-brand-soft px-4 py-2 text-sm text-ink-muted hover:bg-brand-soft/30"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
