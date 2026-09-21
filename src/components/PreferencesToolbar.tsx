"use client";

import { LOCALE_LABELS, type Locale, type Theme } from "@/lib/i18n/messages";
import { useAppPreferences } from "@/lib/i18n/context";

export function PreferencesToolbar() {
  const { locale, theme, setLocale, setTheme, t } = useAppPreferences();

  return (
    <div className="prefs-toolbar" role="region" aria-label={t("prefs.language")}>
      <label className="prefs-group">
        <span className="prefs-label">{t("prefs.language")}</span>
        <select
          className="prefs-select"
          value={locale}
          onChange={(event) => setLocale(event.target.value as Locale)}
          aria-label={t("prefs.language")}
        >
          {(Object.keys(LOCALE_LABELS) as Locale[]).map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
      </label>
      <div className="prefs-group prefs-theme" role="group" aria-label={t("prefs.theme")}>
        <span className="prefs-label">{t("prefs.theme")}</span>
        <button
          type="button"
          className={`prefs-toggle${theme === "light" ? " active" : ""}`}
          onClick={() => setTheme("light" as Theme)}
        >
          {t("prefs.light")}
        </button>
        <button
          type="button"
          className={`prefs-toggle${theme === "dark" ? " active" : ""}`}
          onClick={() => setTheme("dark" as Theme)}
        >
          {t("prefs.dark")}
        </button>
      </div>
    </div>
  );
}
