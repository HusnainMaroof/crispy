import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CareerDetailPage from "@/app/components/store/career-detail-page";
import { loadStoreJob } from "@/lib/load-jobs";

type CareerDetailProps = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: CareerDetailProps): Promise<Metadata> {
  const { id } = await params;
  const job = await loadStoreJob(id);
  if (!job) return { title: "Role not found — Crispies", robots: { index: false, follow: false } };

  return {
    title: `${job.title} at ${job.location} — Crispies Careers`,
    description: `${job.type} at Crispies ${job.location}. ${job.salary}. Apply online.`,
  };
}

export default async function CareerDetailRoute({ params }: CareerDetailProps) {
  const { id } = await params;
  // A draft or closed post reads as "not found" server-side too, so this route
  // agrees with the public list rather than leaking that the post exists.
  const job = await loadStoreJob(id);
  if (!job) notFound();

  return <CareerDetailPage job={job} />;
}
