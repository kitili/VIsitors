"use client";

import { PhoneNumber } from "@/domain/PhoneNumber";
import { useAppPreferences } from "@/lib/i18n/context";

export function PhoneField({
  id,
  value,
  onChange,
  onBlur,
}: {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  onBlur?: () => void;
}) {
  const { t } = useAppPreferences();

  return (
    <>
      <label htmlFor={id}>{t("phone.label")}</label>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        pattern="[0-9]*"
        maxLength={15}
        placeholder="0754000000"
        required
        value={value}
        onChange={(event) => onChange(PhoneNumber.digitsOnly(event.target.value))}
        onKeyDown={(event) => {
          const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
          if (allowed.includes(event.key) || event.ctrlKey || event.metaKey) return;
          if (!/^\d$/.test(event.key)) event.preventDefault();
        }}
        onPaste={(event) => {
          event.preventDefault();
          onChange(PhoneNumber.digitsOnly(event.clipboardData.getData("text")));
        }}
        onBlur={onBlur}
      />
      <div className="field-hint">{t("phone.hint")}</div>
    </>
  );
}
