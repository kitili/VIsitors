import { NextResponse } from "next/server";
import { getSqlClient, getSqlDatabaseUrl, isRemoteDatabase } from "@/db/client";

export const runtime = "nodejs";

export async function GET() {
  try {
    const client = await getSqlClient();
    const count = await client.execute("SELECT COUNT(*) AS total FROM visits");
    return NextResponse.json({
      ok: true,
      database: isRemoteDatabase() ? "turso" : "sqlite",
      url: isRemoteDatabase() ? "libsql://remote" : getSqlDatabaseUrl(),
      visits: Number(count.rows[0]?.total ?? 0),
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
