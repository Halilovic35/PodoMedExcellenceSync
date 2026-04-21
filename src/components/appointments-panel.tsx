"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { useRealtime } from "@/hooks/use-realtime";

type PlannerAppointment = {
  id: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  cabin: number;
  patientName: string;
  phone: string;
  treatment: string;
  note: string;
  status: "confirmed" | "completed" | "cancelled";
  duration: number;
};

const CABINS = [
  { id: 1, name: "Kabine 1" },
  { id: 2, name: "Kabine 2" },
  { id: 3, name: "Kabine 3" },
] as const;

const STATUS_OPTIONS = [
  { value: "confirmed", label: "Bestätigt" },
  { value: "completed", label: "Abgeschlossen" },
  { value: "cancelled", label: "Abgesagt" },
] as const;

const DURATION_OPTIONS = [30, 60, 90] as const;

function getTimeSlots() {
  const slots: { time: string; isBreak: boolean }[] = [];
  for (let h = 9; h < 13; h++) {
    slots.push({ time: `${String(h).padStart(2, "0")}:00`, isBreak: false });
    slots.push({ time: `${String(h).padStart(2, "0")}:30`, isBreak: false });
  }
  slots.push({ time: "13:00 – 14:00", isBreak: true });
  for (let h = 14; h < 18; h++) {
    slots.push({ time: `${String(h).padStart(2, "0")}:00`, isBreak: false });
    slots.push({ time: `${String(h).padStart(2, "0")}:30`, isBreak: false });
  }
  return slots;
}

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

export function AppointmentsPanel() {
  const [view, setView] = useState<"day" | "month">("day");
  const [date, setDate] = useState<string>(todayStr());
  const [monthYear, setMonthYear] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() + 1 }));

  useRealtime({
    onAppointmentsChanged: () => {
      // reload driven inside child components via a key bump
      setReloadKey((k) => k + 1);
    },
  });

  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const d = new Date(date + "T12:00:00");
    setMonthYear({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }, [date]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-3xl text-ink">Appointments</h1>
          <p className="text-ink-muted">Day planner with cabins — synced instantly for everyone.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("day")}
            className={`rounded-full px-4 py-2 text-sm ring-1 transition ${view === "day" ? "bg-brand text-white ring-brand" : "bg-white/90 text-brand-dark ring-brand-soft hover:bg-brand-soft/40"}`}
          >
            Day
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`rounded-full px-4 py-2 text-sm ring-1 transition ${view === "month" ? "bg-brand text-white ring-brand" : "bg-white/90 text-brand-dark ring-brand-soft hover:bg-brand-soft/40"}`}
          >
            Month
          </button>
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          key={`m-${monthYear.y}-${monthYear.m}-${reloadKey}`}
          year={monthYear.y}
          month={monthYear.m}
          selectedDate={date}
          onSelectDay={(d) => {
            setDate(d);
            setView("day");
          }}
          onMonthChange={(y, m) => setMonthYear({ y, m })}
        />
      ) : (
        <DayView
          key={`d-${date}-${reloadKey}`}
          date={date}
          onDateChange={setDate}
          onSaved={() => setReloadKey((k) => k + 1)}
        />
      )}
    </div>
  );
}

function MonthView({
  year,
  month,
  selectedDate,
  onSelectDay,
  onMonthChange,
}: {
  year: number;
  month: number;
  selectedDate: string;
  onSelectDay: (d: string) => void;
  onMonthChange: (y: number, m: number) => void;
}) {
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/appointments?year=${year}&month=${month}`);
      if (!res.ok) return;
      const data = (await res.json()) as { items: { date: string; count: number }[] };
      const map: Record<string, number> = {};
      for (const r0 of data.items) map[r0.date] = r0.count;
      setCounts(map);
    })();
  }, [year, month]);

  const monthStart = startOfMonth(new Date(year, month - 1));
  const monthEnd = endOfMonth(monthStart);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days: Date[] = [];
  for (let d = calendarStart; d <= calendarEnd; d = addDays(d, 1)) days.push(d);

  const today = todayStr();
  const prevMonth = () => (month === 1 ? onMonthChange(year - 1, 12) : onMonthChange(year, month - 1));
  const nextMonth = () => (month === 12 ? onMonthChange(year + 1, 1) : onMonthChange(year, month + 1));

  const MONTH_NAMES = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  return (
    <div className="rounded-[2rem] bg-white/90 p-5 shadow-card ring-1 ring-brand-soft">
      <div className="flex items-center justify-between">
        <button onClick={prevMonth} className="rounded-full px-3 py-2 text-brand-dark hover:bg-brand-soft/40 ring-1 ring-brand-soft">
          ‹
        </button>
        <h2 className="font-display text-xl text-ink">
          {MONTH_NAMES[month - 1]} {year}
        </h2>
        <button onClick={nextMonth} className="rounded-full px-3 py-2 text-brand-dark hover:bg-brand-soft/40 ring-1 ring-brand-soft">
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {WEEKDAYS.map((d) => (
          <div key={d} className="text-center text-xs font-semibold text-ink-muted">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const count = counts[dateStr] || 0;
          const isCurrentMonth = isSameMonth(d, monthStart);
          const isToday = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              onClick={() => onSelectDay(dateStr)}
              className={[
                "rounded-2xl p-3 text-left ring-1 transition",
                isCurrentMonth ? "bg-white ring-brand-soft hover:bg-brand-soft/35" : "bg-white/60 ring-brand-soft/60 text-ink-muted",
                isToday ? "ring-brand" : "",
                isSelected ? "bg-brand-soft/60 ring-brand" : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{format(d, "d")}</span>
                {count > 0 ? (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark">
                    {count}
                  </span>
                ) : null}
              </div>
              {count > 0 ? (
                <div className="mt-1 text-[11px] text-ink-muted">
                  Termin{count !== 1 ? "e" : ""}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function DayView({
  date,
  onDateChange,
  onSaved,
}: {
  date: string;
  onDateChange: (d: string) => void;
  onSaved: () => void;
}) {
  const [appointments, setAppointments] = useState<PlannerAppointment[]>([]);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlannerAppointment | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [cabin, setCabin] = useState<number>(1);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/appointments?date=${date}`);
      if (!res.ok) return;
      const data = (await res.json()) as { items: PlannerAppointment[] };
      setAppointments(Array.isArray(data.items) ? data.items : []);
    })();
  }, [date]);

  const dateObj = useMemo(() => new Date(date + "T12:00:00"), [date]);
  const isToday = date === todayStr();
  const slots = useMemo(() => getTimeSlots(), []);

  const prevDay = () => onDateChange(format(subDays(dateObj, 1), "yyyy-MM-dd"));
  const nextDay = () => onDateChange(format(addDays(dateObj, 1), "yyyy-MM-dd"));

  const getAppointmentForSlot = (slotTime: string, cabinId: number) => {
    if (slotTime.includes("–")) return null;
    const apt = appointments.find((a) => a.time === slotTime && Number(a.cabin) === cabinId);
    return apt?.patientName ? apt : null;
  };

  const openNew = (slotTime: string, cabinId: number) => {
    setEditing(null);
    setSlot(slotTime);
    setCabin(cabinId);
    setFormOpen(true);
  };

  const openEdit = (apt: PlannerAppointment) => {
    setEditing(apt);
    setSlot(apt.time);
    setCabin(apt.cabin);
    setFormOpen(true);
  };

  const closeForm = async (refetch: boolean) => {
    setFormOpen(false);
    setEditing(null);
    setSlot(null);
    setCabin(1);
    if (refetch) {
      onSaved();
      const res = await fetch(`/api/appointments?date=${date}`);
      if (res.ok) {
        const data = (await res.json()) as { items: PlannerAppointment[] };
        setAppointments(data.items);
      }
    }
  };

  const deleteAppointment = async (id: string) => {
    await fetch(`/api/appointments/${id}`, { method: "DELETE" });
    const res = await fetch(`/api/appointments?date=${date}`);
    if (res.ok) {
      const data = (await res.json()) as { items: PlannerAppointment[] };
      setAppointments(data.items);
    }
  };

  return (
    <div className="space-y-4">
      <div className={`rounded-[2rem] bg-white/90 p-5 shadow-card ring-1 ${isToday ? "ring-brand" : "ring-brand-soft"}`}>
        <div className="flex items-center justify-between gap-2">
          <button onClick={prevDay} className="rounded-full px-3 py-2 text-brand-dark hover:bg-brand-soft/40 ring-1 ring-brand-soft">
            ‹
          </button>
          <div className="text-center">
            <div className="font-display text-xl text-ink">{format(dateObj, "EEEE, d. MMMM yyyy")}</div>
            {isToday ? <div className="text-xs font-semibold text-brand-dark">Heute</div> : null}
          </div>
          <button onClick={nextDay} className="rounded-full px-3 py-2 text-brand-dark hover:bg-brand-soft/40 ring-1 ring-brand-soft">
            ›
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] bg-white/90 p-4 shadow-card ring-1 ring-brand-soft">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[120px_repeat(3,1fr)] gap-2 pb-2">
            <div />
            {CABINS.map((c) => (
              <div key={c.id} className="text-center text-sm font-semibold text-ink">
                {c.name}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {slots.map((s) => (
              <div key={s.time} className={`grid grid-cols-[120px_repeat(3,1fr)] gap-2 ${s.isBreak ? "opacity-90" : ""}`}>
                <div className="flex items-center justify-center rounded-2xl bg-brand-soft/40 py-3 text-sm font-semibold text-ink">
                  {s.time}
                </div>
                {s.isBreak ? (
                  <div className="col-span-3 flex items-center justify-center rounded-2xl bg-brand-soft/30 py-3 text-sm text-ink-muted">
                    Pause
                  </div>
                ) : (
                  CABINS.map((c) => {
                    const apt = getAppointmentForSlot(s.time, c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => openNew(s.time, c.id)}
                        className="rounded-2xl border border-brand-soft bg-white px-3 py-3 text-left hover:bg-brand-soft/20 transition"
                      >
                        {apt ? (
                          <AppointmentCard appointment={apt} onEdit={() => openEdit(apt)} onDelete={() => void deleteAppointment(apt.id)} />
                        ) : (
                          <span className="text-sm text-ink-muted">+ Neuer Termin</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {formOpen && slot ? (
        <AppointmentForm
          date={date}
          time={slot}
          cabin={cabin}
          appointment={editing}
          onClose={() => void closeForm(false)}
          onSave={() => void closeForm(true)}
        />
      ) : null}
    </div>
  );
}

function AppointmentCard({
  appointment,
  onEdit,
  onDelete,
}: {
  appointment: PlannerAppointment;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const statusLabel =
    appointment.status === "completed"
      ? "Abgeschlossen"
      : appointment.status === "cancelled"
        ? "Abgesagt"
        : "Bestätigt";

  return (
    <div onClick={(e) => { e.stopPropagation(); onEdit(); }} className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{appointment.time}</span>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            appointment.status === "completed"
              ? "bg-emerald-50 text-emerald-700"
              : appointment.status === "cancelled"
                ? "bg-red-50 text-red-700"
                : "bg-brand-soft/60 text-brand-dark",
          ].join(" ")}
        >
          {statusLabel}
        </span>
      </div>
      <div className="min-w-0">
        <div className="text-sm font-semibold text-ink break-words">{appointment.patientName}</div>
        {appointment.treatment ? <div className="text-xs text-ink-muted">{appointment.treatment}</div> : null}
        {appointment.phone ? <div className="text-xs text-ink-muted">{appointment.phone}</div> : null}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="rounded-full border border-brand-soft px-3 py-1.5 text-xs text-brand-dark hover:bg-brand-soft/30">
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          className="rounded-full border border-red-100 px-3 py-1.5 text-xs text-red-700 hover:bg-red-50"
        >
          Löschen
        </button>
      </div>

      {confirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-[1.5rem] bg-white p-5 shadow-lift ring-1 ring-brand-soft" onClick={(e) => e.stopPropagation()}>
            <h4 className="font-display text-lg text-ink">Termin löschen?</h4>
            <p className="mt-2 text-sm text-ink-muted">Möchten Sie diesen Termin wirklich dauerhaft löschen?</p>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => setConfirmOpen(false)} className="rounded-full border border-brand-soft px-4 py-2 text-sm text-ink-muted hover:bg-brand-soft/30">
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setConfirmOpen(false);
                  onDelete();
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function AppointmentForm({
  date,
  time,
  cabin,
  appointment,
  onClose,
  onSave,
}: {
  date: string;
  time: string;
  cabin: number;
  appointment: PlannerAppointment | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [patientName, setPatientName] = useState(appointment?.patientName ?? "");
  const [phone, setPhone] = useState(appointment?.phone ?? "");
  const [treatment, setTreatment] = useState(appointment?.treatment ?? "");
  const [note, setNote] = useState(appointment?.note ?? "");
  const [status, setStatus] = useState<PlannerAppointment["status"]>(appointment?.status ?? "confirmed");
  const [duration, setDuration] = useState<number>(appointment?.duration ?? 30);
  const [cabinId, setCabinId] = useState<number>(appointment?.cabin ?? cabin);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!patientName.trim()) return;
    setSaving(true);
    try {
      const body = {
        date,
        time,
        cabin: cabinId,
        patient_name: patientName.trim(),
        phone: phone.trim(),
        treatment: treatment.trim(),
        note: note.trim(),
        status,
        duration,
      };

      if (appointment) {
        await fetch(`/api/appointments/${appointment.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } else {
        await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      }
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/30 p-4 flex items-center justify-center" onClick={onClose}>
      <div className="w-full max-w-lg rounded-[2rem] bg-white p-6 shadow-lift ring-1 ring-brand-soft" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-ink">{appointment ? "Termin bearbeiten" : "Neuer Termin"}</h3>
            <p className="text-sm text-ink-muted mt-1">
              {format(new Date(date + "T12:00:00"), "EEEE, d. MMMM")} · {time} · {CABINS.find((c) => c.id === cabinId)?.name ?? `Kabine ${cabinId}`}
            </p>
          </div>
          <button onClick={onClose} className="rounded-full border border-brand-soft px-3 py-1 text-sm text-ink-muted hover:bg-brand-soft/30">
            ×
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="space-y-1 block">
            <span className="text-xs font-semibold text-ink-muted">Kabine</span>
            <select value={cabinId} onChange={(e) => setCabinId(Number(e.target.value))} className="w-full rounded-2xl border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand">
              {CABINS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-semibold text-ink-muted">Patient *</span>
            <input value={patientName} onChange={(e) => setPatientName(e.target.value)} required className="w-full rounded-2xl border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand" placeholder="Name" />
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-semibold text-ink-muted">Telefonnummer</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-2xl border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand" placeholder="z. B. 069 123456" />
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-semibold text-ink-muted">Behandlung</span>
            <input value={treatment} onChange={(e) => setTreatment(e.target.value)} className="w-full rounded-2xl border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand" placeholder="z. B. Medizinische Fußpflege" />
          </label>

          <label className="space-y-1 block">
            <span className="text-xs font-semibold text-ink-muted">Notiz</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="w-full rounded-2xl border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand" placeholder="Zusätzliche Informationen" />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-ink-muted">Status</span>
              <select value={status} onChange={(e) => setStatus(e.target.value as PlannerAppointment["status"])} className="w-full rounded-2xl border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 block">
              <span className="text-xs font-semibold text-ink-muted">Dauer</span>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} className="w-full rounded-2xl border border-brand-soft px-3 py-2 text-sm outline-none focus:border-brand">
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {d} Min.
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-full border border-brand-soft px-5 py-2 text-sm text-ink-muted hover:bg-brand-soft/30">
              Abbrechen
            </button>
            <button disabled={saving} type="submit" className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
              {saving ? "Speichern…" : "Speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
