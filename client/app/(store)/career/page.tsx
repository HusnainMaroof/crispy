import type { Metadata } from "next";
import CareerPage from "@/app/components/store/career-page";
import { loadStoreJobs } from "@/lib/load-jobs";

export const metadata: Metadata = {
  title: "Careers — Crispies",
  description:
    "Open roles across every Crispies branch in London. Free training, free meals and a team that tells you where you stand.",
};

export default async function CareerRoute() {
  // `loadStoreJobs` reports whether the read worked, because an empty list is
  // ambiguous between "no openings" and "API unreachable" and the page has to say
  // different things for each.
  const { ok, jobs } = await loadStoreJobs();

  return <CareerPage jobs={jobs} reachable={ok} />;
}
