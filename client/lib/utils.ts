import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Shows a stored label in title case, however it was typed. "chicken wraps"
 * and "CHICKEN WRAPS" both display as "Chicken Wraps". Hyphens, slashes and
 * ampersands start a new word, so "gluten-free" reads "Gluten-Free".
 */
export function titleCase(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/(^|[\s\-/&])(\p{L})/gu, (_match, lead: string, letter: string) => lead + letter.toUpperCase());
}
