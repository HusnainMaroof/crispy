import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import type { Request, Response } from "express";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { resolveTabs } from "../src/config/admin-tabs.js";
import { JobsController } from "../src/controllers/admin/jobs.controller.js";
import { JobApplicationsController } from "../src/controllers/admin/job-applications.controller.js";
import { StoreJobsController } from "../src/controllers/store/store-jobs.controller.js";
import {
  assertJobApplicationAccess,
  assertJobPostAccess,
  createJobApplication,
  deleteJobApplication,
  getJobPosts,
  getJobPostTypes,
} from "../src/services/admin.service.js";
import { createStaff } from "../src/services/staff.service.js";
import { jobPostUpdateSchema } from "../src/validators/admin.schema.js";
import { FIRST_PAGE } from "./helpers/page.js";
import type { AuthPayload } from "../src/types/responses.js";
import type { JobPost } from "../src/types/models.js";
import { BadRequestException, ForbiddenException, NotFoundException } from "../src/utils/app-error.js";

const prisma = getPrisma();

const staffIds: string[] = [];
const postIds: string[] = [];
const applicationIds: string[] = [];

const superadmin: AuthPayload = {
  sub: "job-scope-super",
  email: "super@job-scope.test",
  role: "superadmin",
  tabs: [],
};

/**
 * Real branches, read only.
 *
 * This suite never inserts or deletes a `locations` row. Test files run in
 * separate processes against one database and `mock-catalogue.test.ts` asserts
 * the branch count, so a branch created here would break an unrelated suite.
 * Assertions are therefore written against this suite's own ids rather than
 * global totals.
 */
async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row, `real branch ${slug} is missing`);
  return row;
}

async function manager(branchIds: string[]): Promise<AuthPayload> {
  // createStaff insists a branch-scoped account is given at least one branch, so
  // "assigned to nothing" is reached by assigning one and then removing it.
  const seed = branchIds.length > 0 ? branchIds : [(await branch("harrow-road")).id];
  const person = await createStaff(superadmin, {
    name: "Job Scope Super",
    email: `${crypto.randomUUID()}@job-scope.test`,
    password: "correct-horse",
    role: "branch_manager",
    branchIds: seed,
  });
  staffIds.push(person.id);
  if (branchIds.length === 0) {
    await prisma.admin_branch_access.deleteMany({ where: { admin_id: person.id } });
  }
  return { sub: person.id, email: person.email, role: "branch_manager", tabs: ["posts"] };
}

async function post(branchId: string | null, status = "active", type = "Full-time"): Promise<string> {
  const id = crypto.randomUUID();
  postIds.push(id);
  await prisma.job_posts.create({
    data: {
      id,
      title: "Line Cook",
      // Deliberately wrong. Reads must prefer the live branch name, so the stored
      // copy can never be what a renamed branch shows.
      location: "Stale Snapshot",
      location_id: branchId,
      type,
      salary: "£12/hr",
      description: "Work the line.",
      status,
    },
  });
  return id;
}

async function application(postId: string) {
  const created = await createJobApplication({
    job_post_id: postId,
    applicant_name: "Candidate",
    email: "candidate@job-scope.test",
  });
  applicationIds.push(created.id);
  return created;
}

function capture() {
  const sent: { status?: number; body?: { success: boolean; data: unknown; pagination?: unknown } } = {};
  const response = {
    status(code: number) {
      sent.status = code;
      return this;
    },
    json(body: { success: boolean; data: unknown; pagination?: unknown }) {
      sent.body = body;
      return this;
    },
  };
  return { sent, res: response as unknown as Response };
}

function request(admin: AuthPayload, extra: { query?: unknown; body?: unknown; params?: unknown } = {}) {
  return {
    admin,
    query: extra.query ?? {},
    body: extra.body ?? {},
    params: extra.params ?? {},
  } as unknown as Request;
}

function ids(rows: unknown): string[] {
  return (rows as { id: string }[]).map((row) => row.id);
}

function total(captured: ReturnType<typeof capture>): number {
  return (captured.sent.body?.pagination as { total: number }).total;
}

/** Only this suite's own rows, so seeded data cannot satisfy or break an assertion. */
function mine(rows: unknown): string[] {
  const own = new Set(postIds);
  return ids(rows).filter((id) => own.has(id));
}

const postBody = {
  title: "Line Cook",
  type: "Full-time",
  salary: "£12/hr",
  description: "Work the line.",
  requirements: ["Punctual"],
};

describe("job posts are scoped to a branch", { concurrency: 1 }, () => {
  it("gives the Job Posts tab to a branch manager but never to staff", () => {
    assert.equal(resolveTabs("branch_manager", []).includes("posts"), true);
    assert.equal(resolveTabs("branch_manager", ["orders", "posts"]).includes("posts"), true);
    assert.equal(resolveTabs("staff", ["posts"]).includes("posts"), false);
  });

  it("shows a manager only the posts on their own branches", async () => {
    const mineBranch = await branch("harrow-road");
    const theirs = await branch("tower-hill");
    const actor = await manager([mineBranch.id]);
    const myPost = await post(mineBranch.id);
    await post(theirs.id);

    const captured = capture();
    await JobsController.list(request(actor, { query: {} }), captured.res);
    const rows = captured.sent.body?.data as JobPost[];

    assert.equal(mine(captured.sent.body?.data).includes(myPost), true);
    // Every row a manager sees must sit on a branch they are assigned to.
    for (const row of rows) assert.equal(row.location_id, mineBranch.id);
    // total has to agree with the page, or the grid paginates on a lie.
    assert.equal(total(captured), rows.length);
  });

  it("shows a super admin every branch and a manager with no assignment none", async () => {
    const one = await branch("harrow-road");
    const two = await branch("tower-hill");
    const first = await post(one.id);
    const second = await post(two.id);

    const owner = capture();
    await JobsController.list(request(superadmin, { query: {} }), owner.res);
    const seen = mine(owner.sent.body?.data);
    assert.equal(seen.includes(first), true);
    assert.equal(seen.includes(second), true);

    const unassigned = await manager([]);
    const none = capture();
    await JobsController.list(request(unassigned, { query: {} }), none.res);
    assert.deepEqual(mine(none.sent.body?.data), []);
  });

  it("narrows a list to one branch and refuses a branch the caller cannot use", async () => {
    const mineBranch = await branch("harrow-road");
    const theirs = await branch("tower-hill");
    const actor = await manager([mineBranch.id]);
    await post(mineBranch.id, "active", "Weekend Cover");
    await post(theirs.id, "active", "Night Audit");

    const narrowed = capture();
    await JobsController.list(request(actor, { query: { location_id: mineBranch.id } }), narrowed.res);
    for (const row of narrowed.sent.body?.data as JobPost[]) {
      assert.equal(row.location_id, mineBranch.id);
    }

    await assert.rejects(
      () => JobsController.list(request(actor, { query: { location_id: theirs.id } }), capture().res),
      (error: unknown) => {
        // 403 to match every other branch route in the admin API, not 400.
        assert.ok(error instanceof ForbiddenException);
        assert.equal(error.statusCode, 403);
        return true;
      },
    );
  });

  it("hides another branch's post from a manager and answers not-found, not forbidden", async () => {
    const actor = await manager([(await branch("harrow-road")).id]);
    const foreign = await post((await branch("tower-hill")).id);

    // 404 rather than 403 so the status code cannot be used to probe for rows.
    await assert.rejects(
      () => JobsController.getById(request(actor, { params: { id: foreign } }), capture().res),
      (error: unknown) => {
        assert.ok(error instanceof NotFoundException);
        assert.equal(error.statusCode, 404);
        assert.equal(error.message, "Job post not found");
        return true;
      },
    );
  });

  it("treats a post with no branch as out of reach for every branch-scoped role", async () => {
    const actor = await manager([(await branch("harrow-road")).id]);
    const unbound = await post(null);

    await assert.rejects(
      () => JobsController.getById(request(actor, { params: { id: unbound } }), capture().res),
      NotFoundException,
    );

    // A super admin can still reach it, otherwise it could never be re-assigned.
    const owner = capture();
    await JobsController.getById(request(superadmin, { params: { id: unbound } }), owner.res);
    assert.equal(((owner.sent.body?.data as JobPost).id), unbound);
  });

  it("scopes an application to the branch of the post it belongs to", async () => {
    const mineBranch = await branch("harrow-road");
    const theirs = await branch("tower-hill");
    const actor = await manager([mineBranch.id]);
    const mineApplication = await application(await post(mineBranch.id));
    const foreignApplication = await application(await post(theirs.id));

    const captured = capture();
    await JobApplicationsController.list(request(actor, { query: {} }), captured.res);
    const own = new Set(applicationIds);
    const listed = ids(captured.sent.body?.data).filter((id) => own.has(id));
    assert.equal(listed.includes(mineApplication.id), true);
    assert.equal(listed.includes(foreignApplication.id), false);
    assert.equal(total(captured), (captured.sent.body?.data as unknown[]).length);

    // The detail read and every write path have to be guarded too, or the list
    // filter is the only thing between a manager and another branch's candidates.
    await assert.rejects(
      () => JobApplicationsController.getById(request(actor, { params: { id: foreignApplication.id } }), capture().res),
      NotFoundException,
    );
    await assert.rejects(
      () =>
        JobApplicationsController.updateStatus(
          request(actor, { params: { id: foreignApplication.id }, body: { status: "reviewed" } }),
          capture().res,
        ),
      NotFoundException,
    );
    await assert.rejects(
      () =>
        JobApplicationsController.update(
          request(actor, { params: { id: foreignApplication.id }, body: { notes: "peeked" } }),
          capture().res,
        ),
      NotFoundException,
    );
    await assert.rejects(
      () => JobApplicationsController.remove(request(actor, { params: { id: foreignApplication.id } }), capture().res),
      NotFoundException,
    );
  });

  it("refuses a write that names a branch the caller does not manage", async () => {
    const actor = await manager([(await branch("harrow-road")).id]);
    const theirs = await branch("tower-hill");
    const before = await prisma.job_posts.count({ where: { location_id: theirs.id } });

    await assert.rejects(
      () => JobsController.create(request(actor, { body: { ...postBody, location_id: theirs.id } }), capture().res),
      ForbiddenException,
    );

    // Nothing may have been written on the way out.
    assert.equal(await prisma.job_posts.count({ where: { location_id: theirs.id } }), before);
  });

  it("refuses to change, close or delete a post on a branch the caller cannot manage", async () => {
    const theirs = await branch("tower-hill");
    const actor = await manager([(await branch("harrow-road")).id]);
    const foreign = await post(theirs.id);

    for (const call of [
      () => JobsController.update(request(actor, { params: { id: foreign }, body: { title: "Moved" } }), capture().res),
      () =>
        JobsController.updateStatus(
          request(actor, { params: { id: foreign }, body: { status: "closed" } }),
          capture().res,
        ),
      () => JobsController.remove(request(actor, { params: { id: foreign } }), capture().res),
    ]) {
      await assert.rejects(call, NotFoundException);
    }

    const row = await prisma.job_posts.findUnique({ where: { id: foreign }, select: { title: true, status: true } });
    assert.equal(row?.title, "Line Cook");
    assert.equal(row?.status, "active");
  });

  it("requires a branch on create and rejects one that does not exist", async () => {
    await assert.rejects(
      () => JobsController.create(request(superadmin, { body: postBody }), capture().res),
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.equal(error.statusCode, 400);
        return true;
      },
    );

    await assert.rejects(
      () =>
        JobsController.create(
          request(superadmin, { body: { ...postBody, location_id: crypto.randomUUID() } }),
          capture().res,
        ),
      // A bad branch id is a bad request, not "the post you are creating is
      // missing". Reusing the 404 wording would be actively misleading.
      (error: unknown) => {
        assert.ok(error instanceof BadRequestException);
        assert.equal(error.message, "That branch does not exist");
        return true;
      },
    );
  });

  it("writes the branch name from the branch row, not from the request", async () => {
    const target = await branch("stockwell");
    const captured = capture();

    await JobsController.create(
      request(superadmin, {
        body: {
          ...postBody,
          location_id: target.id,
          // A forged label must not reach the storefront.
          location: "Middlesbrough",
        },
      }),
      captured.res,
    );

    const created = captured.sent.body?.data as JobPost;
    postIds.push(created.id);
    assert.equal(created.location, target.name);
    assert.equal(created.location_id, target.id);
    assert.equal(captured.sent.status, 201);

    // And the stored copy agrees, so a later read cannot resurrect the forged one.
    const stored = await prisma.job_posts.findUnique({ where: { id: created.id }, select: { location: true } });
    assert.equal(stored?.location, target.name);
  });

  it("keeps the branch on an edit that does not move it, and re-checks one that does", async () => {
    const mineBranch = await branch("harrow-road");
    const theirs = await branch("tower-hill");
    const actor = await manager([mineBranch.id]);
    const id = await post(mineBranch.id);

    const stay = capture();
    await JobsController.update(request(actor, { params: { id }, body: { title: "Senior Line Cook" } }), stay.res);
    const updated = stay.sent.body?.data as JobPost;
    assert.equal(updated.location_id, mineBranch.id);
    assert.equal(updated.location, mineBranch.name);
    assert.equal(updated.title, "Senior Line Cook");

    await assert.rejects(
      () =>
        JobsController.update(
          request(actor, { params: { id }, body: { title: "Moved", location_id: theirs.id } }),
          capture().res,
        ),
      ForbiddenException,
    );
    assert.equal(
      (await prisma.job_posts.findUnique({ where: { id }, select: { location_id: true } }))?.location_id,
      mineBranch.id,
    );
  });

  it("suggests only the job types in use on the branches the caller can see", async () => {
    const mineBranch = await branch("harrow-road");
    const theirs = await branch("tower-hill");
    const actor = await manager([mineBranch.id]);
    // Unique per run so a value from another suite cannot satisfy the assertion.
    const mineOnly = `Scope ${crypto.randomUUID().slice(0, 8)}`;
    const foreignOnly = `Foreign ${crypto.randomUUID().slice(0, 8)}`;
    await post(mineBranch.id, "active", mineOnly);
    await post(theirs.id, "active", foreignOnly);

    const mineTypes = await getJobPostTypes({ location_ids: [mineBranch.id] });
    assert.equal(mineTypes.includes(mineOnly), true);
    assert.equal(mineTypes.includes(foreignOnly), false);

    // An empty array means a manager with no branches, which must suggest nothing.
    assert.deepEqual(await getJobPostTypes({ location_ids: [] }), []);

    const captured = capture();
    await JobsController.fieldValues(request(actor), captured.res);
    const payload = captured.sent.body?.data as { branches: { id: string }[]; types: string[] };
    assert.deepEqual(payload.branches.map((row) => row.id), [mineBranch.id]);
    assert.equal(payload.types.includes(mineOnly), true);
    assert.equal(payload.types.includes(foreignOnly), false);
  });

  it("prefers the live branch name over the stored copy", async () => {
    const target = await branch("edgware-road");
    const id = await post(target.id);

    const rows = await getJobPosts({ location_ids: [target.id] });
    const row = rows.find((entry) => entry.id === id);
    assert.ok(row);
    // The row was written with "Stale Snapshot". Reads must return the branch name.
    assert.equal(row.location, target.name);
    assert.notEqual(row.location, "Stale Snapshot");
  });

  it("keeps a post when its branch is removed rather than cascading the delete", async () => {
    // The branch row itself cannot be deleted here without breaking the branch
    // count another suite asserts, so the guarantee is checked on the constraint:
    // ON DELETE SET NULL is what stops a branch removal taking its posts with it.
    // `confdeltype` is a char, cast to text or Prisma cannot deserialize it.
    const rows = await prisma.$queryRaw<{ confdeltype: string }[]>`
      SELECT confdeltype::text AS confdeltype
      FROM pg_constraint
      WHERE conname = 'job_posts_location_id_fkey'
    `;

    assert.equal(rows.length, 1);
    assert.equal(rows[0].confdeltype, "n", "confdeltype n means ON DELETE SET NULL");
  });

  it("decrements the post counter when an application is removed", async () => {
    const id = await post((await branch("harrow-road")).id);
    const created = await application(id);
    const counter = async () =>
      (await prisma.job_posts.findUnique({ where: { id }, select: { applications: true } }))?.applications;

    assert.equal(await counter(), 1);
    await deleteJobApplication(created.id);
    assert.equal(await counter(), 0);

    // A second delete must 404 rather than decrement a second time.
    await assert.rejects(() => deleteJobApplication(created.id), NotFoundException);
    assert.equal(await counter(), 0);
  });

  it("publishes only active posts, filtered by branch, without internal fields", async () => {
    const mineBranch = await branch("harrow-road");
    const theirs = await branch("tower-hill");
    const activeMine = await post(mineBranch.id);
    const draftMine = await post(mineBranch.id, "draft");
    const closedMine = await post(mineBranch.id, "closed");
    const activeTheirs = await post(theirs.id);

    const all = capture();
    await StoreJobsController.list(request(superadmin), all.res);
    const rows = all.sent.body?.data as Record<string, unknown>[];
    const published = mine(all.sent.body?.data);
    assert.equal(published.includes(activeMine), true);
    assert.equal(published.includes(activeTheirs), true);
    assert.equal(published.includes(draftMine), false, "a draft must not be public");
    assert.equal(published.includes(closedMine), false, "a closed post must not be public");
    assert.equal("status" in rows[0], false);
    assert.equal("applications" in rows[0], false);
    assert.equal("updated_at" in rows[0], false);
    assert.equal("location_id" in rows[0], true, "the careers filter needs it");

    const filtered = capture();
    await StoreJobsController.list(request(superadmin, { query: { location_id: theirs.id } }), filtered.res);
    // These branches hold real seeded posts too, so the filter is asserted by
    // narrowing rather than by an exact total.
    const filteredIds = ids(filtered.sent.body?.data);
    assert.equal(filteredIds.includes(activeTheirs), true);
    assert.equal(filteredIds.includes(activeMine), false, "a filter must not fall back to every branch");
    for (const row of filtered.sent.body?.data as { location_id: string }[]) {
      assert.equal(row.location_id, theirs.id);
    }
  });

  it("rejects an empty update body instead of reaching the database with no fields", () => {
    assert.equal(jobPostUpdateSchema.safeParse({}).success, false);
    assert.equal(jobPostUpdateSchema.safeParse({ title: "Chef" }).success, true);
  });

  it("exposes the guard helpers for direct use", async () => {
    const mineBranch = await branch("harrow-road");
    const actor = await manager([mineBranch.id]);
    const id = await post(mineBranch.id);
    assert.equal((await assertJobPostAccess(actor, id)).id, id);
    assert.equal((await assertJobApplicationAccess(actor, (await application(id)).id)).job_post_id, id);
    assert.equal(FIRST_PAGE.limit > 0, true);
  });
});

after(async () => {
  if (applicationIds.length) await prisma.job_applications.deleteMany({ where: { id: { in: applicationIds } } });
  if (postIds.length) await prisma.job_posts.deleteMany({ where: { id: { in: postIds } } });
  if (staffIds.length) await prisma.admin_profiles.deleteMany({ where: { id: { in: staffIds } } });
  await prisma.$disconnect();
});