"use client";

import Link from "next/link";
import { BrandLogo } from "./BrandLogo";
import { campusPath } from "@/lib/campus-routes";
import type { CampusName } from "@/domain/Campus";
import { useAppPreferences } from "@/lib/i18n/context";

export function SiteHeader({
  title,
  subtitle,
  active,
  campus,
  extra,
}: {
  title: string;
  subtitle: string;
  active: "desk" | "history" | "qr" | "check-in";
  campus: string;
  extra?: React.ReactNode;
}) {
  const { t } = useAppPreferences();
  const links = [
    { href: campusPath(campus as CampusName, "desk"), label: t("nav.frontDesk"), key: "desk" as const },
    { href: campusPath(campus as CampusName, "history"), label: t("nav.history"), key: "history" as const },
    { href: campusPath(campus as CampusName, "qr"), label: t("nav.qrPosters"), key: "qr" as const },
  ];

  return (
    <header className="site-header">
      <Link href="/" className="brand-lockup">
        <BrandLogo variant="brandmark" height={44} priority />
        <div className="brand-copy">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </Link>
      <div className="nav-row">
        <div className="campus-badge" data-campus={campus}>
          {campus}
        </div>
        <nav className="view-toggle" aria-label={t("nav.visitorLogViews")}>
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={active === link.key ? "active" : undefined}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/" className="ghost-btn hub-link">
          {t("nav.allCampuses")}
        </Link>
        {extra}
      </div>
    </header>
  );
}
