"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CampusPills } from "@/components/CampusPills";
import { SignInForm } from "@/components/SignInForm";
import { CAMPUS_NAMES, Campus, CampusName } from "@/domain/Campus";
import { campusFromSlug } from "@/lib/campus-routes";
import { useAppPreferences } from "@/lib/i18n/context";

function resolvePresetCampus(param: string | null): CampusName | undefined {
  if (!param) return undefined;
  const fromSlug = campusFromSlug(param);
  if (fromSlug) return fromSlug.name;
  return Campus.tryParse(param)?.name;
}

function CheckInInner() {
  const { t } = useAppPreferences();
  const params = useSearchParams();
  const presetCampus = resolvePresetCampus(params.get("campus"));
  const presetVehicle = params.get("vehicle")?.trim() ?? "";
  const [campus, setCampus] = useState<CampusName>(presetCampus ?? CAMPUS_NAMES[0]);

  return (
    <div className="checkin-shell">
      <Link href="/" className="checkin-home-link">
        {t("checkIn.homeLink")}
      </Link>
      <div className="hero-banner">
        <BrandLogo variant="white" height={36} priority />
        <h1>{t("checkIn.welcome")}</h1>
        <p>{t("checkIn.subtitle")}</p>
      </div>
      <hr className="gold-rule" />
      <div className="checkin-campus-picker">
        <label>{t("checkIn.whichCampus")}</label>
        <CampusPills value={campus} onChange={setCampus} />
      </div>
      <SignInForm campus={campus} source="self" initialVehicleReg={presetVehicle} />
    </div>
  );
}

function CheckInLoading() {
  const { t } = useAppPreferences();
  return <div className="checkin-shell">{t("checkIn.loading")}</div>;
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<CheckInLoading />}>
      <CheckInInner />
    </Suspense>
  );
}
