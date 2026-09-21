"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CampusPills } from "@/components/CampusPills";
import { PhoneField } from "@/components/PhoneField";
import { CAMPUS_NAMES, CampusName } from "@/domain/Campus";
import { checkOutByPhone } from "@/lib/visits-client";

export default function CheckOutPage() {
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
      setMessage(err instanceof Error ? err.message : "Could not check out.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="checkin-shell">
      <Link href="/" className="checkin-home-link">
        ← Silverleaf campuses
      </Link>
      <div className="hero-banner">
        <BrandLogo variant="white" height={36} priority />
        <h1>Check out</h1>
        <p>Sign yourself out when leaving Silverleaf Academy</p>
      </div>
      <hr className="gold-rule" />

      {done ? (
        <div className="checkin-card card success-panel">
          <h2>Goodbye, {done}</h2>
          <p className="sub">You have been signed out. Safe travels.</p>
          <button type="button" className="primary-btn" onClick={() => setDone("")}>
            Check out another visitor
          </button>
        </div>
      ) : (
        <form className="checkin-card card" onSubmit={onSubmit}>
          <h2>Sign yourself out</h2>
          <p className="sub">Enter the phone number you used when signing in.</p>

          <label>Campus</label>
          <CampusPills value={campus} onChange={setCampus} />

          <PhoneField id="coPhone" value={phone} onChange={setPhone} />

          <button className="submit-btn" type="submit" disabled={busy}>
            {busy ? "Checking out…" : "Check out"}
          </button>
          <div className={`form-msg${error ? " err" : ""}`}>{message}</div>
        </form>
      )}
    </div>
  );
}
