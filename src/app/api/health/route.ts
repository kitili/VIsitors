import { NextResponse } from "next/server";
import {
  getDatabaseKind,
  getSqlClient,
  getSqlDatabaseUrl,
  isPersistentDatabase,
} from "@/db/client";
import { isVercel } from "@/lib/runtime-env";

export const runtime = "nodejs";

const NEON_SETUP_URL =
  "https://vercel.com/mourinekitilimourine-8096s-projects/v-isitors/stores";

export async function GET() {
  try {
    const client = await getSqlClient();
    const count = await client.execute("SELECT COUNT(*) AS total FROM visits");
    const persistent = isPersistentDatabase();
    const kind = getDatabaseKind();
    const onVercel = isVercel();
    const warning =
      onVercel && !persistent
        ? "Visitor data is temporary on Vercel. Connect Neon or Turso for persistent storage."
        : null;

    return NextResponse.json({
      ok: true,
      database: kind,
      persistent,
      url: getSqlDatabaseUrl(),
      visits: Number(count.rows[0]?.total ?? 0),
      warning,
      setupUrl: warning ? NEON_SETUP_URL : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Database unavailable",
      },
      { status: 500 },
    );
  }
}
