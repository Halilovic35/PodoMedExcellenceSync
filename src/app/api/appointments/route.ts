import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { emitAppointmentsChanged } from "@/lib/realtime";

export async function GET(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const items = await prisma.appointment.findMany({
    orderBy: { startAt: "asc" },
    include: { user: { select: { name: true } } },
  });

  return NextResponse.json({ items });
}

const createSchema = z.object({
  title: z.string().min(1).max(200),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const item = await prisma.appointment.create({
    data: {
      title: parsed.data.title,
      startAt: new Date(parsed.data.startAt),
      endAt: new Date(parsed.data.endAt),
      notes: parsed.data.notes ?? "",
      userId: r.user.id,
    },
    include: { user: { select: { name: true } } },
  });

  emitAppointmentsChanged();
  return NextResponse.json({ item });
}
