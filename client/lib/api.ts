const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

const TOKEN_KEY = "crispies_admin_token";
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function tryRefreshToken(): Promise<boolean> {
  if (isRefreshing && refreshPromise) return refreshPromise;
  isRefreshing = true;
  refreshPromise = (async () => {
    try {
      const token = getAuthToken();
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;
      const res = await fetch(`${BASE}/api/admin/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers,
      });
      const body: ApiResponse<{ token: string }> = await res.json();
      if (body.success && body.data?.token) {
        setAuthToken(body.data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function request<T>(path: string, init?: RequestInit, _isRetry = false): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/api${path}`, {
    credentials: "include",
    headers,
    ...init,
  });

  if (res.status === 401 && !_isRetry) {
    const refreshed = await tryRefreshToken();
    if (refreshed) {
      return request<T>(path, init, true);
    }
    clearAuthToken();
    throw new Error("Session expired. Please log in again.");
  }

  if (res.status === 429 && !_isRetry) {
    await new Promise((r) => setTimeout(r, 1000));
    return request<T>(path, init, true);
  }

  const body: ApiResponse<T> = await res.json();
  if (!body.success) throw new Error(body.error ?? "Request failed");
  return body.data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(data) }),
  put: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(data) }),
  patch: <T>(path: string, data: unknown) =>
    request<T>(path, { method: "PATCH", body: JSON.stringify(data) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};
