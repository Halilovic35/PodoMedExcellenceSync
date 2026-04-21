import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "./auth";
import { prisma } from "./prisma";

type UserSummary = { id: string; email: string; name: string };

export type RequireUserResult =
  | { ok: true; user: UserSummary }
  | { ok: false; response: NextResponse };

export async function requireUser(req: NextRequest): Promise<RequireUserResult> {
  const session = await getSessionFromRequest(req);
  if (!session) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, email: true, name: true },
  });
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { ok: true, user };
}
