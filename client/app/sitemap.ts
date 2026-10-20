import type { MetadataRoute } from "next";
import { loadStoreJobs } from "@/lib/load-jobs";
import { SITE_URL } from "@/lib/site";

// Rebuilt hourly so new and closed job posts show up without a deploy.
export const revalidate = 3600;

const PAGES: { path: string; changeFrequency: "daily" | "weekly" | "monthly"; priority: number }[] = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/menu", changeFrequency: "weekly", priority: 0.9 },
  { path: "/locations", changeFrequency: "monthly", priority: 0.9 },
  { path: "/delivery", changeFrequency: "monthly", priority: 0.7 },
  { path: "/career", changeFrequency: "weekly", priority: 0.6 },
  { path: "/franchise-inquiries", changeFrequency: "monthly", priority: 0.5 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const { jobs } = await loadStoreJobs();
  return [
    ...PAGES.map((page) => ({
      url: `${SITE_URL}${page.path === "/" ? "" : page.path}`,
      changeFrequency: page.changeFrequency,
      priority: page.priority,
    })),
    ...jobs.map((job) => ({
      url: `${SITE_URL}/career/${job.id}`,
      ...(job.created_at ? { lastModified: new Date(job.created_at) } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.5,
    })),
  ];
}
