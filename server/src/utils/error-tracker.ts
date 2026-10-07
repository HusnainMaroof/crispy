import { logger } from "../middleware/logger.js";

let warned = false;

/**
 * Logs every unexpected error. When SENTRY_DSN is set, forwards it if
 * @sentry/node is installed. Orders are never rolled back from here.
 */
export function reportError(err: unknown, extra?: Record<string, unknown>): void {
  logger.error({ err, ...extra }, "error report");
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;

  const load = new Function("return import('@sentry/node')") as () => Promise<{
    init: (options: { dsn: string; tracesSampleRate: number }) => void;
    getClient: () => unknown;
    captureException: (error: unknown) => void;
  }>;
  void load()
    .then((sentry) => {
      if (!sentry.getClient()) {
        sentry.init({ dsn, tracesSampleRate: 0 });
      }
      sentry.captureException(err);
    })
    .catch(() => {
      if (warned) return;
      warned = true;
      logger.error("SENTRY_DSN is set but @sentry/node is not installed");
    });
}
