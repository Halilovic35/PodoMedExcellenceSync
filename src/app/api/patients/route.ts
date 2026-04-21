import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/require-user";

export async function GET(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const { searchParams } = new URL(req.url);
  const q = (searchParams.get("search") ?? "").trim();

  if (!q) return NextResponse.json({ items: [] });

  const rows = await prisma.appointment.findMany({
    where: { patientName: { contains: q, mode: "insensitive" } },
    select: { patientName: true, phone: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const seen = new Set<string>();
  const items = rows
    .map((r0) => ({ patient_name: r0.patientName, phone: r0.phone || "" }))
    .filter((p) => {
      const k = `${p.patient_name}::${p.phone}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, 8)
    .map((p) => ({ id: null, ...p }));

  return NextResponse.json({ items });
}

