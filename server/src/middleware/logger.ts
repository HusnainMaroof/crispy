import pino from "pino";
import pinoHttp from "pino-http";
import { envConfig } from "../config/env.js";

const level = envConfig.LOG.LEVEL;

export const logger = pino({
  level,
  ...(envConfig.SERVER.NODE_ENV !== "production" && {
    transport: {
      target: "pino-pretty",
      options: { colorize: true },
    },
  }),
});

export const httpLogger = pinoHttp({
  logger,
  autoLogging: {
    ignore: (req) => req.url === "/health",
  },
});
