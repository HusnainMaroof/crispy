import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getAdminClient, getAnonClient } from "../../config/supabase.js";
import { envConfig } from "../../config/env.js";
import { ForbiddenException, NotFoundException, UnauthorizedException } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";

function signToken(profile: { id: string; email: string; role: string }): string {
  return jwt.sign(
    { sub: profile.id, email: profile.email, role: profile.role },
    envConfig.JWT.SECRET,
    { expiresIn: envConfig.JWT.EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );
}

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const { data: authData, error: authError } = await getAnonClient().auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const { data: profile } = await getAdminClient()
      .from("admin_profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (!profile) {
      throw new ForbiddenException("Not authorized as admin");
    }

    const token = signToken(profile);

    sendSuccess(res, { token, user: profile });
  },

  async refresh(req: Request, res: Response) {
    const payload = req.admin;
    if (!payload) {
      throw new UnauthorizedException("Not authenticated");
    }

    const { data: profile } = await getAdminClient()
      .from("admin_profiles")
      .select("*")
      .eq("id", payload.sub)
      .single();

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }

    const token = signToken(profile);
    sendSuccess(res, { token });
  },

  async me(req: Request, res: Response) {
    const { data: profile } = await getAdminClient()
      .from("admin_profiles")
      .select("*")
      .eq("id", req.admin!.sub)
      .single();

    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    sendSuccess(res, profile);
  },
};
