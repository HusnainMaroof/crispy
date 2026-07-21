import type { Request, Response, NextFunction } from "express";
import { envConfig } from "../config/env.js";

declare global {
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
