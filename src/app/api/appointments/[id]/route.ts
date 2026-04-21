import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { emitAppointmentsChanged } from "@/lib/realtime";

const patchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  startAt: z.string().datetime().optional(),
  endAt: z.string().datetime().optional(),
  notes: z.string().max(2000).optional(),
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
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.notes !== undefined) data.notes = parsed.data.notes;
  if (parsed.data.startAt !== undefined) data.startAt = new Date(parsed.data.startAt);
  if (parsed.data.endAt !== undefined) data.endAt = new Date(parsed.data.endAt);

  try {
    const item = await prisma.appointment.update({
      where: { id },
      data,
      include: { user: { select: { name: true } } },
    });
    emitAppointmentsChanged();
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
    emitAppointmentsChanged();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
