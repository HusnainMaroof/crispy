import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { envConfig } from "../config/env.js";
import type { AuthPayload } from "../types/responses.js";

declare module "express" {
  interface Request {
    admin?: AuthPayload;
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Missing authorization header", code: "ERR_UNAUTHORIZED" });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, envConfig.JWT.SECRET) as AuthPayload;
    req.admin = payload;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token", code: "ERR_UNAUTHORIZED" });
  }
}

export function requireRole(...roles: ("admin" | "superadmin")[]) {
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
