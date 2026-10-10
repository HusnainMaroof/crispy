import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";
import { envConfig } from "../config/env.js";

// Express adds fields to Request by merging this namespace. The lint rule
// rejects namespaces everywhere else.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      customerId: string;
    }
  }
}

const COOKIE = "crispy_customer_id";
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The cookie is `<uuid>.<hmac>`. The customer id is an authorization key (it
 * reads orders and edits the profile), so a value is only trusted when this
 * server signed it. A client cannot pick an id, reuse a seeded id such as
 * "customer-a", or swap in someone else's uuid without the key.
 */
function sign(id: string): string {
  const mac = createHmac("sha256", envConfig.JWT.SECRET).update(`customer:${id}`).digest("base64url");
  return `${id}.${mac}`;
}

function trustedId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const dot = raw.lastIndexOf(".");
  if (dot < 0) return null;
  const id = raw.slice(0, dot);
  if (!UUID.test(id)) return null;
  const expected = Buffer.from(sign(id));
  const actual = Buffer.from(raw);
  return actual.length === expected.length && timingSafeEqual(actual, expected) ? id : null;
}

export function identifyCustomer(req: Request, res: Response, next: NextFunction) {
  let id = trustedId(req.cookies?.[COOKIE]);
  if (!id) {
    // Missing, unsigned (older cookies), or tampered: issue a fresh identity.
    id = randomUUID();
    res.cookie(COOKIE, sign(id), {
      httpOnly: true,
      maxAge: YEAR_MS,
      secure: envConfig.SERVER.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
  }
  req.customerId = id;
  next();
}
