"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CampusPills } from "@/components/CampusPills";
import { PhoneField } from "@/components/PhoneField";
import { CAMPUS_NAMES, CampusName } from "@/domain/Campus";
import { checkOutByPhone } from "@/lib/visits-client";
import { useAppPreferences } from "@/lib/i18n/context";

export default function CheckOutPage() {
  const { t, te } = useAppPreferences();
  const [campus, setCampus] = useState<CampusName>(CAMPUS_NAMES[0]);
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState("");
  const [error, setError] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(false);
    setMessage("");
    try {
      const visit = await checkOutByPhone(phone, campus);
      setDone(visit.name);
      setPhone("");
    } catch (err) {
      setError(true);
      setMessage(err instanceof Error ? te(err.message) : t("checkOut.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="checkin-shell">
      <Link href="/" className="checkin-home-link">
        {t("checkOut.homeLink")}
      </Link>
      <div className="hero-banner">
        <BrandLogo variant="white" height={36} priority />
        <h1>{t("checkOut.title")}</h1>
        <p>{t("checkOut.heroSub")}</p>
      </div>
      <hr className="gold-rule" />

      {done ? (
        <div className="checkin-card card success-panel">
          <h2>{t("checkOut.goodbye", { name: done })}</h2>
          <p className="sub">{t("checkOut.signedOut")}</p>
          <button type="button" className="primary-btn" onClick={() => setDone("")}>
            {t("checkOut.another")}
          </button>
        </div>
      ) : (
        <form className="checkin-card card" onSubmit={onSubmit}>
          <h2>{t("checkOut.formTitle")}</h2>
          <p className="sub">{t("checkOut.formSub")}</p>

          <label>{t("checkOut.campus")}</label>
          <CampusPills value={campus} onChange={setCampus} />

          <PhoneField id="coPhone" value={phone} onChange={setPhone} />

          <button className="submit-btn" type="submit" disabled={busy}>
            {busy ? t("checkOut.checking") : t("checkOut.submit")}
          </button>
          <div className={`form-msg${error ? " err" : ""}`}>{message}</div>
        </form>
      )}
    </div>
  );
}
