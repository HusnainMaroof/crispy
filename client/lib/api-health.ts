/** True when the Express API answers its health check. A timeout counts as down. */
export async function isApiResponding(): Promise<boolean> {
  const configured = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "";
  if (!configured && process.env.NODE_ENV === "production") return false;
  const base = configured || "http://127.0.0.1:4000";
  try {
    const res = await fetch(`${base}/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(4000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
