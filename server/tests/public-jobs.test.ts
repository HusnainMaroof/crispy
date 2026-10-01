import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import type { Request, Response } from "express";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { ActionsController } from "../src/controllers/store/actions.controller.js";
import { createJobApplication } from "../src/services/admin.service.js";
import { NotFoundException } from "../src/utils/app-error.js";

const prisma = getPrisma();
const postIds: string[] = [];
const applicationIds: string[] = [];

function capture() {
  const sent: { body?: { data: { id: string; job_post_id: string } } } = {};
  const response = {
    status() {
      return this;
    },
    json(body: { data: { id: string; job_post_id: string } }) {
      sent.body = body;
      return this;
    },
  };
  return { sent, res: response as unknown as Response };
}

async function post(status: string) {
  const id = crypto.randomUUID();
  postIds.push(id);
  await prisma.job_posts.create({
    data: {
      id,
      title: "Cook",
      location: "London",
      type: "Full-time",
      salary: "£",
      description: "Shift",
      status,
    },
  });
  return id;
}

function apply(id: string) {
  const request = {
    params: { id },
    body: {
      applicant_name: "Applicant",
      email: "applicant@public-jobs.test",
      phone: "07123456789",
    },
  } as unknown as Request;
  const captured = capture();
  return ActionsController.applyForJob(request, captured.res).then(() => captured.sent.body?.data);
}

async function rejection(id: string) {
  await assert.rejects(apply(id), (error: unknown) => {
    assert.ok(error instanceof NotFoundException);
    assert.equal(error.message, "Job post not found");
    assert.equal(error.statusCode, 404);
    return true;
  });
}

describe("public job applications", { concurrency: 1 }, () => {
  it("accepts an application for an active job", async () => {
    const id = await post("active");
    const created = await apply(id);
    assert.ok(created);
    applicationIds.push(created.id);
    assert.equal(created.job_post_id, id);
    const stored = await prisma.job_posts.findUnique({ where: { id }, select: { applications: true } });
    assert.equal(stored?.applications, 1);
  });

  it("rejects a draft, a closed post, and a missing id with the same not-found response", async () => {
    const draft = await post("draft");
    const closed = await post("closed");
    await rejection(draft);
    await rejection(closed);
    await rejection(crypto.randomUUID());

    const draftRow = await prisma.job_posts.findUnique({ where: { id: draft }, select: { applications: true } });
    const closedRow = await prisma.job_posts.findUnique({ where: { id: closed }, select: { applications: true } });
    assert.equal(draftRow?.applications, 0);
    assert.equal(closedRow?.applications, 0);
    assert.equal(await prisma.job_applications.count({ where: { job_post_id: { in: [draft, closed] } } }), 0);
  });

  it("still lets an admin application target a draft", async () => {
    const id = await post("draft");
    const created = await createJobApplication({
      job_post_id: id,
      applicant_name: "Admin Entry",
      email: "admin-entry@public-jobs.test",
    });
    applicationIds.push(created.id);
    assert.equal(created.job_post_id, id);
  });
});

after(async () => {
  if (applicationIds.length) await prisma.job_applications.deleteMany({ where: { id: { in: applicationIds } } });
  if (postIds.length) await prisma.job_posts.deleteMany({ where: { id: { in: postIds } } });
  await prisma.$disconnect();
});
