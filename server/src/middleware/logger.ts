import pino from "pino";
import pinoHttp from "pino-http";
import { envConfig } from "../config/env.js";

const level = envConfig.LOG.LEVEL;
const production = envConfig.SERVER.NODE_ENV === "production";

export const logger = pino({
  level,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "req.headers.set-cookie",
      "res.headers.set-cookie",
      "*.password",
      "*.token",
      "*.authorization",
    ],
    censor: "[redacted]",
  },
  ...(!production && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true, ignore: "pid,hostname" },
    },
  }),
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/health" || req.url === "/api/health",
  },
  // Successful traffic stays out of production logs. Failures still surface.
  customLogLevel: (_req, res, err) => {
    if (err || res.statusCode >= 500) return "error";
    if (res.statusCode >= 400) return "warn";
    return production ? "silent" : "info";
  },
  serializers: {
    req(req) {
      return { method: req.method, url: req.url?.split("?")[0] };
    },
    res(res) {
      return { statusCode: res.statusCode };
    },
  },
});
