import { Prisma } from "../generated/prisma/client.js";
import { getPrisma, getReadPrisma } from "../config/prisma.js";
import { BadRequestException, InternalServerException, NotFoundException } from "../utils/app-error.js";
import { slugifyBranchName } from "../utils/slug.js";
import { rethrow, serialize } from "../utils/db.js";
import { getAccessibleLocationIds } from "./branch-access.service.js";
import type { PageRequest } from "../utils/pagination.js";
import type { AuthPayload } from "../types/responses.js";
import type { Location, BusinessSettings, JobPost, JobApplication, ContactMessage } from "../types/models.js";
import {
  cachedJson,
  invalidateCatalogueCache,
  invalidateJobsCache,
  invalidateLocationsCache,
  invalidateSettingsCache,
  TTL_JOBS_SECONDS,
  TTL_LOCATIONS_SECONDS,
  TTL_SETTINGS_SECONDS,
} from "../utils/cache.js";

/** `read` routes lag-tolerant public reads to the replica. Default: primary. */
function db(read?: boolean) {
  return read ? getReadPrisma() : getPrisma();
}

/**
 * Branches are bounded reference data (one row per shop), so this is capped
 * rather than paginated. `allowedIds` filters in the database: a branch manager
 * was previously handed every branch row and the list was trimmed afterwards.
 */
type LocationsReadOptions = {
  activeOnly?: boolean;
  allowedIds?: string[] | null;
  limit?: number;
  /** Public anonymous reads only: may use the replica and the short cache. */
  read?: boolean;
  cache?: boolean;
};

export async function getLocations(options?: LocationsReadOptions): Promise<Location[]> {
  const load = () => loadLocations(options?.cache ? { ...options, read: false } : options);
  // The public branch list is anonymous, cookie-free, and changes rarely.
  if (options?.cache && !options?.allowedIds) {
    return cachedJson(`locations:${options.activeOnly ? "active" : "all"}`, TTL_LOCATIONS_SECONDS, load);
  }
  return load();
}

async function loadLocations(options?: LocationsReadOptions): Promise<Location[]> {
  const rows = await db(options?.read).locations.findMany({
    where: {
      ...(options?.activeOnly ? { status: "active" } : {}),
      ...(options?.allowedIds ? { id: { in: options.allowedIds } } : {}),
    },
    orderBy: { sort_order: "asc" },
    take: options?.limit ?? 500,
  });
  return serialize(rows);
}

export async function getLocationById(id: string, options?: { read?: boolean }): Promise<Location> {
  const row = await db(options?.read).locations.findUnique({ where: { id } });
  if (!row) throw new NotFoundException("Location not found");
  return serialize(row);
}

export async function updateLocation(id: string, input: Record<string, unknown>): Promise<Location> {
  try {
    const row = await db().locations.update({
      where: { id },
      data: input as Prisma.locationsUncheckedUpdateInput,
    });
    void invalidateLocationsCache();
    void invalidateCatalogueCache();
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
    void invalidateLocationsCache();
    void invalidateCatalogueCache();
    return serialize(row);
  } catch (error) {
    rethrow(error, "Location not found");
  }
}

export async function deleteLocation(id: string): Promise<void> {
  try {
    await db().locations.delete({ where: { id } });
    void invalidateLocationsCache();
    void invalidateCatalogueCache();
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

export async function getSettings(options?: { read?: boolean; cache?: boolean }): Promise<BusinessSettings> {
  const load = async (): Promise<BusinessSettings> => {
    const row = await db(options?.cache ? false : options?.read).business_settings.findFirst({ orderBy: { id: "asc" } });
    if (!row) throw new InternalServerException("Failed to fetch settings");
    return serialize(row);
  };
  if (options?.cache) return cachedJson("settings", TTL_SETTINGS_SECONDS, load);
  return load();
}

export async function updateSettings(input: Record<string, unknown>): Promise<BusinessSettings> {
  try {
    const target = await ensureSettings();
    const row = await db().business_settings.update({
      where: { id: target.id },
      data: input as Prisma.business_settingsUncheckedUpdateInput,
    });
    void invalidateSettingsCache();
    return serialize(row);
  } catch (error) {
    rethrow(error, "Settings not found");
  }
}

/**
 * `location_ids: null` means every branch (super admin). An array is the only
 * branches the caller may see. `location_id` is a single-branch narrowing on top
 * of that, so the two have to be ANDed rather than written to the same key.
 */
export type JobPostBranchScope = { location_id?: string; location_ids?: string[] | null };

/**
 * `location` on the row is a snapshot of the branch name taken on write, so a
 * branch rename would leave every one of its posts showing the old name. Reads
 * therefore pull the live name and only fall back to the snapshot for a post
 * with no branch at all.
 */
const JOB_LOCATION_INCLUDE = { location_ref: { select: { name: true } } } as const;

function withLiveLocation(row: {
  location: string;
  location_ref: { name: string } | null;
  [key: string]: unknown;
}): Record<string, unknown> {
  const { location_ref, ...rest } = row;
  return { ...rest, location: location_ref?.name ?? rest.location ?? "" };
}

function jobPostBranchWhere(scope?: JobPostBranchScope): Prisma.job_postsWhereInput[] {
  const location: Prisma.job_postsWhereInput[] = [];
  if (scope?.location_id) location.push({ location_id: scope.location_id });
  if (scope?.location_ids) location.push({ location_id: { in: scope.location_ids } });
  return location;
}

export async function getJobPosts(
  filter?: { status?: string; q?: string } & JobPostBranchScope & Partial<PageRequest> & { read?: boolean; cache?: boolean },
): Promise<JobPost[]> {
  const load = () => loadJobPosts(filter?.cache ? { ...filter, read: false } : filter);
  // Public careers list only. A search, a branch allow-list, or any status
  // other than active is an admin query and must not share this entry.
  if (
    filter?.cache &&
    filter.status === "active" &&
    !filter.q &&
    !filter.location_ids
  ) {
    return cachedJson(
      `jobs:public:${filter.location_id ?? "all"}:${filter.limit ?? "all"}`,
      TTL_JOBS_SECONDS,
      load,
    );
  }
  return load();
}

async function loadJobPosts(
  filter?: { status?: string; q?: string } & JobPostBranchScope & Partial<PageRequest> & { read?: boolean },
): Promise<JobPost[]> {
  const where = jobPostWhere(filter);
  const rows = await db(filter?.read).job_posts.findMany({
    where,
    ...(filter?.limit ? { skip: filter.skip ?? 0, take: filter.limit } : {}),
    // id DESC breaks ties on created_at so a row cannot appear on two pages.
    orderBy: [{ created_at: "desc" }, { id: "desc" }],
    include: JOB_LOCATION_INCLUDE,
  });
  return serialize(rows.map(withLiveLocation));
}

export async function countJobPosts(filter?: { status?: string; q?: string } & JobPostBranchScope): Promise<number> {
  return db().job_posts.count({ where: jobPostWhere(filter) });
}

function jobPostWhere(filter?: { status?: string; q?: string } & JobPostBranchScope) {
  const q = filter?.q?.trim();
  const branch = jobPostBranchWhere(filter);
  return {
    ...(filter?.status ? { status: filter.status } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: "insensitive" as const } },
            { type: { contains: q, mode: "insensitive" as const } },
            // The stored `location` is a write-time snapshot, so a renamed branch
            // would stop matching its own name. The relation is searched too.
            { location: { contains: q, mode: "insensitive" as const } },
            { location_ref: { name: { contains: q, mode: "insensitive" as const } } },
          ],
        }
      : {}),
    ...(branch.length > 0 ? { AND: branch } : {}),
  };
}

/**
 * The job type is free text by design: a manager can introduce a type nobody
 * uses yet. The create/edit form shows this list as suggestions, so it is scoped
 * to the branches the caller can see and keeps only values already in use.
 *
 * groupBy rather than `findMany` + `distinct`: on Postgres a distinct read maps
 * to `DISTINCT ON` and depends on the orderBy leading with the distinct column.
 * groupBy states the intent directly and cannot drift with the ordering.
 */
export async function getJobPostTypes(scope?: JobPostBranchScope): Promise<string[]> {
  const branch = jobPostBranchWhere(scope);
  const rows = await db().job_posts.groupBy({
    by: ["type"],
    where: { ...(branch.length > 0 ? { AND: branch } : {}) },
    orderBy: { type: "asc" },
  });
  return rows.map((row) => row.type).filter((value) => value.trim() !== "");
}

export async function getJobPostById(id: string): Promise<JobPost> {
  const row = await db().job_posts.findUnique({ where: { id }, include: JOB_LOCATION_INCLUDE });
  if (!row) throw new NotFoundException("Job post not found");
  return serialize(withLiveLocation(row));
}

/**
 * Reads the branch label for a post. `location` is a display copy of
 * `locations.name`, so it is refreshed here instead of trusting whatever the
 * request body sent, otherwise the public list could show a branch that does not
 * match `location_id`.
 *
 * A missing branch is a bad branch id, not a missing job post, so it must not
 * borrow the 404 message: a super admin who typed a stale id would otherwise be
 * told the post they are creating does not exist.
 */
export async function resolveJobPostLocation(locationId: string): Promise<string> {
  const branch = await db().locations.findUnique({ where: { id: locationId }, select: { name: true } });
  if (!branch) throw new BadRequestException("That branch does not exist");
  return branch.name;
}

export async function createJobPost(input: Record<string, unknown>): Promise<JobPost> {
  try {
    const row = await db().job_posts.create({
      data: {
        ...(input as Prisma.job_postsUncheckedCreateInput),
        id: typeof input.id === "string" ? input.id : crypto.randomUUID(),
        applications: 0,
      },
      include: JOB_LOCATION_INCLUDE,
    });
    void invalidateJobsCache();
    return serialize(withLiveLocation(row));
  } catch (error) {
    rethrow(error, "Job post not found");
  }
}

export async function updateJobPost(id: string, input: Record<string, unknown>): Promise<JobPost> {
  try {
    const row = await db().job_posts.update({
      where: { id },
      data: input as Prisma.job_postsUncheckedUpdateInput,
      include: JOB_LOCATION_INCLUDE,
    });
    void invalidateJobsCache();
    return serialize(withLiveLocation(row));
  } catch (error) {
    rethrow(error, "Job post not found");
  }
}

export async function deleteJobPost(id: string): Promise<void> {
  try {
    await db().job_posts.delete({ where: { id } });
    void invalidateJobsCache();
  } catch (error) {
    rethrow(error, "Job post not found");
  }
}

/**
 * Single-row branch guard for the admin job routes. An unbound post
 * (`location_id IS NULL`, e.g. one created before branch scoping) is treated as
 * out of reach for every branch-scoped role, so it can only be managed by a
 * super admin.
 *
 * 404 rather than 403 so a branch manager cannot probe for rows that exist by
 * watching the status code change.
 */
export async function assertJobPostAccess(
  admin: Pick<AuthPayload, "sub" | "role">,
  id: string,
): Promise<JobPost> {
  const post = await getJobPostById(id);
  const allowed = await getAccessibleLocationIds(admin);
  if (allowed === null) return post;
  if (!post.location_id || !allowed.includes(post.location_id)) {
    throw new NotFoundException("Job post not found");
  }
  return post;
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
  filters?: { job_post_id?: string; status?: string; q?: string } & JobPostBranchScope & Partial<PageRequest>,
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

export async function countJobApplications(
  filters?: { job_post_id?: string; status?: string; q?: string } & JobPostBranchScope,
): Promise<number> {
  return db().job_applications.count({ where: jobApplicationWhere(filters) });
}

/**
 * Applications inherit the branch of the post they belong to, so the branch
 * scope is a relation predicate rather than a column on this table. An unbound
 * post matches no branch and therefore stays hidden from branch-scoped roles.
 */
function jobApplicationWhere(
  filters?: { job_post_id?: string; status?: string; q?: string } & JobPostBranchScope,
) {
  const q = filters?.q?.trim();
  const branch = jobPostBranchWhere(filters);
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
    ...(branch.length > 0 ? { job_post: { AND: branch } } : {}),
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

/** Single-row branch guard for the admin application routes. */
export async function assertJobApplicationAccess(
  admin: Pick<AuthPayload, "sub" | "role">,
  id: string,
): Promise<JobApplication> {
  const allowed = await getAccessibleLocationIds(admin);
  if (allowed === null) return getJobApplicationById(id);

  const row = await db().job_applications.findUnique({
    where: { id },
    select: { job_post: { select: { location_id: true } } },
  });
  const locationId = row?.job_post.location_id ?? null;
  if (!locationId || !allowed.includes(locationId)) {
    throw new NotFoundException("Job application not found");
  }
  return getJobApplicationById(id);
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

/**
 * Deletes the application and decrements the post counter in one transaction.
 *
 * `createJobApplication` increments the same counter, so leaving the delete side
 * out made `applications` drift permanently upward: the admin grid showed a
 * count that no longer matched the rows. Doing both in a transaction also stops
 * a failure between them from skewing the count again.
 */
export async function deleteJobApplication(id: string): Promise<void> {
  try {
    const row = await db().job_applications.findUnique({ where: { id }, select: { job_post_id: true } });
    if (!row) throw new NotFoundException("Job application not found");

    await db().$transaction(async (tx) => {
      await tx.job_applications.delete({ where: { id } });
      await tx.job_posts.update({
        where: { id: row.job_post_id },
        data: { applications: { decrement: 1 } },
      });
    });
  } catch (error) {
    rethrow(error, "Job application not found");
  }
}
