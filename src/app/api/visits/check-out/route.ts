import { NextRequest, NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getVisitService } from "@/lib/container";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone = String(body.phone ?? "");
    const campus = body.campus ? String(body.campus) : undefined;
    const visit = await getVisitService().signOutByPhone(phone, campus);
    return NextResponse.json({ visit });
  } catch (error) {
    return jsonError(error);
  }
}
