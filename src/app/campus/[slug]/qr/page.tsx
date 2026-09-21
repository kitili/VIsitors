import { headers } from "next/headers";
import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { CampusQrShell } from "@/components/CampusQrShell";
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
    <CampusQrShell
      campus={campus.name}
      campusSlug={campus.slug}
      checkInUrl={checkInUrl}
      qrDataUrl={qrDataUrl}
    />
  );
}
