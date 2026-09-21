"use client";

import { QrPoster } from "@/components/QrPoster";
import { SiteHeader } from "@/components/SiteHeader";
import { useAppPreferences } from "@/lib/i18n/context";

export function CampusQrShell({
  campus,
  campusSlug,
  checkInUrl,
  qrDataUrl,
}: {
  campus: string;
  campusSlug: string;
  checkInUrl: string;
  qrDataUrl: string;
}) {
  const { t } = useAppPreferences();

  return (
    <div className="wrap campus-themed" data-campus={campus}>
      <SiteHeader
        campus={campus}
        title={t("qr.title")}
        subtitle={t("qr.subtitle", { campus })}
        active="qr"
      />
      <QrPoster
        checkInUrl={checkInUrl}
        qrDataUrl={qrDataUrl}
        campusSlug={campusSlug}
        campusName={campus}
      />
    </div>
  );
}
