import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { emitChatMessage } from "@/lib/realtime";

export async function GET(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const { searchParams } = new URL(req.url);
  const since = searchParams.get("since");
  const sinceDate = since ? new Date(since) : null;
  const sinceValid = Boolean(sinceDate && !Number.isNaN(sinceDate.getTime()));

  const items = sinceValid
    ? await prisma.chatMessage.findMany({
        where: { createdAt: { gt: sinceDate! } },
        orderBy: { createdAt: "asc" },
        take: 200,
        include: { user: { select: { id: true, name: true } } },
      })
    : [...(await prisma.chatMessage.findMany({
        orderBy: { createdAt: "desc" },
        take: 200,
        include: { user: { select: { id: true, name: true } } },
      }))].reverse();

  return NextResponse.json({ items });
}

const postSchema = z.object({
  body: z.string().min(1).max(4000),
});

export async function POST(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const json = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid message" }, { status: 400 });
  }

  const item = await prisma.chatMessage.create({
    data: { body: parsed.data.body, userId: r.user.id },
    include: { user: { select: { id: true, name: true } } },
  });

  emitChatMessage(item);
  return NextResponse.json({ item });
}
