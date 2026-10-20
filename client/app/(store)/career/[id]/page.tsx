import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CareerDetailPage from "@/app/components/store/career-detail-page";
import { loadStoreJob } from "@/lib/load-jobs";
import { pageMetadata } from "@/lib/site";
import { loadStoreLocations } from "@/lib/load-locations";
import { BreadcrumbJsonLd, JobPostingJsonLd } from "@/app/components/store/structured-data";

type CareerDetailProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CareerDetailProps): Promise<Metadata> {
  const { id } = await params;
  const job = await loadStoreJob(id);
  if (!job) return { title: "Role not found", robots: { index: false, follow: false } };

  return pageMetadata({
    title: `${job.title} Job in ${job.location}`,
    description: [`${job.type} ${job.title} job at Crispies ${job.location}, London.`, job.salary, "Apply online."]
      .filter(Boolean)
      .join(" "),
    path: `/career/${job.id}`,
  });
}

export default async function CareerDetailRoute({ params }: CareerDetailProps) {
  const { id } = await params;
  // A draft or closed post reads as "not found" server-side too, so this route
  // agrees with the public list rather than leaking that the post exists.
  const job = await loadStoreJob(id);
  if (!job) notFound();

  const branches = await loadStoreLocations();
  const branch = branches.find((item) => item.id === job.location_id);

  return (
    <>
      <JobPostingJsonLd job={job} branch={branch} />
      <BreadcrumbJsonLd items={[{ name: "Careers", path: "/career" }, { name: job.title, path: `/career/${job.id}` }]} />
      <CareerDetailPage job={job} />
    </>
  );
}
