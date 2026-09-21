"use client";

import { useEffect, useState } from "react";
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
        setHealth({ ok: false, message: "Could not verify tunnel. Run npm run tunnel." });
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
          <h2>Visitor self check-in</h2>
          <p>
            {campusName
              ? `Scan to sign in at ${campusName}`
              : "Scan to open the sign-in form · all campuses"}
          </p>
        </div>

        {health && !health.ok ? (
          <div className="qr-error-banner">
            <strong>Tunnel offline</strong>
            <p>{health.message}</p>
            <p>
              In the project folder run: <code>npm run tunnel</code> then refresh this page and
              scan again.
            </p>
          </div>
        ) : null}

        {health?.ok ? (
          <div className="qr-live-banner">Live — scan this QR on any network</div>
        ) : null}

        {qrSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={href}
            src={qrSrc}
            alt="QR code for Silverleaf visitor self check-in"
            width={320}
            height={320}
          />
        ) : (
          <p>Generating QR…</p>
        )}

        {href ? (
          <div className="qr-link-box">
            <span className="qr-link-label">Link inside this QR code</span>
            <a href={href} className="qr-link-strong" target="_blank" rel="noopener noreferrer">
              {href}
            </a>
            <button type="button" className="ghost-btn qr-copy-btn" onClick={() => void copyLink()}>
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>
        ) : null}

        <div className="qr-network-hint">
          <strong>Do not reuse old QR screenshots.</strong> The link changes when the tunnel
          restarts. Always use this page for the current code.
        </div>
      </div>
    </div>
  );
}
