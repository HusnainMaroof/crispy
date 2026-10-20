import type { Metadata } from "next";
import CareerPage from "@/app/components/store/career-page";
import { loadStoreJobs } from "@/lib/load-jobs";
import { pageMetadata } from "@/lib/site";
import { BreadcrumbJsonLd } from "@/app/components/store/structured-data";

export const metadata: Metadata = pageMetadata({
  title: "Restaurant Jobs in London",
  description:
    "Restaurant jobs at every Crispies branch in London. Free training, free meals and a team that tells you where you stand. Apply online.",
  path: "/career",
});

export default async function CareerRoute() {
  // `loadStoreJobs` reports whether the read worked, because an empty list is
  // ambiguous between "no openings" and "API unreachable" and the page has to say
  // different things for each.
  const { ok, jobs } = await loadStoreJobs();

  return (
    <>
      <BreadcrumbJsonLd items={[{ name: "Careers", path: "/career" }]} />
      <CareerPage jobs={jobs} reachable={ok} />
    </>
  );
}
