import { unlink } from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { emitDocumentsChanged } from "@/lib/realtime";
import { filePathForKey } from "@/lib/uploads";

const statuses = ["Uploaded", "In Progress", "Completed", "Ready to Print"] as const;

const patchSchema = z.object({
  note: z.string().max(5000).optional(),
  status: z.enum(statuses).optional(),
});

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (parsed.data.note !== undefined) data.note = parsed.data.note;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;

  try {
    const item = await prisma.document.update({
      where: { id: ctx.params.id },
      data,
      include: { uploadedBy: { select: { name: true } } },
    });
    emitDocumentsChanged({ actorUserId: r.user.id });
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  try {
    const existing = await prisma.document.findUnique({ where: { id: ctx.params.id } });
    if (!existing) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    await prisma.document.delete({ where: { id: ctx.params.id } });
    try {
      await unlink(filePathForKey(existing.storageKey));
    } catch {
      /* ignore missing file */
    }
    emitDocumentsChanged({ actorUserId: r.user.id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
