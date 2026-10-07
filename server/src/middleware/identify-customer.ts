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

export function identifyCustomer(req: Request, res: Response, next: NextFunction) {
  let id = req.cookies?.[COOKIE];
  if (!id) {
    id = crypto.randomUUID();
    res.cookie(COOKIE, id, {
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
