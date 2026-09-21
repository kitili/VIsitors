import { VISIT_PURPOSES, type VisitPurposeName } from "@/domain/VisitPurpose";
import type { Locale } from "./messages";

const PURPOSE_KEYS: Record<
  VisitPurposeName,
  "official" | "admission" | "pickup" | "dropoff" | "visitingDay" | "event"
> = {
  "Official Office visit": "official",
  "Student admission inquiry": "admission",
  "Picking up student": "pickup",
  "Dropping off Student": "dropoff",
  "Student visiting day": "visitingDay",
  "Event attendance": "event",
};

export function purposeLabel(purpose: string, locale: Locale, t: (key: string) => string): string {
  void locale;
  const key = PURPOSE_KEYS[purpose as VisitPurposeName];
  if (!key) return purpose;
  return t(`purposes.${key}`);
}

export { VISIT_PURPOSES };
