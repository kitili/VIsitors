"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { campusPath } from "@/lib/campus-routes";
import type { CampusName } from "@/domain/Campus";
import { fetchOverview } from "@/lib/visits-client";
import type { NetworkOverview as OverviewData } from "@/services/VisitService";
import { WatchlistPanel } from "./WatchlistPanel";

export function NetworkOverview() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [error, setError] = useState("");

  async function load() {
    setOverview(await fetchOverview());
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? err.message : "Could not load overview."),
    );
    const timer = setInterval(() => void load().catch(() => undefined), 8000);
    return () => clearInterval(timer);
  }, []);

  if (error) return <p className="form-msg err">{error}</p>;
  if (!overview) return <p className="form-msg">Loading network overview…</p>;

  return (
    <>
      <div className="overview-summary card">
        <div className="overview-total">
          <span className="num">{overview.totalOnSite}</span>
          <span className="label">visitors on site across all campuses today</span>
        </div>
        <div className="overview-date">Today · {overview.date}</div>
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
                <span className="label">On site</span>
              </div>
              <div>
                <span className="num">{campus.totalToday}</span>
                <span className="label">Total today</span>
              </div>
              <div>
                <span className="num">{campus.selfToday}</span>
                <span className="label">QR self</span>
              </div>
              <div>
                <span className="num">{campus.deskToday}</span>
                <span className="label">Front desk</span>
              </div>
            </div>
            <span className="overview-link">Open front desk →</span>
          </Link>
        ))}
      </div>

      <WatchlistPanel />
    </>
  );
}
