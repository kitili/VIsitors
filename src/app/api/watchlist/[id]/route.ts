import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getWatchlistRepository } from "@/lib/container";

export const runtime = "nodejs";

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    await getWatchlistRepository().remove(Number(id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    return jsonError(error);
  }
}
