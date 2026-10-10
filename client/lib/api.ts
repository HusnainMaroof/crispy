export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  errors?: Record<string, string[] | undefined>;
  item?: { kind: "product" | "deal"; id: string };
}

/**
 * Mirrors the server's PaginationMeta. Sent as a sibling of `data`, so a
 * collection endpoint still returns a bare array and every existing caller is
 * unaffected.
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export class SessionExpiredError extends Error {
  constructor() {
    super("Session expired. Please log in again.");
    this.name = "SessionExpiredError";
  }
}

export function isSessionExpiredError(error: unknown): error is SessionExpiredError {
  return error instanceof SessionExpiredError;
}

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const res = await fetch("/api/admin/auth/refresh", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      const body: ApiResponse = await res.json();
      return res.ok && body.success;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function readBody<T>(res: Response): Promise<ApiResponse<T>> {
  const raw = await res.text();
  // 204 and other empty bodies are a valid success with nothing to say. Without
  // this, JSON.parse("") threw and surfaced as "unexpected response (204)",
  // even though the delete had actually gone through.
  if (!raw) return { success: true, data: undefined as T };
  try {
    return JSON.parse(raw) as ApiResponse<T>;
  } catch {
    throw new Error(`The server returned an unexpected response (${res.status}).`);
  }
}

async function request<T>(path: string, init?: RequestInit, _isRetry = false): Promise<T> {
  const body = await requestEnvelope<T>(path, init, _isRetry);
  return body.data as T;
}

/**
 * Same request path as request(), but hands back the whole envelope so a caller
 * can read the sibling `pagination` object. Split out rather than added as a
 * flag on request() so the ~20 existing api.get callers keep their exact
 * behaviour and types.
 */
async function requestEnvelope<T>(
  path: string,
  init?: RequestInit,
  _isRetry = false,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(`/api${path}`, {
    credentials: "include",
    headers,
    ...init,
  });

  if (
    res.status === 401 &&
    !_isRetry &&
    path !== "/admin/auth/login" &&
    path !== "/admin/auth/refresh" &&
    path !== "/admin/auth/logout"
  ) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return requestEnvelope<T>(path, init, true);
    }
    if (typeof window !== "undefined") window.dispatchEvent(new Event("admin-session-expired"));
    throw new SessionExpiredError();
  }

  if (res.status === 429 && !_isRetry) {
    await new Promise((r) => setTimeout(r, 1000));
    return requestEnvelope<T>(path, init, true);
  }

  const body = await readBody<T>(res);
  if (!body.success) {
    const details = body.errors
      ? Object.entries(body.errors).flatMap(([field, messages]) => (messages ?? []).map((message) => `${field}: ${message}`)).join(" ")
      : "";
    const failure = new Error(details ? `${body.error ?? "Request failed"}. ${details}` : (body.error ?? "Request failed")) as Error & {
      code?: string;
      item?: { kind: "product" | "deal"; id: string };
    };
    failure.code = body.code;
    failure.item = body.item;
    throw failure;
  }
  return body;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  /**
   * Reads a paginated collection. `data` stays a bare array on the wire, so
   * this only differs from get() by also returning the sibling metadata.
   */
  getPage: async <T>(path: string): Promise<{ items: T[]; pagination: Pagination }> => {
    const body = await requestEnvelope<T[]>(path);
    const meta = (body as unknown as { pagination?: Pagination }).pagination;
    return {
      items: (body.data ?? []) as T[],
      pagination: meta ?? { page: 1, limit: body.data?.length ?? 0, total: body.data?.length ?? 0, totalPages: 1, hasNextPage: false, hasPreviousPage: false },
    };
  },
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  logout: async (): Promise<void> => {
    const res = await fetch("/api/admin/auth/logout", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error("Could not end the admin session.");
  },
  upload: async <T>(path: string, formData: FormData): Promise<T> => {
    const res = await fetch(`/api${path}`, {
      method: "POST", body: formData, credentials: "include",
    });
    const body = await readBody<T>(res);
    if (!body.success) throw new Error(body.error ?? "Upload failed");
    return body.data as T;
  },
};
