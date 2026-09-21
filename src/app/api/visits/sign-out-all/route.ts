import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getVisitService } from "@/lib/container";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const campus = String(body.campus ?? "");
    const count = await getVisitService().signOutAll(campus);
    return NextResponse.json({ count });
  } catch (error) {
    return jsonError(error);
  }
}
