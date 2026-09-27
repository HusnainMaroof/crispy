import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { InternalServerException, NotFoundException } from "../utils/app-error.js";
import { slugifyBranchName } from "../utils/slug.js";
import { rethrow, serialize } from "../utils/db.js";
import type { Location, BusinessSettings, JobPost, JobApplication, ContactMessage } from "../types/models.js";

function db() {
  return getPrisma();
}

export async function getLocations(options?: { activeOnly?: boolean }): Promise<Location[]> {
  const rows = await db().locations.findMany({
    where: options?.activeOnly ? { status: "active" } : undefined,
    orderBy: { sort_order: "asc" },
  });
  return serialize(rows);
}

export async function getLocationById(id: string): Promise<Location> {
  const row = await db().locations.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Location not found");
  return serialize(row);
}

export async function updateLocation(id: string, input: Record<string, unknown>): Promise<Location> {
  try {
    const row = await db().locations.update({
      where: { id },
      data: input as Prisma.locationsUncheckedUpdateInput,
    });
    return serialize(row);
  } catch (error) {
    rethrow(error, "Location not found");
  }
}

export async function createLocation(input: Record<string, unknown>): Promise<Location> {
  try {
    const name = typeof input.name === "string" ? input.name : "";
    const slug = typeof input.slug === "string" && input.slug.length > 0 ? input.slug : slugifyBranchName(name);
    const row = await db().locations.create({
      data: {
        ...(input as Prisma.locationsUncheckedCreateInput),
        id: crypto.randomUUID(),
        slug,
        sort_order: 0,
      },
    });
    return serialize(row);
  } catch (error) {
    rethrow(error, "Location not found");
  }
}

export async function deleteLocation(id: string): Promise<void> {
  try {
    await db().locations.delete({ where: { id } });
  } catch (error) {
    rethrow(error, "Location not found");
  }
}

export async function getSettings(): Promise<BusinessSettings> {
  const row = await db().business_settings.findFirst({ orderBy: { id: "asc" } });
  if (!row) throw new InternalServerException("Failed to fetch settings");
  return serialize(row);
}

export async function updateSettings(input: Record<string, unknown>): Promise<BusinessSettings> {
  try {
    const row = await db().business_settings.update({
      where: { id: 1 },
      data: input as Prisma.business_settingsUncheckedUpdateInput,
    });
    return serialize(row);
  } catch (error) {
    rethrow(error, "Settings not found");
  }
}

export async function getJobPosts(filter?: { status?: string }): Promise<JobPost[]> {
  const rows = await db().job_posts.findMany({
    where: filter?.status ? { status: filter.status } : undefined,
    orderBy: { created_at: "desc" },
  });
  return serialize(rows);
}

export async function getJobPostById(id: string): Promise<JobPost> {
  const row = await db().job_posts.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Job post not found");
  return serialize(row);
}

export async function createJobPost(input: Record<string, unknown>): Promise<JobPost> {
  try {
    const row = await db().job_posts.create({
      data: {
        ...(input as Prisma.job_postsUncheckedCreateInput),
        id: typeof input.id === "string" ? input.id : crypto.randomUUID(),
        applications: 0,
      },
    });
    return serialize(row);
  } catch (error) {
    rethrow(error, "Job post not found");
  }
}

export async function updateJobPost(id: string, input: Record<string, unknown>): Promise<JobPost> {
  try {
    const row = await db().job_posts.update({
      where: { id },
      data: input as Prisma.job_postsUncheckedUpdateInput,
    });
    return serialize(row);
  } catch (error) {
    rethrow(error, "Job post not found");
  }
}

export async function deleteJobPost(id: string): Promise<void> {
  try {
    await db().job_posts.delete({ where: { id } });
  } catch (error) {
    rethrow(error, "Job post not found");
  }
}

export async function createContactMessage(input: Record<string, unknown>): Promise<ContactMessage> {
  try {
    const row = await db().contact_messages.create({
      data: { ...(input as Prisma.contact_messagesUncheckedCreateInput), read: false },
    });
    return serialize(row);
  } catch (error) {
    rethrow(error, "Message not found");
  }
}

export async function getJobApplications(filters?: { job_post_id?: string; status?: string }): Promise<JobApplication[]> {
  const rows = await db().job_applications.findMany({
    where: {
      ...(filters?.job_post_id ? { job_post_id: filters.job_post_id } : {}),
      ...(filters?.status ? { status: filters.status } : {}),
    },
    orderBy: { created_at: "desc" },
  });
  return serialize(rows);
}

export async function getJobApplicationById(id: string): Promise<JobApplication> {
  const row = await db().job_applications.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Job application not found");
  return serialize(row);
}

export async function createJobApplication(input: Record<string, unknown>): Promise<JobApplication> {
  try {
    const row = await db().job_applications.create({
      data: {
        ...(input as Prisma.job_applicationsUncheckedCreateInput),
        id: typeof input.id === "string" ? input.id : crypto.randomUUID(),
      },
    });
    const jobId = input.job_post_id;
    if (typeof jobId === "string" && jobId) {
      await db().job_posts.update({
        where: { id: jobId },
        data: { applications: { increment: 1 } },
      });
    }
    return serialize(row);
  } catch (error) {
    rethrow(error, "Job application not found");
  }
}

export async function updateJobApplication(id: string, input: Record<string, unknown>): Promise<JobApplication> {
  try {
    const row = await db().job_applications.update({
      where: { id },
      data: input as Prisma.job_applicationsUncheckedUpdateInput,
    });
    return serialize(row);
  } catch (error) {
    rethrow(error, "Job application not found");
  }
}

export async function deleteJobApplication(id: string): Promise<void> {
  try {
    await db().job_applications.delete({ where: { id } });
  } catch (error) {
    rethrow(error, "Job application not found");
  }
}
