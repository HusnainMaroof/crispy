import { createAdminClient, createContextClient } from "@supabase/server/core";
import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { envConfig } from "./env.js";

let admin: SupabaseClient | null = null;
let anon: SupabaseClient | null = null;

export function getAdminClient() {
  if (!admin) {
    process.env.SUPABASE_URL = envConfig.SUPABASE.URL;
    process.env.SUPABASE_SECRET_KEY = envConfig.SUPABASE.SECRET_KEY;
    admin = createAdminClient();
  }
  return admin;
}

export function getAnonClient() {
  if (!anon) {
    anon = createClient(envConfig.SUPABASE.URL, envConfig.SUPABASE.PUBLISHABLE_KEY);
  }
  return anon;
}

export function getContextClient(opts?: { token?: string; keyName?: string }) {
  process.env.SUPABASE_URL = envConfig.SUPABASE.URL;
  process.env.SUPABASE_PUBLISHABLE_KEY = envConfig.SUPABASE.PUBLISHABLE_KEY;
  return createContextClient(
    opts?.token
      ? { auth: { token: opts.token, keyName: opts.keyName ?? "default" } }
      : undefined,
  );
}
