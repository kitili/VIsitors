import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getCheckInUrl, getPublicBaseUrl } from "@/lib/app-url";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const host = request.headers.get("host") ?? undefined;
  const campus = request.nextUrl.searchParams.get("campus") ?? undefined;
  const customTarget = request.nextUrl.searchParams.get("t");
  const base = getPublicBaseUrl(host);
  const url =
    customTarget && (customTarget === base || customTarget.startsWith(`${base}/`))
      ? customTarget
      : getCheckInUrl(host, campus);
  // Always encode the resolved check-in URL — tunnel links change when restarted.
  const png = await QRCode.toBuffer(url, {
    type: "png",
    width: 512,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#002368", light: "#ffffff" },
  });

  return new NextResponse(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
      "X-Check-In-Url": url,
    },
  });
}
