import dotenv from "dotenv";

dotenv.config();

type SupabaseConfig = {
  URL: string;
  PUBLISHABLE_KEY: string;
  SECRET_KEY: string;
};

type JwtConfig = {
  SECRET: string;
  EXPIRES_IN: string;
};

type ServerConfig = {
  PORT: number;
  NODE_ENV: "development" | "production" | "test";
};

type CorsConfig = {
  ORIGIN: string;
};

type RateLimitConfig = {
  MAX: number;
};

type CloudinaryConfig = {
  CLOUD_NAME: string;
  API_KEY: string;
  API_SECRET: string;
};

type EmailConfig = {
  BREVO_SMTP_SDK_KEY: string;
  EMAIL_FROM: string;
};

type LogConfig = {
  LEVEL: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
};

function required(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (!val) {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return val;
}

export const envConfig = {
  SUPABASE: {
    URL: required("SUPABASE_URL"),
    PUBLISHABLE_KEY: required("SUPABASE_PUBLISHABLE_KEY"),
    SECRET_KEY: required("SUPABASE_SECRET_KEY"),
  } satisfies SupabaseConfig,

  JWT: {
    SECRET: required("JWT_SECRET"),
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
  } satisfies JwtConfig,

  SERVER: {
    PORT: Number(process.env.PORT) || 4000,
    NODE_ENV: (process.env.NODE_ENV as ServerConfig["NODE_ENV"]) || "development",
  } satisfies ServerConfig,

  CORS: {
    ORIGIN: process.env.CORS_ORIGIN || "*",
  } satisfies CorsConfig,

  RATE_LIMIT: {
    MAX: Number(process.env.RATE_LIMIT_MAX) || 100,
  } satisfies RateLimitConfig,

  CLOUDINARY: {
    CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
    API_KEY: required("CLOUDINARY_API_KEY"),
    API_SECRET: required("CLOUDINARY_API_SECRET"),
  } satisfies CloudinaryConfig,

  EMAIL: {
    BREVO_SMTP_SDK_KEY: required("BREVO_SMTP_SDK_KEY"),
    EMAIL_FROM: required("EMAIL_FROM"),
  } satisfies EmailConfig,

  LOG: {
    LEVEL: (process.env.LOG_LEVEL as LogConfig["LEVEL"]) || "info",
  } satisfies LogConfig,
};
