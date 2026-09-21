import { headers } from "next/headers";
import QRCode from "qrcode";
import { QrPoster } from "@/components/QrPoster";
import { getCheckInUrl } from "@/lib/app-url";

export default async function PublicQrPage() {
  const host = (await headers()).get("host") ?? undefined;
  const checkInUrl = getCheckInUrl(host);
  const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#002368", light: "#ffffff" },
  });

  return (
    <div className="wrap">
      <QrPoster checkInUrl={checkInUrl} qrDataUrl={qrDataUrl} />
    </div>
  );
}
