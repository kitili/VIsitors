"use client";

import { FormEvent, useEffect, useState } from "react";
import { WatchlistEntry } from "@/repositories/WatchlistRepository";
import { formatPhone } from "@/lib/format-phone";
import {
  addWatchlistEntry,
  fetchWatchlist,
  removeWatchlistEntry,
} from "@/lib/visits-client";

export function WatchlistPanel() {
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
      setError(err instanceof Error ? err.message : "Could not load watchlist."),
    );
  }, []);

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
      setError(err instanceof Error ? err.message : "Could not add entry.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: number) {
    try {
      await removeWatchlistEntry(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove entry.");
    }
  }

  return (
    <div className="card watchlist-panel">
      <h2>Safety watchlist</h2>
      <p className="sub">
        Visitors matching a name or phone on this list are blocked at sign-in. Contact leadership
        before allowing entry.
      </p>

      <form className="watchlist-form" onSubmit={onSubmit}>
        <input type="text" placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} />
        <input
          type="tel"
          placeholder="Phone (optional)"
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
        />
        <input
          type="text"
          placeholder="Reason — required"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          required
        />
        <button type="submit" className="ghost-btn" disabled={busy}>
          Add to watchlist
        </button>
      </form>

      {error ? <p className="form-msg err">{error}</p> : null}

      <ul className="watchlist-list">
        {entries.length === 0 ? (
          <li className="empty">No watchlist entries yet.</li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="watchlist-item">
              <div>
                <strong>{entry.name || "Unknown name"}</strong>
                {entry.phone ? ` · ${formatPhone(entry.phone)}` : ""}
                <div className="watchlist-reason">{entry.reason}</div>
              </div>
              <button type="button" className="ghost-btn" onClick={() => void remove(entry.id)}>
                Remove
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
