import { writeFile } from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { emitDocumentsChanged } from "@/lib/realtime";
import { ensureUploadsDir, filePathForKey, newStorageKey } from "@/lib/uploads";

export async function GET(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const items = await prisma.document.findMany({
    orderBy: { updatedAt: "desc" },
    include: { uploadedBy: { select: { name: true } } },
  });

  return NextResponse.json({ items });
}

export async function POST(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const titleRaw = form.get("title");
  const noteRaw = form.get("note");
  const title =
    typeof titleRaw === "string" && titleRaw.trim()
      ? titleRaw.trim()
      : file.name || "Document";

  const noteParse = z.string().max(5000).safeParse(typeof noteRaw === "string" ? noteRaw : "");
  const note = noteParse.success ? noteParse.data : "";

  await ensureUploadsDir();
  const storageKey = newStorageKey(file.name || "upload.bin");
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filePathForKey(storageKey), buf);

  const item = await prisma.document.create({
    data: {
      title,
      storageKey,
      mime: file.type || "application/octet-stream",
      size: buf.byteLength,
      note,
      status: "Uploaded",
      uploadedById: r.user.id,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  emitDocumentsChanged({ actorUserId: r.user.id });
  return NextResponse.json({ item });
}
