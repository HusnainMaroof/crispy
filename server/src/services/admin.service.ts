import { Prisma } from "../generated/prisma/client.js";
import { getPrisma } from "../config/prisma.js";
import { InternalServerException, NotFoundException } from "../utils/app-error.js";
import { slugifyBranchName } from "../utils/slug.js";
import { rethrow, serialize } from "../utils/db.js";
import type { PageRequest } from "../utils/pagination.js";
import type { Location, BusinessSettings, JobPost, JobApplication, ContactMessage } from "../types/models.js";

function db() {
  return getPrisma();
}

/**
 * Branches are bounded reference data (one row per shop), so this is capped
 * rather than paginated. `allowedIds` filters in the database: a branch manager
 * was previously handed every branch row and the list was trimmed afterwards.
 */
export async function getLocations(options?: { activeOnly?: boolean; allowedIds?: string[] | null; limit?: number }): Promise<Location[]> {
  const rows = await db().locations.findMany({
    where: {
      ...(options?.activeOnly ? { status: "active" } : {}),
      ...(options?.allowedIds ? { id: { in: options.allowedIds } } : {}),
    },
    orderBy: { sort_order: "asc" },
    take: options?.limit ?? 500,
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

/**
 * business_settings is a singleton but its id is autoincrement, so "the one
 * row" is not a fixed id. Reading with findFirst and writing with a hardcoded
 * `where: { id: 1 }` disagreed with each other: on a table with no row the read
 * threw a 500 and the write threw a 404. Both now resolve the same row, and
 * create it with the schema defaults if the table is empty.
 */
const DEFAULT_SETTINGS = { delivery_fee: 2.99, free_delivery_threshold: 20 } as const;

async function ensureSettings() {
  const existing = await db().business_settings.findFirst({
    orderBy: { id: "asc" },
    select: { id: true },
  });
  if (existing) return existing;
  return db().business_settings.create({ data: DEFAULT_SETTINGS, select: { id: true } });
}

export async function getSettings(): Promise<BusinessSettings> {
  const row = await db().business_settings.findFirst({ orderBy: { id: "asc" } });
  if (!row) throw new InternalServerException("Failed to fetch settings");
  return serialize(row);
}

export async function updateSettings(input: Record<string, unknown>): Promise<BusinessSettings> {
  try {
    const target = await ensureSettings();
    const row = await db().business_settings.update({
      where: { id: target.id },
      data: input as Prisma.business_settingsUncheckedUpdateInput,
    });
    return serialize(row);
  } catch (error) {
    rethrow(error, "Settings not found");
  }
}

export async function getJobPosts(
  filter?: { status?: string; q?: string } & Partial<PageRequest>,
): Promise<JobPost[]> {
  const where = jobPostWhere(filter);
  const rows = await db().job_posts.findMany({
    where,
    ...(filter?.limit ? { skip: filter.skip ?? 0, take: filter.limit } : {}),
    // id DESC breaks ties on created_at so a row cannot appear on two pages.
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
  });
  return serialize(rows);
}

export async function countJobPosts(filter?: { status?: string; q?: string }): Promise<number> {
  return db().job_posts.count({ where: jobPostWhere(filter) });
}

function jobPostWhere(filter?: { status?: string; q?: string }) {
  const q = filter?.q?.trim();
  return {
    ...(filter?.status ? { status: filter.status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { location: { contains: q, mode: "insensitive" as const } },
            { type: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
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
    rethrow(error, "Message could not be saved");
  }
}

export async function getJobApplications(
  filters?: { job_post_id?: string; status?: string; q?: string } & Partial<PageRequest>,
): Promise<JobApplication[]> {
  const where = jobApplicationWhere(filters);
  const rows = await db().job_applications.findMany({
    where,
    ...(filters?.limit ? { skip: filters.skip ?? 0, take: filters.limit } : {}),
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    // The applications grid resolved the job title by looking the id up in a
    // separately loaded job-posts array. Once that list is paged the lookup
    // misses, so the title travels with the row.
    include: { job_post: { select: { title: true } } },
  });
  return serialize(rows.map(withJobTitle));
}

export async function countJobApplications(filters?: { job_post_id?: string; status?: string; q?: string }): Promise<number> {
  return db().job_applications.count({ where: jobApplicationWhere(filters) });
}

function jobApplicationWhere(filters?: { job_post_id?: string; status?: string; q?: string }) {
  const q = filters?.q?.trim();
  return {
    ...(filters?.job_post_id ? { job_post_id: filters.job_post_id } : {}),
    ...(filters?.status ? { status: filters.status } : {}),
    ...(q
      ? {
          OR: [
            { applicant_name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

function withJobTitle(row: {
  job_post: { title: string } | null;
  [key: string]: unknown;
}): Record<string, unknown> {
  const { job_post, ...rest } = row;
  return { ...rest, job_title: job_post?.title ?? null };
}

export async function getJobApplicationById(id: string): Promise<JobApplication> {
  const row = await db().job_applications.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Job application not found");
  return serialize(row);
}

export async function createJobApplication(
  input: Record<string, unknown>,
  options?: { activeOnly?: boolean },
): Promise<JobApplication> {
  const jobId = typeof input.job_post_id === "string" ? input.job_post_id : "";
  if (!jobId) throw new NotFoundException("Job post not found");

  try {
    // Checked up front because job_post_id comes from the URL on the public
    // apply route. Letting the insert hit a foreign key violation instead
    // surfaced the raw Postgres constraint text to an anonymous caller.
    // Public apply uses the same visibility as GET /api/store/jobs/:id: anything
    // other than active is "not found", including a missing id, so the response
    // does not reveal that a draft or closed post exists.
    const post = await db().job_posts.findUnique({ where: { id: jobId }, select: { id: true, status: true } });
    if (!post || (options?.activeOnly && post.status !== "active")) {
      throw new NotFoundException("Job post not found");
    }

    // The insert and the counter belong to one unit of work. Untx'd, a failure
    // between them left applications permanently miscounted, and two
    // concurrent applications could interleave their read-modify-write.
    return await db().$transaction(async (tx) => {
      const row = await tx.job_applications.create({
        data: {
          ...(input as Prisma.job_applicationsUncheckedCreateInput),
          id: typeof input.id === "string" ? input.id : crypto.randomUUID(),
        },
      });
      await tx.job_posts.update({
        where: { id: jobId },
        data: { applications: { increment: 1 } },
      });
      return serialize(row);
    });
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
