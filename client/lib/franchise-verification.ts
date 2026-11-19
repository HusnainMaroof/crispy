// franchise-verification.ts
// Where the franchise email verification popup is up to, kept in
// sessionStorage so closing the popup or reloading the page does not throw the
// visitor back to step 1. Only the server can say a code or token is valid;
// this just remembers what the server already answered.

export type VerifySession =
  | {
      /** The name is entered, the email is next. */
      stage: "email";
      name: string;
    }
  | {
      /** A code was emailed and is waiting to be typed. */
      stage: "code";
      name: string;
      email: string;
      codeExpiresAt: number;
      resendAt: number;
    }
  | {
      /** The code was correct. The token unlocks the brochure and the form. */
      stage: "verified";
      name: string;
      email: string;
      token: string;
      tokenExpiresAt: number;
    };

const KEY = "crispy_franchise_verify";

function isSession(value: unknown): value is VerifySession {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  if (typeof v.name !== "string" || !v.name) return false;
  if (v.stage === "email") return true;
  if (typeof v.email !== "string" || !v.email) return false;
  if (v.stage === "code") return typeof v.codeExpiresAt === "number" && typeof v.resendAt === "number";
  if (v.stage === "verified") return typeof v.token === "string" && typeof v.tokenExpiresAt === "number";
  return false;
}

/** When the saved stage stops being usable. The name-only stage never runs out. */
function expiresAt(session: VerifySession): number {
  if (session.stage === "code") return session.codeExpiresAt;
  if (session.stage === "verified") return session.tokenExpiresAt;
  return Number.POSITIVE_INFINITY;
}

/**
 * The saved session, or null if there is none. A code or token that has run
 * out drops back to the name-only stage, so the visitor keeps their name.
 */
export function loadVerifySession(now = Date.now()): VerifySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isSession(parsed)) return null;
    if (expiresAt(parsed) <= now) {
      const fallback: VerifySession = { stage: "email", name: parsed.name };
      saveVerifySession(fallback);
      return fallback;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveVerifySession(session: VerifySession | null): void {
  if (typeof window === "undefined") return;
  try {
    if (session) window.sessionStorage.setItem(KEY, JSON.stringify(session));
    else window.sessionStorage.removeItem(KEY);
  } catch {
    // Private mode or storage full: the popup still works, it just won't resume.
  }
}
