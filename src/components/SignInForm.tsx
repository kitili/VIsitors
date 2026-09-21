"use client";

import { FormEvent, useState } from "react";
import { VISIT_PURPOSES } from "@/domain/VisitPurpose";
import { VisitRecord } from "@/domain/Visit";
import { WatchlistEntry } from "@/repositories/WatchlistRepository";
import { createVisit, lookupVisitor } from "@/lib/visits-client";
import { PhoneField } from "./PhoneField";
import { PhotoCapture } from "./PhotoCapture";
import { VisitorBadge } from "./VisitorBadge";

export function SignInForm({
  campus,
  source,
  onSignedIn,
}: {
  campus: string;
  source: "desk" | "self";
  onSignedIn?: (name: string) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [host, setHost] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [completed, setCompleted] = useState("");
  const [deskVisit, setDeskVisit] = useState<VisitRecord | null>(null);
  const [watchlistHit, setWatchlistHit] = useState<WatchlistEntry | null>(null);
  const [autofillHint, setAutofillHint] = useState("");

  async function onPhoneBlur() {
    if (phone.replace(/\D/g, "").length < 9) return;
    try {
      const { visit, watchlist } = await lookupVisitor(phone, name);
      setWatchlistHit(watchlist);
      if (watchlist) return;
      if (visit && source === "desk") {
        if (!name) setName(visit.name);
        if (!host) setHost(visit.host);
        if (!purpose) setPurpose(visit.purpose);
        setAutofillHint(`Returning visitor — details filled from last visit.`);
      }
    } catch {
      setAutofillHint("");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (watchlistHit) {
      setError(true);
      setMessage(
        `Watchlist alert: ${watchlistHit.reason}. Contact school leadership before allowing entry.`,
      );
      return;
    }
    setBusy(true);
    setError(false);
    setMessage("");
    try {
      const visit = await createVisit({
        name,
        phone,
        purpose,
        host,
        campus,
        photo,
        source,
      });
      setName("");
      setPhone("");
      setPurpose("");
      setHost("");
      setPhoto(null);
      setAutofillHint("");
      setWatchlistHit(null);
      if (source === "self") {
        setCompleted(visit.name);
      } else {
        setDeskVisit(visit);
      }
      onSignedIn?.(visit.name);
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? err.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  if (deskVisit && source === "desk") {
    return (
      <VisitorBadge
        visit={deskVisit}
        onDone={() => {
          setDeskVisit(null);
        }}
      />
    );
  }

  if (completed && source === "self") {
    return (
      <div className="checkin-card card success-panel">
        <h2>You&apos;re signed in</h2>
        <p className="sub">
          Welcome to Silverleaf Academy, {completed}. Please wait at reception if you need a visitor badge.
        </p>
        <button type="button" className="primary-btn" onClick={() => setCompleted("")}>
          Sign in another visitor
        </button>
      </div>
    );
  }

  return (
    <form className={source === "self" ? "checkin-card card" : "signin-card card"} onSubmit={onSubmit}>
      <h2>{source === "self" ? "Sign yourself in" : "Sign in a visitor"}</h2>
      <p className="sub">{campus} campus</p>

      {watchlistHit ? (
        <div className="watchlist-alert">
          <strong>Watchlist alert</strong>
          <p>{watchlistHit.reason}</p>
          <p>Do not allow entry without contacting school leadership.</p>
        </div>
      ) : null}

      <label htmlFor="fName">Full name</label>
      <input
        id="fName"
        type="text"
        autoComplete="name"
        placeholder="e.g. Amina Joseph"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onBlur={() => void onPhoneBlur()}
        required
      />

      <PhoneField
        id="fPhone"
        value={phone}
        onChange={(digits) => {
          setPhone(digits);
          setWatchlistHit(null);
          setAutofillHint("");
        }}
        onBlur={() => void onPhoneBlur()}
      />
      {autofillHint ? <div className="field-hint">{autofillHint}</div> : null}

      <label htmlFor="fPurpose">Purpose of visit</label>
      <select
        id="fPurpose"
        value={purpose}
        onChange={(event) => setPurpose(event.target.value)}
        required
      >
        <option value="">Select a reason</option>
        {VISIT_PURPOSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>

      <label htmlFor="fHost">Person / office visiting</label>
      <input
        id="fHost"
        type="text"
        placeholder="e.g. Erick Anthony, Front Office"
        value={host}
        onChange={(event) => setHost(event.target.value)}
        required
      />

      {source === "desk" ? <PhotoCapture photo={photo} onCapture={setPhoto} /> : null}

      <button className="submit-btn" type="submit" disabled={busy || !!watchlistHit}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <div className={`form-msg${error ? " err" : ""}`}>{message}</div>
    </form>
  );
}
