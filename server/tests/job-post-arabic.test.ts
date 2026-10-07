import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import type { Request, Response } from "express";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { StoreJobsController } from "../src/controllers/store/store-jobs.controller.js";
import { createJobPost, deleteJobPost, getJobPostById } from "../src/services/admin.service.js";
import { jobPostSchema, jobPostUpdateSchema } from "../src/validators/admin.schema.js";

const prisma = getPrisma();
const postIds: string[] = [];

const ARABIC = {
  title: "فريق الواجهة",
  description: "استقبل الطلبات، وتعامل مع النقد.",
  requirements: ["ثقة في التعامل مع النقد", "أسلوب ودود"],
};

describe("job post Arabic content", { concurrency: 1 }, () => {
  it("accepts the Arabic fields the job form sends", () => {
    const created = jobPostSchema.safeParse({
      title: "Front Counter Team",
      title_ar: ARABIC.title,
      type: "Part-time",
      salary: "£11.00/hr",
      description: "Take orders and handle cash.",
      description_ar: ARABIC.description,
      requirements: ["Confident with cash"],
      requirements_ar: ARABIC.requirements,
    });
    assert.equal(created.success, true);

    // Still optional: an English-only post is valid and falls back in the store.
    assert.equal(
      jobPostUpdateSchema.safeParse({ title_ar: "" }).success,
      true,
    );
    // And the English fields stay required on create.
    assert.equal(jobPostSchema.safeParse({ title: "Only a title" }).success, false);
  });

  it("round-trips the Arabic fields through the database and the public shape", async () => {
    const id = crypto.randomUUID();
    postIds.push(id);
    const created = await createJobPost({
      id,
      title: "Front Counter Team",
      title_ar: ARABIC.title,
      location: "Edgware Road",
      type: "Part-time",
      salary: "£11.00/hr",
      description: "Take orders and handle cash.",
      description_ar: ARABIC.description,
      requirements: ["Confident with cash"],
      requirements_ar: ARABIC.requirements,
      status: "active",
    });
    assert.equal(created.title_ar, ARABIC.title);
    assert.equal(created.description_ar, ARABIC.description);
    assert.deepEqual(created.requirements_ar, ARABIC.requirements);

    const stored = await getJobPostById(id);
    assert.equal(stored.title_ar, ARABIC.title);

    // The careers page reads the public shape, so the Arabic has to travel there.
    const request = { params: { id } } as unknown as Request;
    const sent: { body?: { data: Record<string, unknown> } } = {};
    const response = {
      status() {
        return this;
      },
      json(body: { data: Record<string, unknown> }) {
        sent.body = body;
        return this;
      },
    } as unknown as Response;
    await StoreJobsController.getById(request, response);
    assert.equal(sent.body?.data.title_ar, ARABIC.title);
    assert.equal(sent.body?.data.description_ar, ARABIC.description);
    assert.deepEqual(sent.body?.data.requirements_ar, ARABIC.requirements);
  });
});

after(async () => {
  for (const id of postIds) {
    await deleteJobPost(id).catch(() => undefined);
  }
  await prisma.$disconnect();
});
