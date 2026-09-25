"use client";

import { FormEvent, useState } from "react";
import { VISIT_PURPOSES } from "@/domain/VisitPurpose";
import { VisitRecord } from "@/domain/Visit";
import { WatchlistEntry } from "@/repositories/WatchlistRepository";
import { createVisit, lookupVisitor } from "@/lib/visits-client";
import { useAppPreferences } from "@/lib/i18n/context";
import { PhoneField } from "./PhoneField";
import { PhotoCapture } from "./PhotoCapture";
import { VisitorBadge } from "./VisitorBadge";

export function SignInForm({
  campus,
  source,
  initialVehicleReg = "",
  onSignedIn,
}: {
  campus: string;
  source: "desk" | "self";
  initialVehicleReg?: string;
  onSignedIn?: (name: string) => void;
}) {
  const { t, te, purposeLabel } = useAppPreferences();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [purpose, setPurpose] = useState("");
  const [host, setHost] = useState("");
  const [vehicleReg, setVehicleReg] = useState(initialVehicleReg);
  const [photo, setPhoto] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const [selfVisit, setSelfVisit] = useState<VisitRecord | null>(null);
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
        if (!vehicleReg && visit.vehicleReg) setVehicleReg(visit.vehicleReg);
        setAutofillHint(t("signIn.returningHint"));
      }
    } catch {
      setAutofillHint("");
    }
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (watchlistHit) {
      setError(true);
      setMessage(t("signIn.watchlistAlert", { reason: watchlistHit.reason }));
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
        vehicleReg: vehicleReg.trim() || null,
        photo,
        source,
      });
      setName("");
      setPhone("");
      setPurpose("");
      setHost("");
      setVehicleReg(initialVehicleReg);
      setPhoto(null);
      setAutofillHint("");
      setWatchlistHit(null);
      if (source === "self") {
        setSelfVisit(visit);
      } else {
        setDeskVisit(visit);
      }
      onSignedIn?.(visit.name);
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? te(err.message) : t("signIn.error"));
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

  if (selfVisit && source === "self") {
    return (
      <VisitorBadge
        visit={selfVisit}
        showSuccessNote
        onDone={() => {
          setSelfVisit(null);
        }}
      />
    );
  }

  return (
    <form className={source === "self" ? "checkin-card card" : "signin-card card"} onSubmit={onSubmit}>
      <h2>{source === "self" ? t("signIn.selfTitle") : t("signIn.deskTitle")}</h2>
      <p className="sub">{t("signIn.campus", { campus })}</p>

      {watchlistHit ? (
        <div className="watchlist-alert">
          <strong>{t("signIn.watchlistTitle")}</strong>
          <p>{watchlistHit.reason}</p>
          <p>{t("signIn.watchlistBlock")}</p>
        </div>
      ) : null}

      <label htmlFor="fName">{t("signIn.fullName")}</label>
      <input
        id="fName"
        type="text"
        autoComplete="name"
        placeholder={t("signIn.namePlaceholder")}
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

      <label htmlFor="fPurpose">{t("signIn.purpose")}</label>
      <select
        id="fPurpose"
        value={purpose}
        onChange={(event) => setPurpose(event.target.value)}
        required
      >
        <option value="">{t("signIn.selectReason")}</option>
        {VISIT_PURPOSES.map((item) => (
          <option key={item} value={item}>
            {purposeLabel(item)}
          </option>
        ))}
      </select>

      <label htmlFor="fHost">{t("signIn.host")}</label>
      <input
        id="fHost"
        type="text"
        placeholder={t("signIn.hostPlaceholder")}
        value={host}
        onChange={(event) => setHost(event.target.value)}
        required
      />

      <label htmlFor="fVehicle">{t("signIn.vehicleReg")}</label>
      <input
        id="fVehicle"
        type="text"
        autoComplete="off"
        placeholder={t("signIn.vehiclePlaceholder")}
        value={vehicleReg}
        onChange={(event) => setVehicleReg(event.target.value)}
      />

      {source === "desk" ? <PhotoCapture photo={photo} onCapture={setPhoto} /> : null}

      <button className="submit-btn" type="submit" disabled={busy || !!watchlistHit}>
        {busy ? t("signIn.signing") : t("signIn.submit")}
      </button>
      <div className={`form-msg${error ? " err" : ""}`}>{message}</div>
    </form>
  );
}
