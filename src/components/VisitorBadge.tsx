"use client";

import { useMemo } from "react";
import { VisitRecord } from "@/domain/Visit";
import { buildVisitorPassUrl } from "@/lib/visitor-pass";
import { formatPhone } from "@/lib/format-phone";
import { useAppPreferences } from "@/lib/i18n/context";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function VisitorBadge({
  visit,
  showSuccessNote,
  onDone,
}: {
  visit: VisitRecord;
  showSuccessNote?: boolean;
  onDone: () => void;
}) {
  const { t, purposeLabel } = useAppPreferences();

  const passUrl = useMemo(() => {
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      (typeof window !== "undefined" ? window.location.origin : "");
    return buildVisitorPassUrl(visit, base);
  }, [visit]);
  const qrSrc = useMemo(
    () => `/api/qr?${new URLSearchParams({ t: passUrl }).toString()}`,
    [passUrl],
  );

  function printBadge() {
    window.print();
  }

  return (
    <div className="badge-panel card">
      {showSuccessNote ? (
        <div className="success-panel-inline">
          <h2>{t("signIn.successTitle")}</h2>
          <p className="sub">{t("signIn.successSub", { name: visit.name })}</p>
        </div>
      ) : null}
      <div className="visitor-badge printable-badge">
        <div className="badge-header">{t("badge.header")}</div>
        <div className="badge-body">
          {visit.photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={visit.photo} alt="" className="badge-photo" />
          ) : (
            <div className="badge-photo badge-photo--initials">
              {visit.name.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="badge-details">
            <div className="badge-name">{visit.name}</div>
            <div className="badge-campus">{visit.campus}</div>
            <div className="badge-meta">
              {purposeLabel(visit.purpose)} · {visit.host}
            </div>
            <div className="badge-meta">{formatPhone(visit.phone)}</div>
            {visit.vehicleReg ? (
              <div className="badge-meta badge-vehicle">{t("badge.vehicle", { reg: visit.vehicleReg })}</div>
            ) : null}
            <div className="badge-time">{t("badge.signedIn", { time: formatTime(visit.signedInAt) })}</div>
          </div>
          <div className="badge-qr-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrSrc} alt={t("badge.qrAlt")} width={120} height={120} className="badge-qr" />
            <p className="badge-qr-caption">{t("badge.qrCaption")}</p>
          </div>
        </div>
      </div>
      <div className="badge-actions no-print">
        <button type="button" className="submit-btn" onClick={printBadge}>
          {t("badge.print")}
        </button>
        <button type="button" className="ghost-btn" onClick={onDone}>
          {t("badge.another")}
        </button>
      </div>
    </div>
  );
}
