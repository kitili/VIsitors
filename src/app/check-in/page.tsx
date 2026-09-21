"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { BrandLogo } from "@/components/BrandLogo";
import { CampusPills } from "@/components/CampusPills";
import { SignInForm } from "@/components/SignInForm";
import { CAMPUS_NAMES, Campus, CampusName } from "@/domain/Campus";
import { campusFromSlug } from "@/lib/campus-routes";

function resolvePresetCampus(param: string | null): CampusName | undefined {
  if (!param) return undefined;
  const fromSlug = campusFromSlug(param);
  if (fromSlug) return fromSlug.name;
  return Campus.tryParse(param)?.name;
}

function CheckInInner() {
  const params = useSearchParams();
  const presetCampus = resolvePresetCampus(params.get("campus"));
  const [campus, setCampus] = useState<CampusName>(presetCampus ?? CAMPUS_NAMES[0]);

  return (
    <div className="checkin-shell">
      <Link href="/" className="checkin-home-link">
        ← Silverleaf campuses
      </Link>
      <div className="hero-banner">
        <BrandLogo variant="white" height={36} priority />
        <h1>Welcome</h1>
        <p>Silverleaf Academy visitor check-in</p>
      </div>
      <hr className="gold-rule" />
      <div className="checkin-campus-picker">
        <label>Which campus are you visiting?</label>
        <CampusPills value={campus} onChange={setCampus} />
      </div>
      <SignInForm campus={campus} source="self" />
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<div className="checkin-shell">Loading check-in…</div>}>
      <CheckInInner />
    </Suspense>
  );
}
