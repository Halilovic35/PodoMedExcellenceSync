import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { emitAppointmentsChanged } from "@/lib/realtime";

const patchSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  cabin: z.number().int().min(1).max(10).optional(),
  patient_name: z.string().min(1).max(200).optional(),
  phone: z.string().max(50).optional(),
  treatment: z.string().max(200).optional(),
  note: z.string().max(2000).optional(),
  status: z.enum(["confirmed", "completed", "cancelled"]).optional(),
  duration: z.number().int().min(15).max(240).optional(),
});

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const { id } = ctx.params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (parsed.data.date !== undefined) data.date = parsed.data.date;
  if (parsed.data.time !== undefined) data.time = parsed.data.time;
  if (parsed.data.cabin !== undefined) data.cabin = parsed.data.cabin;
  if (parsed.data.patient_name !== undefined) {
    data.patientName = parsed.data.patient_name.trim();
    data.title = parsed.data.patient_name.trim();
  }
  if (parsed.data.phone !== undefined) data.phone = parsed.data.phone.trim();
  if (parsed.data.treatment !== undefined) data.treatment = parsed.data.treatment.trim();
  if (parsed.data.note !== undefined) {
    data.note = parsed.data.note.trim();
    data.notes = parsed.data.note.trim();
  }
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.duration !== undefined) data.duration = parsed.data.duration;

  const date = (data.date as string | undefined) ?? undefined;
  const time = (data.time as string | undefined) ?? undefined;
  const duration = (data.duration as number | undefined) ?? undefined;
  if (date || time || duration) {
    const existing = await prisma.appointment.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const d = date ?? existing.date;
    const t = time ?? existing.time;
    const dur = duration ?? existing.duration;
    const startAt = new Date(`${d}T${t}:00`);
    const endAt = new Date(startAt.getTime() + dur * 60 * 1000);
    data.startAt = startAt;
    data.endAt = endAt;
  }

  try {
    const item = await prisma.appointment.update({
      where: { id },
      data,
    });
    emitAppointmentsChanged({ actorUserId: r.user.id });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const { id } = ctx.params;
  try {
    await prisma.appointment.delete({ where: { id } });
    emitAppointmentsChanged({ actorUserId: r.user.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
