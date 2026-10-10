export type ParsedPostcode = {
  /** Normalised with a single space, e.g. "W9 2HU" or "NW6". */
  formatted: string;
  outcode: string;
  full: boolean;
};

const FULL_UK_POSTCODE = /^([A-Z]{1,2}\d[A-Z\d]?)(\d[A-Z]{2})$/;
const OUTWARD_UK_POSTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/;
const EMBEDDED_FULL_POSTCODE = /\b([A-Z]{1,2}\d[A-Z\d]?)\s*(\d[A-Z]{2})\b/;
const US_ZIP = /^\d{5}(?:-?\d{4})?$/;

export function compactPostcode(raw: string): string {
  return raw.replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export function isUsZip(raw: string): boolean {
  return US_ZIP.test(raw.replace(/\s+/g, ""));
}

/** Returns null when the text is not a UK postcode or outward code. */
export function parseUkPostcode(raw: string): ParsedPostcode | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const whole = compactPostcode(trimmed);
  const full = whole.match(FULL_UK_POSTCODE);
  if (full) {
    return { formatted: `${full[1]} ${full[2]}`, outcode: full[1], full: true };
  }

  const embedded = trimmed.toUpperCase().match(EMBEDDED_FULL_POSTCODE);
  if (embedded) {
    return { formatted: `${embedded[1]} ${embedded[2]}`, outcode: embedded[1], full: true };
  }

  if (OUTWARD_UK_POSTCODE.test(whole)) {
    return { formatted: whole, outcode: whole, full: false };
  }

  return null;
}
