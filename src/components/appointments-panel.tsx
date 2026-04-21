"use client";

import { useEffect, useMemo, useState } from "react";
import { format, addDays, subDays, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
import { usePreferences } from "@/context/preferences-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import { useRealtime } from "@/hooks/use-realtime";

type PlannerAppointment = {
  id: string;
  date: string;
  time: string;
  cabin: number;
  patientName: string;
  phone: string;
  treatment: string;
  note: string;
  status: "confirmed" | "completed" | "cancelled";
  duration: number;
};

const CABIN_IDS = [1, 2, 3] as const;

const STATUS_VALUES: PlannerAppointment["status"][] = ["confirmed", "completed", "cancelled"];

const DURATION_OPTIONS = [30, 60, 90] as const;

function getTimeSlots(breakLabel: string) {
  const slots: { time: string; isBreak: boolean }[] = [];
  for (let h = 9; h < 13; h++) {
    slots.push({ time: `${String(h).padStart(2, "0")}:00`, isBreak: false });
    slots.push({ time: `${String(h).padStart(2, "0")}:30`, isBreak: false });
  }
  slots.push({ time: breakLabel, isBreak: true });
  for (let h = 14; h < 18; h++) {
    slots.push({ time: `${String(h).padStart(2, "0")}:00`, isBreak: false });
    slots.push({ time: `${String(h).padStart(2, "0")}:30`, isBreak: false });
  }
  return slots;
}

function todayStr() {
  return format(new Date(), "yyyy-MM-dd");
}

function statusKey(status: PlannerAppointment["status"]): MessageKey {
  if (status === "completed") return "appointments.status.completed";
  if (status === "cancelled") return "appointments.status.cancelled";
  return "appointments.status.confirmed";
}

export function AppointmentsPanel() {
  const { t, locale } = usePreferences();
  const [view, setView] = useState<"day" | "month">("day");
  const [date, setDate] = useState<string>(todayStr());
  const [monthYear, setMonthYear] = useState(() => ({ y: new Date().getFullYear(), m: new Date().getMonth() + 1 }));

  useRealtime({
    onAppointmentsChanged: () => {
      setReloadKey((k) => k + 1);
    },
  });

  const [reloadKey, setReloadKey] = useState(0);

  const breakLabel = t("appointments.breakTime");

  useEffect(() => {
    const d = new Date(date + "T12:00:00");
    setMonthYear({ y: d.getFullYear(), m: d.getMonth() + 1 });
  }, [date]);

  return (
    <div className="space-y-6 animate-fade-up">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{t("appointments.pageTitle")}</h1>
          <p className="text-ink-muted">{t("appointments.pageSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setView("day")}
            className={`rounded-full px-4 py-2 text-sm ring-1 transition ${
              view === "day"
                ? "bg-brand text-white ring-brand"
                : "bg-[var(--surface-muted)] text-brand-dark ring-brand-soft hover:bg-brand-soft/40 dark:text-zinc-100"
            }`}
          >
            {t("appointments.viewDay")}
          </button>
          <button
            type="button"
            onClick={() => setView("month")}
            className={`rounded-full px-4 py-2 text-sm ring-1 transition ${
              view === "month"
                ? "bg-brand text-white ring-brand"
                : "bg-[var(--surface-muted)] text-brand-dark ring-brand-soft hover:bg-brand-soft/40 dark:text-zinc-100"
            }`}
          >
            {t("appointments.viewMonth")}
          </button>
        </div>
      </div>

      {view === "month" ? (
        <MonthView
          key={`m-${monthYear.y}-${monthYear.m}-${reloadKey}-${locale}`}
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
          key={`d-${date}-${reloadKey}-${locale}-${breakLabel}`}
          date={date}
          breakLabel={breakLabel}
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
  const { t, dateLocale } = usePreferences();
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

  const weekLabels = Array.from({ length: 7 }, (_, i) =>
    format(addDays(calendarStart, i), "EEE", { locale: dateLocale }),
  );

  return (
    <div className="rounded-[2rem] bg-[var(--surface-muted)] p-5 shadow-card ring-1 ring-brand-soft dark:ring-zinc-700/80">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-full px-3 py-2 text-brand-dark ring-1 ring-brand-soft transition hover:bg-brand-soft/40 dark:text-zinc-100"
        >
          ‹
        </button>
        <h2 className="font-display text-xl text-ink">{format(monthStart, "LLLL yyyy", { locale: dateLocale })}</h2>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-full px-3 py-2 text-brand-dark ring-1 ring-brand-soft transition hover:bg-brand-soft/40 dark:text-zinc-100"
        >
          ›
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-2">
        {weekLabels.map((d, i) => (
          <div key={`w-${i}`} className="text-center text-xs font-semibold text-ink-muted">
            {d}
          </div>
        ))}
        {days.map((d) => {
          const dateStr = format(d, "yyyy-MM-dd");
          const count = counts[dateStr] || 0;
          const isCurrentMonth = isSameMonth(d, monthStart);
          const isTodayCell = dateStr === today;
          const isSelected = dateStr === selectedDate;
          return (
            <button
              key={dateStr}
              type="button"
              onClick={() => onSelectDay(dateStr)}
              className={[
                "rounded-2xl p-3 text-left ring-1 transition",
                isCurrentMonth
                  ? "bg-white ring-brand-soft hover:bg-brand-soft/35 dark:bg-zinc-900 dark:ring-zinc-700 dark:hover:bg-zinc-800"
                  : "bg-white/60 text-ink-muted ring-brand-soft/60 dark:bg-zinc-950/60 dark:ring-zinc-800",
                isTodayCell ? "ring-brand" : "",
                isSelected ? "bg-brand-soft/60 ring-brand dark:bg-zinc-800" : "",
              ].join(" ")}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{format(d, "d")}</span>
                {count > 0 ? (
                  <span className="rounded-full bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand-dark dark:text-brand-light">
                    {count}
                  </span>
                ) : null}
              </div>
              {count > 0 ? (
                <div className="mt-1 text-[11px] text-ink-muted">
                  {count === 1 ? t("appointments.month.footerOne") : t("appointments.month.footerMany")}
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
  breakLabel,
  onDateChange,
  onSaved,
}: {
  date: string;
  breakLabel: string;
  onDateChange: (d: string) => void;
  onSaved: () => void;
}) {
  const { t, dateLocale } = usePreferences();
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
  const slots = useMemo(() => getTimeSlots(breakLabel), [breakLabel]);

  const prevDay = () => onDateChange(format(subDays(dateObj, 1), "yyyy-MM-dd"));
  const nextDay = () => onDateChange(format(addDays(dateObj, 1), "yyyy-MM-dd"));

  const getAppointmentForSlot = (slotTime: string, cabinId: number) => {
    if (!/^\d{2}:\d{2}$/.test(slotTime)) return null;
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
      <div
        className={`rounded-[2rem] bg-[var(--surface-muted)] p-5 shadow-card ring-1 dark:ring-zinc-700/80 ${
          isToday ? "ring-brand" : "ring-brand-soft"
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={prevDay}
            className="rounded-full px-3 py-2 text-brand-dark ring-1 ring-brand-soft transition hover:bg-brand-soft/40 dark:text-zinc-100"
          >
            ‹
          </button>
          <div className="text-center">
            <div className="font-display text-xl text-ink">
              {format(dateObj, "EEEE, d. MMMM yyyy", { locale: dateLocale })}
            </div>
            {isToday ? (
              <div className="text-xs font-semibold text-brand-dark dark:text-brand-light">{t("appointments.today")}</div>
            ) : null}
          </div>
          <button
            type="button"
            onClick={nextDay}
            className="rounded-full px-3 py-2 text-brand-dark ring-1 ring-brand-soft transition hover:bg-brand-soft/40 dark:text-zinc-100"
          >
            ›
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-[2rem] bg-[var(--surface-muted)] p-4 shadow-card ring-1 ring-brand-soft dark:ring-zinc-700/80">
        <div className="min-w-[760px]">
          <div className="grid grid-cols-[120px_repeat(3,1fr)] gap-2 pb-2">
            <div />
            {CABIN_IDS.map((id) => (
              <div key={id} className="text-center text-sm font-semibold text-ink">
                {t("appointments.cabin", { n: String(id) })}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            {slots.map((s) => (
              <div key={s.time} className={`grid grid-cols-[120px_repeat(3,1fr)] gap-2 ${s.isBreak ? "opacity-90" : ""}`}>
                <div className="flex items-center justify-center rounded-2xl bg-brand-soft/40 py-3 text-sm font-semibold text-ink dark:bg-zinc-800/80">
                  {s.time}
                </div>
                {s.isBreak ? (
                  <div className="col-span-3 flex items-center justify-center rounded-2xl bg-brand-soft/30 py-3 text-sm text-ink-muted dark:bg-zinc-800/60">
                    {t("appointments.pause")}
                  </div>
                ) : (
                  CABIN_IDS.map((cId) => {
                    const apt = getAppointmentForSlot(s.time, cId);
                    return (
                      <button
                        key={cId}
                        type="button"
                        onClick={() => openNew(s.time, cId)}
                        className="rounded-2xl border border-brand-soft bg-white px-3 py-3 text-left transition hover:bg-brand-soft/20 dark:border-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900"
                      >
                        {apt ? (
                          <AppointmentCard
                            appointment={apt}
                            onEdit={() => openEdit(apt)}
                            onDelete={() => void deleteAppointment(apt.id)}
                          />
                        ) : (
                          <span className="text-sm text-ink-muted">+ {t("appointments.newAppointment")}</span>
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
  const { t } = usePreferences();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const statusLabel = t(statusKey(appointment.status));

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onEdit();
      }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-ink">{appointment.time}</span>
        <span
          className={[
            "rounded-full px-2 py-0.5 text-[11px] font-semibold",
            appointment.status === "completed"
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
              : appointment.status === "cancelled"
                ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300"
                : "bg-brand-soft/60 text-brand-dark dark:bg-zinc-800 dark:text-brand-light",
          ].join(" ")}
        >
          {statusLabel}
        </span>
      </div>
      <div className="min-w-0">
        <div className="break-words text-sm font-semibold text-ink">{appointment.patientName}</div>
        {appointment.treatment ? <div className="text-xs text-ink-muted">{appointment.treatment}</div> : null}
        {appointment.phone ? <div className="text-xs text-ink-muted">{appointment.phone}</div> : null}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="rounded-full border border-brand-soft px-3 py-1.5 text-xs text-brand-dark transition hover:bg-brand-soft/30 dark:border-zinc-600 dark:text-zinc-100"
        >
          {t("appointments.edit")}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          className="rounded-full border border-red-100 px-3 py-1.5 text-xs text-red-700 transition hover:bg-red-50 dark:border-red-900/50 dark:text-red-300 dark:hover:bg-red-950/40"
        >
          {t("appointments.delete")}
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
          <div
            className="w-full max-w-sm rounded-[1.5rem] bg-[var(--surface-muted)] p-5 shadow-lift ring-1 ring-brand-soft dark:ring-zinc-700/80"
            onClick={(e) => e.stopPropagation()}
          >
            <h4 className="font-display text-lg text-ink">{t("appointments.deleteDialog.title")}</h4>
            <p className="mt-2 text-sm text-ink-muted">{t("appointments.deleteDialog.body")}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-full border border-brand-soft px-4 py-2 text-sm text-ink-muted transition hover:bg-brand-soft/30 dark:border-zinc-600"
              >
                {t("appointments.deleteDialog.cancel")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  onDelete();
                }}
                className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                {t("appointments.deleteDialog.confirm")}
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
  const { t, dateLocale } = usePreferences();
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

  const cabinLabel = t("appointments.cabin", { n: String(cabinId) });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-[2rem] bg-[var(--surface-muted)] p-6 shadow-lift ring-1 ring-brand-soft dark:ring-zinc-700/80"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl text-ink">
              {appointment ? t("appointments.form.editTitle") : t("appointments.form.newTitle")}
            </h3>
            <p className="mt-1 text-sm text-ink-muted">
              {[
                format(new Date(date + "T12:00:00"), "EEEE, d. MMMM", { locale: dateLocale }),
                time,
                cabinLabel,
              ].join(", ")}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-brand-soft px-3 py-1 text-sm text-ink-muted transition hover:bg-brand-soft/30 dark:border-zinc-600"
          >
            ×
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-ink-muted">{t("appointments.form.cabin")}</span>
            <select
              value={cabinId}
              onChange={(e) => setCabinId(Number(e.target.value))}
              className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-zinc-600 dark:bg-zinc-950"
            >
              {CABIN_IDS.map((id) => (
                <option key={id} value={id}>
                  {t("appointments.cabin", { n: String(id) })}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-ink-muted">{t("appointments.form.patient")} *</span>
            <input
              value={patientName}
              onChange={(e) => setPatientName(e.target.value)}
              required
              className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-zinc-600 dark:bg-zinc-950"
              placeholder={t("appointments.form.placeholderName")}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-ink-muted">{t("appointments.form.phone")}</span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-zinc-600 dark:bg-zinc-950"
              placeholder={t("appointments.form.placeholderPhone")}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-ink-muted">{t("appointments.form.treatment")}</span>
            <input
              value={treatment}
              onChange={(e) => setTreatment(e.target.value)}
              className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-zinc-600 dark:bg-zinc-950"
              placeholder={t("appointments.form.placeholderTreatment")}
            />
          </label>

          <label className="block space-y-1">
            <span className="text-xs font-semibold text-ink-muted">{t("appointments.form.note")}</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-zinc-600 dark:bg-zinc-950"
              placeholder={t("appointments.form.placeholderNote")}
            />
          </label>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-ink-muted">{t("appointments.form.status")}</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlannerAppointment["status"])}
                className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-zinc-600 dark:bg-zinc-950"
              >
                {STATUS_VALUES.map((v) => (
                  <option key={v} value={v}>
                    {t(statusKey(v))}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-ink-muted">{t("appointments.form.duration")}</span>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full rounded-2xl border border-brand-soft bg-white px-3 py-2 text-sm outline-none focus:border-brand dark:border-zinc-600 dark:bg-zinc-950"
              >
                {DURATION_OPTIONS.map((d) => (
                  <option key={d} value={d}>
                    {t("appointments.form.durationMinutes", { minutes: d })}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-brand-soft px-5 py-2 text-sm text-ink-muted transition hover:bg-brand-soft/30 dark:border-zinc-600"
            >
              {t("appointments.form.cancel")}
            </button>
            <button
              disabled={saving}
              type="submit"
              className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {saving ? t("appointments.form.saving") : t("appointments.form.save")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
