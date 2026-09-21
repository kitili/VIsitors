import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { QrPoster } from "@/components/QrPoster";
import { SiteHeader } from "@/components/SiteHeader";
import { getCheckInUrl } from "@/lib/app-url";
import { campusFromSlug } from "@/lib/campus-routes";

export default async function CampusQrPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const campus = campusFromSlug(slug);
  if (!campus) notFound();

  const host = (await headers()).get("host") ?? undefined;
  const checkInUrl = getCheckInUrl(host, campus.slug);
  const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
    width: 400,
    margin: 2,
    errorCorrectionLevel: "M",
    color: { dark: "#002368", light: "#ffffff" },
  });

  return (
    <div className="wrap campus-themed" data-campus={campus.name}>
      <SiteHeader
        campus={campus.name}
        title="QR check-in poster"
        subtitle={`Print this QR — visitors scan to sign in at ${campus.name}.`}
        active="qr"
      />
      <QrPoster
        checkInUrl={checkInUrl}
        qrDataUrl={qrDataUrl}
        campusSlug={campus.slug}
        campusName={campus.name}
      />
    </div>
  );
}
