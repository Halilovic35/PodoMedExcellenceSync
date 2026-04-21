import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * One-time seeding endpoint for environments without shell access.
 * Protect it with SEED_KEY and refuse to run if users already exist.
 */
export async function POST(req: Request) {
  const seedKey = process.env.SEED_KEY;
  if (!seedKey || seedKey.length < 16) {
    return NextResponse.json(
      { error: "SEED_KEY not configured" },
      { status: 500 },
    );
  }

  const provided = req.headers.get("x-seed-key") ?? "";
  if (provided !== seedKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.user.count();
  if (existing > 0) {
    return NextResponse.json(
      { ok: true, skipped: true, reason: "Users already exist" },
      { status: 200 },
    );
  }

  const passwordHash = await bcrypt.hash("podomed2026", 10);
  await prisma.user.createMany({
    data: [
      { email: "clinic@podomed.local", passwordHash, name: "Clinic" },
      { email: "family@podomed.local", passwordHash, name: "Family" },
    ],
  });

  return NextResponse.json({ ok: true, created: 2 });
}

