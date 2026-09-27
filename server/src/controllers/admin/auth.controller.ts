import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getPrisma } from "../../config/prisma.js";
import { envConfig } from "../../config/env.js";
import { UnauthorizedException } from "../../utils/app-error.js";
import { verifyPassword } from "../../utils/password.js";
import { serialize } from "../../utils/db.js";
import { sendSuccess } from "../../utils/response.js";
import { resolveTabs } from "../../config/admin-tabs.js";
import type { AdminProfile } from "../../types/models.js";

function signToken(profile: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { sub: profile.id, email: profile.email, role: profile.role },
    envConfig.JWT.SECRET,
    { expiresIn: envConfig.JWT.EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

function publicProfile(profile: {
  id: string;
  email: string;
  name: string;
  role: string;
  tabs?: string[];
  is_active: boolean;
  created_at: Date;
}): AdminProfile {
  return serialize({
    id: profile.id,
    email: profile.email,
    name: profile.name,
    role: profile.role as AdminProfile["role"],
    tabs: resolveTabs(profile.role, profile.tabs ?? []),
    is_active: profile.is_active,
    created_at: profile.created_at,
  });
}

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;
    const profile = await getPrisma().admin_profiles.findUnique({ where: { email } });

    const passwordMatches = profile ? await verifyPassword(password, profile.password_hash) : false;
    if (!profile || !passwordMatches || !profile.is_active) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const user = publicProfile(profile);
    sendSuccess(res, { token: signToken(user), user });
  },

  async refresh(req: Request, res: Response) {
    const payload = req.admin;
    if (!payload) {
      throw new UnauthorizedException("Not authenticated");
    }

    const profile = await getPrisma().admin_profiles.findUnique({ where: { id: payload.sub } });
    if (!profile?.is_active) {
      throw new UnauthorizedException("Invalid email or password");
    }

    sendSuccess(res, { token: signToken(profile) });
  },

  async me(req: Request, res: Response) {
    const profile = await getPrisma().admin_profiles.findUnique({ where: { id: req.admin!.sub } });
    if (!profile?.is_active) {
      throw new UnauthorizedException("Invalid email or password");
    }
    sendSuccess(res, publicProfile(profile));
  },

  async updateMe(req: Request, res: Response) {
    const profile = await getPrisma().admin_profiles.update({
      where: { id: req.admin!.sub },
      data: { name: req.body.name },
    });
    sendSuccess(res, publicProfile(profile));
  },
};
