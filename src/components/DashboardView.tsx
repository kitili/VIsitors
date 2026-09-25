"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { VisitRecord } from "@/domain/Visit";
import { localDateKey } from "@/lib/date-key";
import { formatPhone } from "@/lib/format-phone";
import { fetchVisits } from "@/lib/visits-client";
import { useAppPreferences } from "@/lib/i18n/context";
import { VisitCsvExporter } from "@/services/VisitCsvExporter";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDuration(signedInAt: string, signedOutAt: string | null, stillOnSite: string) {
  if (!signedOutAt) return stillOnSite;
  const mins = Math.round((new Date(signedOutAt).getTime() - new Date(signedInAt).getTime()) / 60000);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hours}h ${rem}m` : `${hours}h`;
}

function formatUpdated(at: Date) {
  return at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

type DatePreset = "today" | "yesterday" | "week" | "month" | "all";

function presetRange(preset: DatePreset): { from: string; to: string } {
  const today = localDateKey();
  if (preset === "today") return { from: today, to: today };
  if (preset === "yesterday") {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const key = localDateKey(d);
    return { from: key, to: key };
  }
  if (preset === "week") {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return { from: localDateKey(d), to: today };
  }
  if (preset === "month") {
    const d = new Date();
    d.setDate(d.getDate() - 29);
    return { from: localDateKey(d), to: today };
  }
  return { from: "2020-01-01", to: today };
}

export function DashboardView({ campus }: { campus: string }) {
  const { t, te, purposeLabel } = useAppPreferences();
  const [dateFrom, setDateFrom] = useState(localDateKey());
  const [dateTo, setDateTo] = useState(localDateKey());
  const [activePreset, setActivePreset] = useState<DatePreset>("today");
  const [status, setStatus] = useState<"all" | "on-site" | "left">("all");
  const [source, setSource] = useState<"all" | "desk" | "self">("all");
  const [allVisits, setAllVisits] = useState<VisitRecord[]>([]);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState("");
  const mountedRef = useRef(true);

  const dateError = dateFrom > dateTo ? t("history.dateError") : "";

  const visits = useMemo(() => {
    let rows = allVisits;
    if (status === "on-site") rows = rows.filter((visit) => !visit.signedOutAt);
    if (status === "left") rows = rows.filter((visit) => visit.signedOutAt);
    if (source !== "all") rows = rows.filter((visit) => visit.source === source);
    return rows;
  }, [allVisits, status, source]);

  const rangeStats = useMemo(
    () => ({
      total: allVisits.length,
      onSite: allVisits.filter((visit) => !visit.signedOutAt).length,
      self: allVisits.filter((visit) => visit.source === "self").length,
      desk: allVisits.filter((visit) => visit.source === "desk").length,
    }),
    [allVisits],
  );

  const filteredStats = useMemo(
    () => ({
      total: visits.length,
      onSite: visits.filter((visit) => !visit.signedOutAt).length,
      self: visits.filter((visit) => visit.source === "self").length,
      desk: visits.filter((visit) => visit.source === "desk").length,
    }),
    [visits],
  );

  const hasExtraFilters = status !== "all" || source !== "all" || search.trim().length > 0;
  const stats = hasExtraFilters ? filteredStats : rangeStats;

  const load = useCallback(
    async (silent = false) => {
      if (dateError) return;
      try {
        setError("");
        if (silent) {
          setRefreshing(true);
        } else {
          setInitialLoading(true);
        }
        const rows = await fetchVisits({
          campus,
          dateFrom,
          dateTo,
          search: search.trim() || undefined,
        });
        if (!mountedRef.current) return;
        setAllVisits(rows);
        setLastUpdated(new Date());
      } catch (err) {
        if (!mountedRef.current) return;
        setError(err instanceof Error ? te(err.message) : t("history.loadError"));
      } finally {
        if (!mountedRef.current) return;
        setInitialLoading(false);
        setRefreshing(false);
      }
    },
    [campus, dateFrom, dateTo, search, dateError, te, t],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearch(searchInput), 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    void load(false);
    const timer = setInterval(() => void load(true), 3000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible") {
        void load(true);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

  function applyPreset(preset: DatePreset) {
    const range = presetRange(preset);
    setActivePreset(preset);
    setDateFrom(range.from);
    setDateTo(range.to);
  }

  function clearFilters() {
    setStatus("all");
    setSource("all");
    setSearchInput("");
    setSearch("");
    applyPreset("today");
  }

  function exportCsv() {
    if (visits.length === 0) return;
    const csv = new VisitCsvExporter().export(visits);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `visitor-log-${campus.replace(/\s+/g, "-").toLowerCase()}-${dateFrom}-to-${dateTo}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const filterSummary = [
    `${dateFrom === dateTo ? dateFrom : `${dateFrom} → ${dateTo}`}`,
    status === "all" ? null : status === "on-site" ? t("history.filterOnSite") : t("history.filterSignedOut"),
    source === "all" ? null : source === "desk" ? t("history.filterDesk") : t("history.filterQr"),
    search.trim() ? t("history.filterSearch", { query: search.trim() }) : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="history-live-bar">
        <span className={`live-dot${refreshing ? " live-dot--pulse" : ""}`} aria-hidden />
        <span>
          {initialLoading
            ? t("history.loading")
            : lastUpdated
              ? t("history.liveUpdated", { time: formatUpdated(lastUpdated) })
              : t("history.live")}
        </span>
        <button type="button" className="ghost-btn history-refresh-btn" onClick={() => void load(true)}>
          {t("history.refreshNow")}
        </button>
      </div>

      <div className="history-presets">
        {(
          [
            ["today", t("history.today")],
            ["yesterday", t("history.yesterday")],
            ["week", t("history.week")],
            ["month", t("history.month")],
            ["all", t("history.allTime")],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`preset-btn${activePreset === key ? " active" : ""}`}
            onClick={() => applyPreset(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="stat-row">
        <div className="stat-card stat-card--blue">
          <div className="num">{stats.total}</div>
          <div className="label">
            {hasExtraFilters ? t("history.matchingFilters") : t("history.totalVisits", { campus })}
          </div>
        </div>
        <div className="stat-card stat-card--gold">
          <div className="num">{stats.onSite}</div>
          <div className="label">{t("history.onSiteNow")}</div>
        </div>
        <div className="stat-card stat-card--green">
          <div className="num">{stats.self}</div>
          <div className="label">{t("history.qrCheckIns")}</div>
        </div>
        <div className="stat-card stat-card--navy">
          <div className="num">{stats.desk}</div>
          <div className="label">{t("history.deskCheckIns")}</div>
        </div>
      </div>

      {hasExtraFilters && rangeStats.total !== filteredStats.total ? (
        <p className="history-range-note">
          {t("history.filterNote", { filtered: filteredStats.total, total: rangeStats.total })}
        </p>
      ) : null}

      <div className="dash-controls card dash-filters">
        <div className="filter-group">
          <label htmlFor="dateFrom">{t("history.from")}</label>
          <input
            id="dateFrom"
            type="date"
            value={dateFrom}
            onChange={(event) => {
              setActivePreset("all");
              setDateFrom(event.target.value);
            }}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="dateTo">{t("history.to")}</label>
          <input
            id="dateTo"
            type="date"
            value={dateTo}
            onChange={(event) => {
              setActivePreset("all");
              setDateTo(event.target.value);
            }}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="status">{t("history.status")}</label>
          <select id="status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">{t("history.allVisitors")}</option>
            <option value="on-site">{t("history.onSite")}</option>
            <option value="left">{t("history.signedOut")}</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="source">{t("history.checkInType")}</label>
          <select id="source" value={source} onChange={(event) => setSource(event.target.value as typeof source)}>
            <option value="all">{t("history.allTypes")}</option>
            <option value="desk">{t("history.frontDesk")}</option>
            <option value="self">{t("history.filterQr")}</option>
          </select>
        </div>
        <div className="filter-group filter-group--wide">
          <label htmlFor="search">{t("history.search")}</label>
          <input
            id="search"
            type="search"
            placeholder={t("history.searchPlaceholder")}
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
          />
        </div>
        <button type="button" className="ghost-btn" onClick={clearFilters}>
          {t("history.clearFilters")}
        </button>
        <button type="button" className="export-btn" onClick={exportCsv} disabled={visits.length === 0}>
          {visits.length === 1
            ? t("history.exportRows", { count: visits.length })
            : t("history.exportRowsPlural", { count: visits.length })}
        </button>
      </div>

      <div className="history-summary-bar">
        <span>
          {initialLoading
            ? t("history.loadingShort")
            : visits.length === 1
              ? t("history.visitorsShown", { count: visits.length })
              : t("history.visitorsShownPlural", { count: visits.length })}
        </span>
        <span className="history-filter-tags">{filterSummary}</span>
      </div>

      {dateError ? <p className="form-msg err">{dateError}</p> : null}
      {error ? <p className="form-msg err">{error}</p> : null}

      <div className={`dash-table-wrap${refreshing ? " dash-table-wrap--refreshing" : ""}`}>
        <table className="dash-table">
          <thead>
            <tr>
              <th>{t("history.colVisitor")}</th>
              <th>{t("history.colPurpose")}</th>
              <th>{t("history.colHost")}</th>
              <th>{t("history.colVehicle")}</th>
              <th>{t("history.colSource")}</th>
              <th>{t("history.colDate")}</th>
              <th>{t("history.colSignedIn")}</th>
              <th>{t("history.colSignedOut")}</th>
              <th>{t("history.colDuration")}</th>
              <th>{t("history.colStatus")}</th>
            </tr>
          </thead>
          <tbody>
            {initialLoading ? (
              <tr>
                <td colSpan={10} className="history-empty">
                  {t("history.loadingTable")}
                </td>
              </tr>
            ) : visits.length === 0 ? (
              <tr>
                <td colSpan={10} className="history-empty">
                  {dateError ? t("history.fixDateRange") : hasExtraFilters ? t("history.noMatch") : t("history.noVisits")}
                </td>
              </tr>
            ) : (
              visits.map((visit) => (
                <tr key={visit.id}>
                  <td>
                    <div className="history-visitor">
                      <div className="avatar small">
                        {visit.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={visit.photo} alt="" />
                        ) : (
                          visit.name.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div>
                        <div className="history-name">{visit.name}</div>
                        <div className="history-phone">{formatPhone(visit.phone)}</div>
                      </div>
                    </div>
                  </td>
                  <td>{purposeLabel(visit.purpose)}</td>
                  <td>{visit.host}</td>
                  <td>{visit.vehicleReg ?? "—"}</td>
                  <td className="source-chip">
                    {visit.source === "self" ? t("history.filterQr") : t("history.frontDesk")}
                  </td>
                  <td>{formatDate(visit.signedInAt)}</td>
                  <td>{formatTime(visit.signedInAt)}</td>
                  <td>{visit.signedOutAt ? formatTime(visit.signedOutAt) : "—"}</td>
                  <td className="duration-cell">
                    {formatDuration(visit.signedInAt, visit.signedOutAt, t("history.stillOnSite"))}
                  </td>
                  <td>
                    <span className={`status-chip ${visit.signedOutAt ? "left" : "on-site"}`}>
                      {visit.signedOutAt ? t("history.left") : t("history.statusOnSite")}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
