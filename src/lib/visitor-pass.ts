import type { VisitRecord } from "@/domain/types";

export function buildVisitorPassUrl(
  record: Pick<VisitRecord, "phone" | "campus" | "vehicleReg">,
  baseUrl: string,
): string {
  const base = baseUrl.replace(/\/$/, "");
  const params = new URLSearchParams({ phone: record.phone });
  params.set("campus", record.campus);
  if (record.vehicleReg) params.set("vehicle", record.vehicleReg);
  return `${base}/check-out?${params.toString()}`;
}
