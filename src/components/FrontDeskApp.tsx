"use client";

import { useEffect, useState } from "react";
import { VisitRecord } from "@/domain/Visit";
import { localDateKey } from "@/lib/date-key";
import { fetchVisits } from "@/lib/visits-client";
import { useAppPreferences } from "@/lib/i18n/context";
import { SignInForm } from "./SignInForm";
import { SiteHeader } from "./SiteHeader";
import { VisitorBoard } from "./VisitorBoard";

export function FrontDeskApp({ campus }: { campus: string }) {
  const { t, te } = useAppPreferences();
  const [visits, setVisits] = useState<VisitRecord[]>([]);
  const [toast, setToast] = useState("");
  const [error, setError] = useState("");

  async function refresh() {
    try {
      setError("");
      setVisits(await fetchVisits({ campus, date: localDateKey(), onSite: true }));
    } catch (err) {
      setError(err instanceof Error ? te(err.message) : t("desk.refreshError"));
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
        title={t("desk.title")}
        subtitle={t("desk.subtitle", { campus })}
        active="desk"
      />
      <div className="grid">
        <SignInForm
          campus={campus}
          source="desk"
          onSignedIn={(name) => {
            showToast(t("desk.signedInToast", { name }));
            void refresh();
          }}
        />
        <VisitorBoard
          campus={campus}
          visits={visits}
          onChanged={() => void refresh()}
          onToast={showToast}
        />
      </div>
      {error ? <p className="form-msg err">{error}</p> : null}
      <p className="footnote">{t("desk.footnote")}</p>
      <div className={`toast${toast ? " show" : ""}`}>{toast}</div>
    </div>
  );
}
