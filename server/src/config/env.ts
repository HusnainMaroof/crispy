import dotenv from "dotenv";

dotenv.config();

type JwtConfig = {
  SECRET: string;
  EXPIRES_IN: string;
  /** Hard cap on one admin login, however often the token is refreshed. */
  SESSION_MAX_HOURS: number;
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

type EmailConfig = {
  RESEND_API_KEY: string;
  EMAIL_FROM: string;
  ADMIN_EMAIL: string;
};

type CloudinaryConfig = {
  CLOUD_NAME: string;
  API_KEY: string;
  API_SECRET: string;
};

type FranchiseConfig = {
  /** Where the emailed brochure link points. Must be an absolute https URL. */
  BROCHURE_URL: string;
  SITE_URL: string;
};

type LocationConfig = {
  /** Straight-line search radius in miles. Bounded 1 to 200. */
  RADIUS_MILES: number;
  /** Timeout for every geocoding request. */
  GEOCODE_TIMEOUT_MS: number;
  /** Nominatim is a free public service with a strict usage policy, so it is opt-out. */
  NOMINATIM_ENABLED: boolean;
  NOMINATIM_URL: string;
  /** Nominatim requires an identifying User-Agent. */
  USER_AGENT: string;
};

type RoutingConfig = {
  /**
   * Base URL of an OSRM-compatible routing server, e.g. https://router.example.com.
   * Empty means in-app routing is off and the client shows the navigation link only.
   */
  OSRM_URL: string;
  /** OSRM profile name. Common values are "driving" or "car", depending on how the server was built. */
  OSRM_PROFILE: string;
  TIMEOUT_MS: number;
};

type LogConfig = {
  LEVEL: "trace" | "debug" | "info" | "warn" | "error" | "fatal";
};

type NeonConfig = {
  DATABASE_URL: string;
  DIRECT_URL: string;
  /** Optional Neon read replica. Unset means every read uses the primary. */
  READ_REPLICA_URL?: string;
  /** Per-instance pg pool ceiling. Total connections = instances x POOL_MAX. */
  POOL_MAX: number;
  IDLE_TIMEOUT_MS: number;
  CONNECT_TIMEOUT_MS: number;
  /** Log queries slower than this many ms. 0 (default) disables the logging. */
  SLOW_QUERY_MS: number;
};

/** Falls back to the default when the value is missing, not a number, or outside the range. */
function boundedNumber(raw: string | undefined, fallback: number, min: number, max: number): number {
  const value = Number(raw);
  if (!raw || !Number.isFinite(value) || value < min || value > max) return fallback;
  return value;
}

function required(key: string, fallback?: string): string {
  const val = process.env[key] ?? fallback;
  if (!val) {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return val;
}

export const envConfig = {
  JWT: {
    SECRET: required("JWT_SECRET"),
    EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",
    SESSION_MAX_HOURS: Number(process.env.ADMIN_SESSION_MAX_HOURS) || 12,
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

  EMAIL: {
    RESEND_API_KEY: required("RESEND_API_KEY"),
    EMAIL_FROM: required("EMAIL_FROM", "onboarding@resend.dev"),
    ADMIN_EMAIL: required("ADMIN_EMAIL", process.env.superADMIN_EMAIL),
  } satisfies EmailConfig,

  CLOUDINARY: {
    CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
    API_KEY: required("CLOUDINARY_API_KEY"),
    API_SECRET: required("CLOUDINARY_API_SECRET"),
  } satisfies CloudinaryConfig,

  FRANCHISE: {
    BROCHURE_URL: process.env.FRANCHISE_BROCHURE_URL || "https://crispies.co.uk/brochure.pdf",
    SITE_URL: process.env.PUBLIC_SITE_URL || "https://crispies.co.uk",
  } satisfies FranchiseConfig,

  LOG: {
    LEVEL: (process.env.LOG_LEVEL as LogConfig["LEVEL"]) || "info",
  } satisfies LogConfig,

  LOCATION: {
    RADIUS_MILES: boundedNumber(process.env.LOCATION_RADIUS_MILES, 50, 1, 200),
    GEOCODE_TIMEOUT_MS: boundedNumber(process.env.LOCATION_GEOCODE_TIMEOUT_MS, 5000, 500, 15000),
    NOMINATIM_ENABLED: process.env.LOCATION_NOMINATIM_ENABLED !== "false",
    NOMINATIM_URL: process.env.LOCATION_NOMINATIM_URL || "https://nominatim.openstreetmap.org",
    USER_AGENT: process.env.LOCATION_USER_AGENT || "CrispiesBranchLocator/1.0 (https://crispies.co.uk)",
  } satisfies LocationConfig,

  ROUTING: {
    OSRM_URL: (process.env.ROUTING_OSRM_URL || "").replace(/\/+$/, ""),
    OSRM_PROFILE: process.env.ROUTING_OSRM_PROFILE || "driving",
    TIMEOUT_MS: boundedNumber(process.env.ROUTING_TIMEOUT_MS, 6000, 500, 15000),
  } satisfies RoutingConfig,

  NEON: {
    DATABASE_URL: required("NEON_DATABASE_URL"),
    DIRECT_URL: process.env.NEON_DIRECT_URL || required("NEON_DATABASE_URL"),
    READ_REPLICA_URL: process.env.NEON_READ_REPLICA_URL || undefined,
    POOL_MAX: Number(process.env.DB_POOL_MAX) || 10,
    IDLE_TIMEOUT_MS: Number(process.env.DB_IDLE_TIMEOUT_MS) || 30000,
    CONNECT_TIMEOUT_MS: Number(process.env.DB_CONNECT_TIMEOUT_MS) || 10000,
    SLOW_QUERY_MS: Number(process.env.SLOW_QUERY_MS) || 0,
  } satisfies NeonConfig,
};

const WEAK_SECRETS = new Set([
  "secret",
  "changeme",
  "change-me",
  "change-me-to-a-long-random-string",
]);

/** Called from server startup. Tests import env without taking this path. */
export function assertProductionConfig(): void {
  if (envConfig.SERVER.NODE_ENV !== "production") return;

  const secret = envConfig.JWT.SECRET;
  if (secret.length < 32 || WEAK_SECRETS.has(secret)) {
    throw new Error("JWT_SECRET must be a long random value in production");
  }

  const origin = envConfig.CORS.ORIGIN.trim();
  if (!origin || origin === "*" || origin.split(",").some((item) => item.trim() === "*" || item.trim() === "")) {
    throw new Error("CORS_ORIGIN must be an explicit origin list in production, not *");
  }
}
