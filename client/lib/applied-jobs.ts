const APPLIED_JOBS_KEY = "crispies_applied_jobs";

export function getAppliedJobIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(APPLIED_JOBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markJobApplied(jobId: string): void {
  if (typeof window === "undefined") return;
  const ids = getAppliedJobIds();
  if (!ids.includes(jobId)) {
    ids.push(jobId);
    localStorage.setItem(APPLIED_JOBS_KEY, JSON.stringify(ids));
  }
}

export function hasAppliedToJob(jobId: string): boolean {
  return getAppliedJobIds().includes(jobId);
}
