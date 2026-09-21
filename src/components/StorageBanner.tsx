"use client";

import { useEffect, useState } from "react";

type HealthPayload = {
  ok?: boolean;
  persistent?: boolean;
  warning?: string | null;
  setupUrl?: string | null;
};

export function StorageBanner() {
  const [warning, setWarning] = useState<string | null>(null);
  const [setupUrl, setSetupUrl] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch("/api/health", { cache: "no-store" });
        const payload = (await response.json()) as HealthPayload;
        if (!active || !response.ok || payload.persistent) return;
        setWarning(payload.warning ?? "Visitor data may not persist on this deployment.");
        setSetupUrl(payload.setupUrl ?? null);
      } catch {
        // Ignore — banner is optional.
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  if (!warning) return null;

  return (
    <div className="storage-banner" role="status">
      <strong>Storage not persistent.</strong> {warning}
      {setupUrl ? (
        <>
          {" "}
          <a href={setupUrl} target="_blank" rel="noopener noreferrer">
            Connect Turso on Vercel
          </a>
        </>
      ) : null}
    </div>
  );
}
