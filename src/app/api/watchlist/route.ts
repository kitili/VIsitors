import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getWatchlistRepository } from "@/lib/container";

export const runtime = "nodejs";

export async function GET() {
  try {
    const entries = await getWatchlistRepository().all();
    return NextResponse.json({ entries });
  } catch (error) {
    return jsonError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const entry = await getWatchlistRepository().add({
      name: body.name ?? null,
      phone: body.phone ?? null,
      reason: String(body.reason ?? ""),
    });
    return NextResponse.json({ entry }, { status: 201 });
  } catch (error) {
    return jsonError(error);
  }
}
