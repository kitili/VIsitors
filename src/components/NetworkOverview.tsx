"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { campusPath } from "@/lib/campus-routes";
import type { CampusName } from "@/domain/Campus";
import { fetchOverview } from "@/lib/visits-client";
import type { NetworkOverview as OverviewData } from "@/services/VisitService";
import { useAppPreferences } from "@/lib/i18n/context";
import { WatchlistPanel } from "./WatchlistPanel";

export function NetworkOverview() {
  const { t, te } = useAppPreferences();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setOverview(await fetchOverview());
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? te(err.message) : t("overview.loading")),
    );
    const timer = setInterval(() => void load().catch(() => undefined), 8000);
    return () => clearInterval(timer);
  }, [t, te]);

  if (error) return <p className="form-msg err">{error}</p>;
  if (!overview) return <p className="form-msg">{t("overview.loading")}</p>;

  return (
    <>
      <div className="overview-summary card">
        <div className="overview-total">
          <span className="num">{overview.totalOnSite}</span>
          <span className="label">{t("overview.onSiteAll")}</span>
        </div>
        <div className="overview-date">
          {t("overview.today")} · {overview.date}
        </div>
      </div>

      <div className="overview-grid">
        {overview.campuses.map((campus) => (
          <Link
            key={campus.slug}
            href={campusPath(campus.name as CampusName)}
            className="overview-card card"
            style={{ borderTop: `4px solid ${campus.accent}` }}
          >
            <h3>{campus.name}</h3>
            <div className="overview-stats">
              <div>
                <span className="num">{campus.onSite}</span>
                <span className="label">{t("overview.onSite")}</span>
              </div>
              <div>
                <span className="num">{campus.totalToday}</span>
                <span className="label">{t("overview.totalToday")}</span>
              </div>
              <div>
                <span className="num">{campus.selfToday}</span>
                <span className="label">{t("overview.qrSelf")}</span>
              </div>
              <div>
                <span className="num">{campus.deskToday}</span>
                <span className="label">{t("nav.frontDesk")}</span>
              </div>
            </div>
            <span className="overview-link">{t("overview.openDesk")}</span>
          </Link>
        ))}
      </div>

      <WatchlistPanel />
    </>
  );
}
