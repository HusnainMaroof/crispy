import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../config/prisma.js";
import { envConfig } from "../config/env.js";
import { resolveTabs, type AdminTabId } from "../config/admin-tabs.js";
import { normalizeRole, type AdminRole } from "../config/admin-roles.js";
import type { AuthPayload } from "../types/responses.js";
import { ADMIN_AUTH_COOKIE } from "../utils/admin-auth-cookie.js";
import { cachedJson, TTL_ADMIN_AUTH_SECONDS } from "../utils/cache.js";

const AUTH_PROFILE_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  is_active: true,
  tabs: true,
  token_version: true,
  created_at: true,
} as const;

/** Claims this server issues. A token without them is treated as invalid. */
export type SessionClaims = AuthPayload & { sv?: number; ss?: number };

/**
 * The live admin profile row, memoized for a few seconds (see TTL_ADMIN_AUTH_SECONDS).
 * Shared by the auth middleware and `GET /admin/auth/me` so the profile is read once
 * per window instead of once per call. Writes drop it via invalidateAdminAuth.
 */
export function loadAuthProfile(adminId: string) {
  return cachedJson(`admin-auth:${adminId}`, TTL_ADMIN_AUTH_SECONDS, () =>
    getPrisma().admin_profiles.findUnique({ where: { id: adminId }, select: AUTH_PROFILE_SELECT }),
  );
}

declare module "express" {
  interface Request {
    admin?: AuthPayload;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const bearerToken = header?.startsWith("Bearer ") ? header.slice(7) : null;
  const cookieToken = req.cookies?.[ADMIN_AUTH_COOKIE];
  const token = bearerToken || cookieToken;
  if (typeof token !== "string" || !token) {
    res.status(401).json({ success: false, error: "Not authenticated", code: "ERR_UNAUTHORIZED" });
    return;
  }
  try {
    // jsonwebtoken checks the signature and `exp`, so an expired or forged token
    // throws here and lands in the catch below.
    const payload = jwt.verify(token, envConfig.JWT.SECRET) as SessionClaims;
    // Re-read the profile so the live database role and active flag are used,
    // never the stale values baked into the token. The row is memoized for a few
    // seconds so a burst of admin requests does not re-query per call; every
    // profile write drops the entry (see invalidateAdminAuth), so a deactivation
    // or role change is picked up immediately on the instance that wrote it.
    const profile = await loadAuthProfile(payload.sub);
    // A logout, password change, deactivation or role change bumps token_version.
    // A token minted before that event carries the old number and is refused.
    const sessionStart = payload.ss;
    const sessionAge = typeof sessionStart === "number" ? Date.now() / 1000 - sessionStart : Infinity;
    if (
      !profile?.is_active ||
      typeof payload.sv !== "number" ||
      payload.sv !== profile.token_version ||
      sessionAge > envConfig.JWT.SESSION_MAX_HOURS * 3600
    ) {
      res.status(401).json({ success: false, error: "Invalid or expired token", code: "ERR_UNAUTHORIZED" });
      return;
    }
    req.admin = {
      sub: profile.id,
      email: profile.email,
      role: normalizeRole(profile.role),
      tabs: resolveTabs(profile.role, profile.tabs),
      session_started_at: sessionStart,
    };
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token", code: "ERR_UNAUTHORIZED" });
  }
}

export function requireTab(...tabs: AdminTabId[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      res.status(401).json({ success: false, error: "Not authenticated", code: "ERR_UNAUTHORIZED" });
      return;
    }
    if (tabs.some((tab) => req.admin?.tabs?.includes(tab))) {
      next();
      return;
    }
    res.status(403).json({ success: false, error: "This area is not assigned to your account", code: "ERR_FORBIDDEN" });
  };
}

export function requireRole(...roles: AdminRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      res.status(401).json({ success: false, error: "Not authenticated", code: "ERR_UNAUTHORIZED" });
      return;
    }
    if (!roles.includes(req.admin.role as (typeof roles)[number])) {
      res.status(403).json({ success: false, error: "Insufficient permissions", code: "ERR_FORBIDDEN" });
      return;
    }
    next();
  };
}
