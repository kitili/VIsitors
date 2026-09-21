const TZ = "Africa/Dar_es_Salaam";

/** Local calendar date for Silverleaf campuses (East Africa Time). */
export function localDateKey(at = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);
}
