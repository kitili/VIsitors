"use client";

import { VisitRecord } from "@/domain/Visit";
import { signOutAll, signOutVisit } from "@/lib/visits-client";

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
  async function signOut(id: string) {
    try {
      const visit = await signOutVisit(id);
      onToast(`Signed out ${visit.name}`);
      onChanged();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not sign out.");
    }
  }

  async function signOutEveryone() {
    if (!window.confirm(`Sign out all ${visits.length} visitors at ${campus}?`)) return;
    try {
      const count = await signOutAll(campus);
      onToast(`Signed out ${count} visitor${count === 1 ? "" : "s"}`);
      onChanged();
    } catch (error) {
      onToast(error instanceof Error ? error.message : "Could not sign out all.");
    }
  }

  const staleCount = visits.filter((visit) => isStale(visit.signedInAt)).length;

  return (
    <div className="card">
      <div className="board-head">
        <h2>On site now</h2>
        <span className="count">
          {visits.length} {visits.length === 1 ? "visitor" : "visitors"}
        </span>
      </div>

      {staleCount > 0 ? (
        <div className="stale-banner">
          {staleCount} visitor{staleCount === 1 ? "" : "s"} on site for over {STALE_HOURS} hours
        </div>
      ) : null}

      {visits.length > 0 ? (
        <div className="board-actions no-print">
          <button type="button" className="ghost-btn" onClick={() => void signOutEveryone()}>
            Sign out all today
          </button>
        </div>
      ) : null}

      <div className="visitor-list">
        {visits.length === 0 ? (
          <div className="empty">No one signed in yet at this campus today.</div>
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
                  {visit.purpose} · visiting {visit.host}
                  {visit.source === "self" ? " · self check-in" : ""}
                  {isStale(visit.signedInAt) ? " · long stay" : ""}
                </div>
              </div>
              <div className="visitor-time">In {formatTime(visit.signedInAt)}</div>
              <button type="button" className="signout-btn" onClick={() => signOut(visit.id)}>
                Sign out
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
