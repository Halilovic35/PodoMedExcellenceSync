import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "PodoMedExcellenceSync",
    env: process.env.NODE_ENV ?? null,
    railwayCommit:
      process.env.RAILWAY_GIT_COMMIT_SHA ??
      process.env.RAILWAY_GIT_COMMIT ??
      null,
    railwayService: process.env.RAILWAY_SERVICE_NAME ?? null,
    railwayEnvironment: process.env.RAILWAY_ENVIRONMENT_NAME ?? null,
  });
}

