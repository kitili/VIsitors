"use client";

import { useEffect, useState } from "react";
import { VisitRecord } from "@/domain/Visit";
import { localDateKey } from "@/lib/date-key";
import { fetchVisits } from "@/lib/visits-client";
import { SignInForm } from "./SignInForm";
import { SiteHeader } from "./SiteHeader";
import { VisitorBoard } from "./VisitorBoard";

export function FrontDeskApp({ campus }: { campus: string }) {
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setError("");
      setVisits(await fetchVisits({ campus, date: localDateKey(), onSite: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not refresh visitor board.");
    }
  }

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 4000);
    return () => clearInterval(timer);
  }, [campus]);

  function showToast(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  }

  return (
    <div className="wrap campus-themed" data-campus={campus}>
      <SiteHeader
        campus={campus}
        title="Visitor Log"
        subtitle={`Front desk for ${campus}. Sign visitors in or send them to the QR self check-in.`}
        active="desk"
      />
      <div className="grid">
        <SignInForm
          campus={campus}
          source="desk"
          onSignedIn={(name) => {
            showToast(`${name} signed in`);
            void refresh();
          }}
        />
        <VisitorBoard visits={visits} onChanged={() => void refresh()} onToast={showToast} />
      </div>
      {error ? <p className="form-msg err">{error}</p> : null}
      <p className="footnote">
        Silverleaf Academy · visitor photos are stored securely · history is available on the dashboard.
      </p>
      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
