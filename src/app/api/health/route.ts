import { NextResponse } from "next/server";
import {
  getSqlClient,
  getSqlDatabaseUrl,
  isPersistentDatabase,
  isRemoteDatabase,
} from "@/db/client";
import { isVercel } from "@/lib/runtime-env";

export const runtime = "nodejs";

const TURSO_TERMS_URL =
  "https://vercel.com/mourinekitilimourine-8096s-projects/~/integrations/accept-terms/tursocloud";

export async function GET() {
  try {
    const client = await getSqlClient();
    const count = await client.execute("SELECT COUNT(*) AS total FROM visits");
    const persistent = isPersistentDatabase();
    const onVercel = isVercel();
    const warning =
      onVercel && !persistent
        ? "Visitor data is temporary on Vercel. Connect Turso for persistent storage."
        : null;

    return NextResponse.json({
      ok: true,
      database: isRemoteDatabase() ? "turso" : "sqlite",
      persistent,
      url: isRemoteDatabase() ? "libsql://remote" : getSqlDatabaseUrl(),
      visits: Number(count.rows[0]?.total ?? 0),
      warning,
      setupUrl: warning ? TURSO_TERMS_URL : null,
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
