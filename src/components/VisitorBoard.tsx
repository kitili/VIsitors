"use client";

import { VisitRecord } from "@/domain/Visit";
import { signOutAll, signOutVisit } from "@/lib/visits-client";
import { useAppPreferences } from "@/lib/i18n/context";

const STALE_HOURS = 4;

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isStale(signedInAt: string) {
  const hours = (Date.now() - new Date(signedInAt).getTime()) / (1000 * 60 * 60);
  return hours >= STALE_HOURS;
}

export function VisitorBoard({
  campus,
  visits,
  onChanged,
  onToast,
}: {
  campus: string;
  visits: VisitRecord[];
  onChanged: () => void;
  onToast: (message: string) => void;
}) {
  const { t, te, purposeLabel } = useAppPreferences();

  async function signOut(id: string) {
    try {
      const visit = await signOutVisit(id);
      onToast(t("board.signOutToast", { name: visit.name }));
      onChanged();
    } catch (error) {
      onToast(error instanceof Error ? te(error.message) : t("board.signOutError"));
    }
  }

  async function signOutEveryone() {
    if (!window.confirm(t("board.signOutAllConfirm", { count: visits.length, campus }))) return;
    try {
      const count = await signOutAll(campus);
      onToast(
        count === 1
          ? t("board.signOutAllToast", { count })
          : t("board.signOutAllToastPlural", { count }),
      );
      onChanged();
    } catch (error) {
      onToast(error instanceof Error ? te(error.message) : t("board.signOutAllError"));
    }
  }

  const staleCount = visits.filter((visit) => isStale(visit.signedInAt)).length;

  return (
    <div className="card">
      <div className="board-head">
        <h2>{t("board.onSite")}</h2>
        <span className="count">
          {visits.length} {visits.length === 1 ? t("board.visitor") : t("board.visitors")}
        </span>
      </div>

      {staleCount > 0 ? (
        <div className="stale-banner">
          {staleCount === 1
            ? t("board.stale", { count: staleCount, hours: STALE_HOURS })
            : t("board.stalePlural", { count: staleCount, hours: STALE_HOURS })}
        </div>
      ) : null}

      {visits.length > 0 ? (
        <div className="board-actions no-print">
          <button type="button" className="ghost-btn" onClick={() => void signOutEveryone()}>
            {t("board.signOutAll")}
          </button>
        </div>
      ) : null}

      <div className="visitor-list">
        {visits.length === 0 ? (
          <div className="empty">{t("board.empty")}</div>
        ) : (
          visits.map((visit) => (
            <div
              className={`visitor-row${isStale(visit.signedInAt) ? " visitor-row--stale" : ""}`}
              key={visit.id}
            >
              <div className="avatar">
                {visit.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={visit.photo} alt="" />
                ) : (
                  initials(visit.name)
                )}
              </div>
              <div className="visitor-info">
                <div className="name">{visit.name}</div>
                <div className="meta">
                  {purposeLabel(visit.purpose)} · {t("board.visiting")} {visit.host}
                  {visit.source === "self" ? ` · ${t("board.selfTag")}` : ""}
                  {isStale(visit.signedInAt) ? ` · ${t("board.longStay")}` : ""}
                </div>
              </div>
              <div className="visitor-time">{t("board.inTime", { time: formatTime(visit.signedInAt) })}</div>
              <button type="button" className="signout-btn" onClick={() => signOut(visit.id)}>
                {t("board.signOut")}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
