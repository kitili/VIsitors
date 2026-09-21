"use client";

import { DashboardView } from "@/components/DashboardView";
import { SiteHeader } from "@/components/SiteHeader";
import { useAppPreferences } from "@/lib/i18n/context";

export function CampusHistoryShell({ campus }: { campus: string }) {
  const { t } = useAppPreferences();

  return (
    <div className="wrap campus-themed" data-campus={campus}>
      <SiteHeader
        campus={campus}
        title={t("history.title")}
        subtitle={t("history.subtitle", { campus })}
        active="history"
      />
      <DashboardView campus={campus} />
    </div>
  );
}
