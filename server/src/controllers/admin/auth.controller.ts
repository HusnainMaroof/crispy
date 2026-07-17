import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createClient } from "@supabase/supabase-js";
import { getAdminClient } from "../../config/supabase.js";
import { envConfig } from "../../config/env.js";
import { ForbiddenException, NotFoundException, UnauthorizedException } from "../../utils/app-error.js";
import { sendSuccess } from "../../utils/response.js";

export const AuthController = {
  async login(req: Request, res: Response) {
    const { email, password } = req.body;

    const anonClient = createClient(envConfig.SUPABASE.URL, envConfig.SUPABASE.PUBLISHABLE_KEY);
    const { data: authData, error: authError } = await anonClient.auth.signInWithPassword({
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

    const token = jwt.sign(
      { sub: profile.id, email: profile.email, role: profile.role },
      envConfig.JWT.SECRET,
      { expiresIn: envConfig.JWT.EXPIRES_IN as jwt.SignOptions["expiresIn"] },
    );

    sendSuccess(res, { token, user: profile });
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
