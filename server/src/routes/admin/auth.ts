import { Router } from "express";
import jwt from "jsonwebtoken";
import { supabase } from "../../config/supabase.js";
import { env } from "../../config/env.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema } from "../../validators/admin.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.post("/login", validate(loginSchema), async (req, res) => {
  const { email, password } = req.body;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    sendError(res, "Invalid email or password", 401);
    return;
  }

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("*")
    .eq("id", authData.user.id)
    .single();

  if (!profile) {
    sendError(res, "Not authorized as admin", 403);
    return;
  }

  const token = jwt.sign(
    { sub: profile.id, email: profile.email, role: profile.role },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"] },
  );

  sendSuccess(res, { token, user: profile });
});

router.get("/me", async (req, res) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    sendError(res, "Not authenticated", 401);
    return;
  }

  try {
    const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as { sub: string };
    const { data: profile } = await supabase
      .from("admin_profiles")
      .select("*")
      .eq("id", payload.sub)
      .single();

    if (!profile) {
      sendError(res, "Profile not found", 404);
      return;
    }
    sendSuccess(res, profile);
  } catch {
    sendError(res, "Invalid token", 401);
  }
});

export default router;
