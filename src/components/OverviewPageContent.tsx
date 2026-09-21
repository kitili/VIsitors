"use client";

import Link from "next/link";
import { BrandLogo } from "@/components/BrandLogo";
import { NetworkOverview } from "@/components/NetworkOverview";
import { useAppPreferences } from "@/lib/i18n/context";

export function OverviewPageContent() {
  const { t } = useAppPreferences();

  return (
    <div className="wrap">
      <header className="site-header">
        <Link href="/" className="brand-lockup">
          <BrandLogo variant="brandmark" height={44} priority />
          <div className="brand-copy">
            <h1>{t("overview.title")}</h1>
            <p>{t("overview.subtitle")}</p>
          </div>
        </Link>
        <div className="nav-row">
          <Link href="/" className="ghost-btn hub-link">
            {t("nav.allCampuses")}
          </Link>
          <Link href="/check-out" className="ghost-btn">
            {t("overview.checkOut")}
          </Link>
        </div>
      </header>
      <NetworkOverview />
    </div>
  );
}
