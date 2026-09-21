import { messages, type Locale } from "./messages";

export type Params = Record<string, string | number>;

function getMessage(locale: Locale, key: string): string | undefined {
  const parts = key.split(".");
  let node: unknown = messages[locale];
  for (const part of parts) {
    if (typeof node !== "object" || node === null || !(part in node)) return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(locale: Locale, key: string, params?: Params): string {
  const template = getMessage(locale, key) ?? getMessage("en", key) ?? key;
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, name: string) => String(params[name] ?? `{${name}}`));
}

const ERROR_MAP: Record<string, string> = {
  "Select a purpose of visit.": "errors.selectPurpose",
  "Choose a Silverleaf campus.": "errors.chooseCampus",
  "Full name is required.": "errors.fullName",
  "Person or office visiting is required.": "errors.hostRequired",
  "Photo must be a JPEG image.": "errors.photoJpeg",
  "Photo data is invalid.": "errors.photoInvalid",
  "Photo is too large. Try again closer to the camera.": "errors.photoLarge",
  "Add a name or phone number for the watchlist entry.": "errors.watchlistAdd",
  "Something went wrong.": "errors.generic",
};

export function translateApiError(message: string, locale: Locale, t: (key: string, params?: Params) => string): string {
  const mapped = ERROR_MAP[message];
  if (mapped) return t(mapped);

  const phoneMatch = message.match(/^Phone number must be (\d+)–(\d+) digits only\.$/);
  if (phoneMatch) {
    return t("errors.phoneDigits", { min: phoneMatch[1], max: phoneMatch[2] });
  }

  const signedOutMatch = message.match(/^(.+) is already signed out\.$/);
  if (signedOutMatch) {
    return t("errors.alreadySignedOut", { name: signedOutMatch[1] });
  }

  const watchlistMatch = message.match(
    /^This visitor is on the watchlist: (.+)\. Contact school leadership before allowing entry\.$/,
  );
  if (watchlistMatch) {
    return t("errors.watchlistBlock", { reason: watchlistMatch[1] });
  }

  return message;
}
