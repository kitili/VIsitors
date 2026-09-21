"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { messages, type Locale, type Theme } from "./messages";
import { purposeLabel as getPurposeLabel } from "./purposes";
import { translate, translateApiError, type Params } from "./translate";

const LOCALE_KEY = "silverleaf-locale";
const THEME_KEY = "silverleaf-theme";

type AppPreferencesContextValue = {
  locale: Locale;
  theme: Theme;
  setLocale: (locale: Locale) => void;
  setTheme: (theme: Theme) => void;
  t: (key: string, params?: Params) => string;
  te: (message: string) => string;
  purposeLabel: (purpose: string) => string;
};

const AppPreferencesContext = createContext<AppPreferencesContextValue | null>(null);

function readStoredLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LOCALE_KEY);
  return stored === "sw" ? "sw" : "en";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(THEME_KEY);
  return stored === "dark" ? "dark" : "light";
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [theme, setThemeState] = useState<Theme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLocaleState(readStoredLocale());
    setThemeState(readStoredTheme());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = locale;
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(LOCALE_KEY, locale);
    window.localStorage.setItem(THEME_KEY, theme);
  }, [locale, theme, ready]);

  const setLocale = useCallback((value: Locale) => setLocaleState(value), []);
  const setTheme = useCallback((value: Theme) => setThemeState(value), []);

  const t = useCallback((key: string, params?: Params) => translate(locale, key, params), [locale]);

  const te = useCallback((message: string) => translateApiError(message, locale, t), [locale, t]);

  const purposeLabelFn = useCallback((purpose: string) => getPurposeLabel(purpose, locale, t), [locale, t]);

  const value = useMemo(
    () => ({
      locale,
      theme,
      setLocale,
      setTheme,
      t,
      te,
      purposeLabel: purposeLabelFn,
    }),
    [locale, theme, setLocale, setTheme, t, te, purposeLabelFn],
  );

  return <AppPreferencesContext.Provider value={value}>{children}</AppPreferencesContext.Provider>;
}

export function useAppPreferences() {
  const ctx = useContext(AppPreferencesContext);
  if (!ctx) {
    throw new Error("useAppPreferences must be used within AppPreferencesProvider");
  }
  return ctx;
}

export { messages };
