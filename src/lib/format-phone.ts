/** Format stored phone digits for display (mirrors PhoneNumber.display). */
export function formatPhone(digits: string): string {
  if (digits.length === 10 && digits.startsWith("0")) {
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
  }
  if (digits.length === 12 && digits.startsWith("255")) {
    return `+${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`;
  }
  return digits;
}
