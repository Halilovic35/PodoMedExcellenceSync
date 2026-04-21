import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { emitAppointmentsChanged } from "@/lib/realtime";

export async function GET(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (date) {
    const items = await prisma.appointment.findMany({
      where: { date },
      orderBy: [{ time: "asc" }, { cabin: "asc" }],
    });
    return NextResponse.json({ items });
  }

  if (year && month) {
    const y = Number(year);
    const m = Number(month);
    if (!Number.isFinite(y) || !Number.isFinite(m) || m < 1 || m > 12) {
      return NextResponse.json({ error: "Invalid year/month" }, { status: 400 });
    }
    const mm = String(m).padStart(2, "0");
    const start = `${y}-${mm}-01`;
    const end = `${y}-${mm}-31`;

    const rows = await prisma.appointment.groupBy({
      by: ["date"],
      where: {
        date: { gte: start, lte: end },
        status: { not: "cancelled" },
      },
      _count: { _all: true },
    });

    return NextResponse.json({
      items: rows.map((r0) => ({ date: r0.date, count: r0._count._all })),
    });
  }

  const items = await prisma.appointment.findMany({
    orderBy: [{ date: "asc" }, { time: "asc" }, { cabin: "asc" }],
  });

  return NextResponse.json({ items });
}

const createSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  cabin: z.number().int().min(1).max(10).optional(),
  patient_name: z.string().min(1).max(200),
  phone: z.string().max(50).optional(),
  treatment: z.string().max(200).optional(),
  note: z.string().max(2000).optional(),
  status: z.enum(["confirmed", "completed", "cancelled"]).optional(),
  duration: z.number().int().min(15).max(240).optional(),
});

export async function POST(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const cabin = parsed.data.cabin ?? 1;
  const duration = parsed.data.duration ?? 30;
  const startAt = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  const endAt = new Date(startAt.getTime() + duration * 60 * 1000);

  const item = await prisma.appointment.create({
    data: {
      date: parsed.data.date,
      time: parsed.data.time,
      cabin,
      patientName: parsed.data.patient_name.trim(),
      phone: parsed.data.phone?.trim() ?? "",
      treatment: parsed.data.treatment?.trim() ?? "",
      note: parsed.data.note?.trim() ?? "",
      status: parsed.data.status ?? "confirmed",
      duration,
      startAt,
      endAt,
      title: parsed.data.patient_name.trim(),
      notes: parsed.data.note?.trim() ?? "",
      userId: r.user.id,
    },
  });

  emitAppointmentsChanged({ actorUserId: r.user.id });
  return NextResponse.json({ item });
}
