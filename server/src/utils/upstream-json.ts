/**
 * Failure from a third-party provider. The message is for logs only. Never
 * return it to the customer, it can contain provider URLs.
 */
export class UpstreamError extends Error {
  constructor(
    public readonly kind: "timeout" | "rate_limited" | "http" | "network" | "invalid",
    message: string,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

export type JsonResponse = { status: number; body: unknown };

/**
 * GET a JSON document with a hard timeout. Returns the status and parsed body
 * for any HTTP status, so the caller can treat 404 as "no result". Throws
 * UpstreamError for timeouts, rate limits, 5xx, network faults, and bad JSON.
 */
export async function getJson(
  url: string,
  options: { timeoutMs: number; headers?: Record<string, string> },
): Promise<JsonResponse> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: { Accept: "application/json", ...options.headers },
      signal: AbortSignal.timeout(options.timeoutMs),
    });
  } catch (error) {
    const timedOut = error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError");
    throw new UpstreamError(timedOut ? "timeout" : "network", timedOut ? "Upstream timed out" : "Upstream unreachable");
  }

  if (res.status === 429) throw new UpstreamError("rate_limited", "Upstream rate limit reached");
  if (res.status >= 500) throw new UpstreamError("http", `Upstream returned ${res.status}`);
  if (res.status === 404) return { status: 404, body: null };
  if (!res.ok) throw new UpstreamError("http", `Upstream returned ${res.status}`);

  try {
    return { status: res.status, body: await res.json() };
  } catch {
    throw new UpstreamError("invalid", "Upstream returned invalid JSON");
  }
}
