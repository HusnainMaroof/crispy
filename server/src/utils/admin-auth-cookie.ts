import type { Response } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.js";

export const ADMIN_AUTH_COOKIE = "crispy_admin_session";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: envConfig.SERVER.NODE_ENV === "production",
  path: "/",
};

export function setAdminAuthCookie(res: Response, token: string): void {
  const expiresAt = (jwt.decode(token) as jwt.JwtPayload | null)?.exp;
  const maxAge = expiresAt ? Math.max(0, expiresAt * 1000 - Date.now()) : undefined;
  res.cookie(ADMIN_AUTH_COOKIE, token, { ...cookieOptions, maxAge });
}

export function clearAdminAuthCookie(res: Response): void {
  res.clearCookie(ADMIN_AUTH_COOKIE, cookieOptions);
}
