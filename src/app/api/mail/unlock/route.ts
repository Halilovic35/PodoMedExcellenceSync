import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/require-user";

const bodySchema = z.object({
  password: z.string(),
});

/**
 * Demo fallbacks when env vars are unset (local development).
 * In production, set MAIL_MASTER_PASSWORD and IONOS_* in the environment.
 */
const DEMO = {
  masterPassword: "1952",
  ionosUsername: "26541346",
  companyEmail: "info@podomed-excellence.de",
  ionosPassword: "Haris01dzan04!",
} as const;

export async function POST(req: NextRequest) {
  const r = await requireUser(req);
  if (!r.ok) return r.response;

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ code: "mail_unlock_invalid_body" }, { status: 400 });
  }

  const master = process.env.MAIL_MASTER_PASSWORD || DEMO.masterPassword;

  if (parsed.data.password !== master) {
    return NextResponse.json({ code: "mail_unlock_incorrect_password" }, { status: 401 });
  }

  return NextResponse.json({
    ionosUsername: process.env.IONOS_USERNAME || DEMO.ionosUsername,
    companyEmail: process.env.COMPANY_EMAIL || DEMO.companyEmail,
    ionosPassword: process.env.IONOS_PASSWORD || DEMO.ionosPassword,
  });
}
