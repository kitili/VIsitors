import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getVisitService, getWatchlistRepository } from "@/lib/container";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const phone = request.nextUrl.searchParams.get("phone") ?? "";
    const name = request.nextUrl.searchParams.get("name") ?? "";
    const visit = await getVisitService().lookupByPhone(phone);
    const watchlist = name || phone ? await getWatchlistRepository().match(name, phone) : null;
    return NextResponse.json({ visit, watchlist });
  } catch (error) {
    return jsonError(error);
  }
}
