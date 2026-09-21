"use client";

import { useEffect, useState } from "react";
import { useAppPreferences } from "@/lib/i18n/context";
import { BrandLogo } from "./BrandLogo";

function withCampusParam(url: string, campusSlug?: string): string {
  if (!campusSlug) return url;
  const parsed = new URL(url);
  parsed.searchParams.set("campus", campusSlug);
  return parsed.toString();
}

export function QrPoster({
  checkInUrl,
  qrDataUrl,
  campusSlug,
  campusName,
}: {
  checkInUrl?: string;
  qrDataUrl?: string;
  campusSlug?: string;
  campusName?: string;
}) {
  const { t } = useAppPreferences();
  const [href, setHref] = useState(checkInUrl ?? "");
  const [qr, setQr] = useState(qrDataUrl ?? "");
  const [health, setHealth] = useState<{ ok: boolean; message: string } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function refresh() {
      try {
        const [urlRes, healthRes] = await Promise.all([
          fetch("/api/check-in-url", { cache: "no-store" }),
          fetch("/api/tunnel-health", { cache: "no-store" }),
        ]);
        const urlPayload = (await urlRes.json()) as { url: string };
        const healthPayload = (await healthRes.json()) as { ok: boolean; message: string };
        const resolved = withCampusParam(urlPayload.url, campusSlug);
        setHref(resolved);
        setHealth(healthPayload);
        if (!qrDataUrl) {
          const qrParams = new URLSearchParams({ t: resolved });
          if (campusSlug) qrParams.set("campus", campusSlug);
          setQr(`/api/qr?${qrParams.toString()}`);
        }
      } catch {
        setHealth({ ok: false, message: t("qr.tunnelError") });
      }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => window.clearInterval(timer);
  }, [qrDataUrl, campusSlug]);

  async function copyLink() {
    if (!href) return;
    await navigator.clipboard.writeText(href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const qrSrc = qrDataUrl || qr;

  return (
    <div className="qr-single-layout">
      <div className="card qr-single-card">
        <div className="qr-single-banner">
          <BrandLogo variant="white" height={36} />
          <h2>{t("qr.selfCheckIn")}</h2>
          <p>
            {campusName
              ? t("qr.scanCampus", { campus: campusName })
              : t("qr.scanAll")}
          </p>
        </div>

        {health && !health.ok ? (
          <div className="qr-error-banner">
            <strong>{t("qr.tunnelOffline")}</strong>
            <p>{health.message}</p>
            <p>{t("qr.tunnelHint")}</p>
          </div>
        ) : null}

        {health?.ok ? (
          <div className="qr-live-banner">{t("qr.liveBanner")}</div>
        ) : null}

        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={href}
            src={qrSrc}
            alt={t("qr.qrAlt")}
            width={320}
            height={320}
          />
        ) : (
          <p>{t("qr.generating")}</p>
        )}

        {href ? (
          <div className="qr-link-box">
            <span className="qr-link-label">{t("qr.linkLabel")}</span>
            <a href={href} className="qr-link-strong" target="_blank" rel="noopener noreferrer">
              {href}
            </a>
            <button type="button" className="ghost-btn qr-copy-btn" onClick={() => void copyLink()}>
              {copied ? t("qr.copied") : t("qr.copyLink")}
            </button>
          </div>
        ) : null}

        <div className="qr-network-hint">
          <strong>{t("qr.noReuse")}</strong> {t("qr.noReuseDetail")}
        </div>
      </div>
    </div>
  );
}
