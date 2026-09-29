import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../config/prisma.js";
import { envConfig } from "../config/env.js";
import { resolveTabs, type AdminTabId } from "../config/admin-tabs.js";
import { normalizeRole, type AdminRole } from "../config/admin-roles.js";
import type { AuthPayload } from "../types/responses.js";
import { ADMIN_AUTH_COOKIE } from "../utils/admin-auth-cookie.js";

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
    const payload = jwt.verify(token, envConfig.JWT.SECRET) as AuthPayload;
    const profile = await getPrisma().admin_profiles.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, role: true, is_active: true, tabs: true },
    });
    if (!profile?.is_active) {
      res.status(401).json({ success: false, error: "Invalid or expired token", code: "ERR_UNAUTHORIZED" });
      return;
    }
    req.admin = {
      sub: profile.id,
      email: profile.email,
      role: normalizeRole(profile.role),
      tabs: resolveTabs(profile.role, profile.tabs),
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
