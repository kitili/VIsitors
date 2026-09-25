import { ValidationError } from "./errors";

export function normalizeVehicleReg(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) return null;
  const normalized = trimmed.toUpperCase().replace(/\s+/g, " ");
  if (normalized.length > 20) {
    throw new ValidationError("Vehicle registration is too long.");
  }
  return normalized;
}
