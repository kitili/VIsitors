"use client";

import { VisitRecord } from "@/domain/Visit";
import { formatPhone } from "@/lib/format-phone";
import { useAppPreferences } from "@/lib/i18n/context";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function VisitorBadge({
  visit,
  onDone,
}: {
  visit: VisitRecord;
  onDone: () => void;
}) {
  const { t, purposeLabel } = useAppPreferences();

  function printBadge() {
    window.print();
  }

  return (
    <div className="badge-panel card">
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
            <div className="badge-time">{t("badge.signedIn", { time: formatTime(visit.signedInAt) })}</div>
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
