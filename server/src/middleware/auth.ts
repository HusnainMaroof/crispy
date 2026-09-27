import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../config/prisma.js";
import { envConfig } from "../config/env.js";
import { resolveTabs, type AdminTabId } from "../config/admin-tabs.js";
import type { AuthPayload } from "../types/responses.js";

declare module "express" {
  interface Request {
    admin?: AuthPayload;
  }
}

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing authorization header", code: "ERR_UNAUTHORIZED" });
    return;
  }

  const token = header.slice(7);
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
      role: profile.role as AuthPayload["role"],
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

export function requireRole(...roles: ("admin" | "superadmin" | "branch_manager")[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      res.status(401).json({ success: false, error: "Not authenticated", code: "ERR_UNAUTHORIZED" });
      return;
    }
    if (!roles.includes(req.admin.role)) {
      res.status(403).json({ success: false, error: "Insufficient permissions", code: "ERR_FORBIDDEN" });
      return;
    }
    next();
  };
}
