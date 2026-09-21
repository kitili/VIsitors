import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getVisitService } from "@/lib/container";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const date = request.nextUrl.searchParams.get("date") ?? undefined;
    const overview = await getVisitService().networkOverview(date ?? undefined);
    return NextResponse.json(overview);
  } catch (error) {
    return jsonError(error);
  }
}
