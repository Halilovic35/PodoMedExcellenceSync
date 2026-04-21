import { readFile, stat, unlink, writeFile } from "fs/promises";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";
import { emitDocumentsChanged } from "@/lib/realtime";
import { ensureUploadsDir, filePathForKey, newStorageKey } from "@/lib/uploads";

type Ctx = { params: { id: string } };

export async function GET(req: NextRequest, ctx: Ctx) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const doc = await prisma.document.findUnique({ where: { id: ctx.params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const path = filePathForKey(doc.storageKey);
  try {
    await stat(path);
  } catch {
    return NextResponse.json({ error: "File missing" }, { status: 404 });
  }

  const buf = await readFile(path);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": doc.mime,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(doc.title)}"`,
    },
  });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const doc = await prisma.document.findUnique({ where: { id: ctx.params.id } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  await ensureUploadsDir();
  const newKey = newStorageKey(file.name || "upload.bin");
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(filePathForKey(newKey), buf);

  const oldKey = doc.storageKey;
  try {
    await unlink(filePathForKey(oldKey));
  } catch {
    /* ignore missing old file */
  }

  const item = await prisma.document.update({
    where: { id: doc.id },
    data: {
      storageKey: newKey,
      mime: file.type || doc.mime,
      size: buf.byteLength,
      version: doc.version + 1,
    },
    include: { uploadedBy: { select: { name: true } } },
  });

  emitDocumentsChanged();
  return NextResponse.json({ item });
}
