"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { useAppPreferences } from "@/lib/i18n/context";
import { CAMPUS_HUB } from "@/lib/campus-routes";

export function HomePageContent() {
  const { t } = useAppPreferences();

  return (
    <div className="hub-shell">
      <div className="hub-hero">
        <BrandLogo variant="brandmark" height={52} priority />
        <h1>{t("home.title")}</h1>
        <p>{t("home.subtitle")}</p>
      </div>
      <div className="campus-hub-grid">
        {CAMPUS_HUB.map((campus) => (
          <Link
            key={campus.slug}
            href={campus.href}
            className="campus-hub-card card"
            style={{ background: campus.gradient }}
          >
            <span className="campus-hub-name">{campus.name}</span>
            <span className="campus-hub-cta">{t("home.openDesk")}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
