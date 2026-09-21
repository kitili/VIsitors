"use client";

import { FormEvent, useEffect, useState } from "react";
import { WatchlistEntry } from "@/repositories/WatchlistRepository";
import { formatPhone } from "@/lib/format-phone";
import {
  addWatchlistEntry,
  fetchWatchlist,
  removeWatchlistEntry,
} from "@/lib/visits-client";
import { useAppPreferences } from "@/lib/i18n/context";

export function WatchlistPanel() {
  const { t, te } = useAppPreferences();
  const [entries, setEntries] = useState<WatchlistEntry[]>([]);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function load() {
    setEntries(await fetchWatchlist());
  }

  useEffect(() => {
    void load().catch((err) =>
      setError(err instanceof Error ? te(err.message) : t("watchlist.loadError")),
    );
  }, [t, te]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await addWatchlistEntry({ name: name || undefined, phone: phone || undefined, reason });
      setName("");
      setPhone("");
      setReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? te(err.message) : t("watchlist.addError"));
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await removeWatchlistEntry(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? te(err.message) : t("watchlist.removeError"));
    }
  }

  return (
    <div className="card watchlist-panel">
      <h2>{t("watchlist.title")}</h2>
      <p className="sub">{t("watchlist.sub")}</p>

      <form className="watchlist-form" onSubmit={onSubmit}>
        <input
          type="text"
          placeholder={t("watchlist.namePh")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="tel"
          placeholder={t("watchlist.phonePh")}
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
        />
        <input
          type="text"
          placeholder={t("watchlist.reasonPh")}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <button type="submit" className="ghost-btn" disabled={busy}>
          {t("watchlist.add")}
        </button>
      </form>

      {error ? <p className="form-msg err">{error}</p> : null}

      <ul className="watchlist-list">
        {entries.length === 0 ? (
          <li className="empty">{t("watchlist.empty")}</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="watchlist-item">
              <div>
                <strong>{entry.name || t("watchlist.unknown")}</strong>
                {entry.phone ? ` · ${formatPhone(entry.phone)}` : ""}
                <div className="watchlist-reason">{entry.reason}</div>
              </div>
              <button type="button" className="ghost-btn" onClick={() => void remove(entry.id)}>
                {t("watchlist.remove")}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
