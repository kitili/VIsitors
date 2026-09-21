import { NextResponse } from "next/server";
import { getCheckInUrl } from "@/lib/app-url";

export const runtime = "nodejs";

export async function GET() {
  const checkInUrl = getCheckInUrl();
  try {
    const response = await fetch(checkInUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(8000),
    });
    const body = await response.text();
    const isTunnelDead =
      response.status === 503 ||
      body.includes("Tunnel Unavailable") ||
      body.includes("tunnel unavailable");

    return NextResponse.json({
      ok: response.ok && !isTunnelDead,
      status: response.status,
      checkInUrl,
      message: isTunnelDead
        ? "Tunnel is offline. Run npm run tunnel and scan the new QR."
        : response.ok
          ? "Tunnel is live."
          : `Check-in page returned ${response.status}.`,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      checkInUrl,
      message: error instanceof Error ? error.message : "Tunnel check failed.",
    });
  }
}
