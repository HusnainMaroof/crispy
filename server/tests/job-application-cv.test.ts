import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { jobApplicationPublicSchema, jobApplicationSchema } from "../src/validators/admin.schema.js";

const base = {
  applicant_name: "Applicant",
  email: "applicant@job-cv.test",
};

describe("job application CV rules", () => {
  it("accepts an uploaded CV URL or a pasted http(s) link on the public route", () => {
    assert.equal(jobApplicationPublicSchema.safeParse({ ...base, cv_url: "https://res.cloudinary.com/demo/raw/upload/cvs/cv.pdf" }).success, true);
    assert.equal(jobApplicationPublicSchema.safeParse({ ...base, cv_url: "http://example.com/cv.pdf" }).success, true);
  });

  it("rejects a public application without a CV", () => {
    const parsed = jobApplicationPublicSchema.safeParse(base);
    assert.equal(parsed.success, false);
  });

  it("rejects a CV link whose scheme is not http(s)", () => {
    // The link is rendered as an href in the admin grid, so javascript: and
    // data: URLs must not survive validation.
    for (const cv_url of ["javascript:alert(1)", "data:text/html,hi", "ftp://example.com/cv.pdf"]) {
      const parsed = jobApplicationPublicSchema.safeParse({ ...base, cv_url });
      assert.equal(parsed.success, false, `expected ${cv_url} to be rejected`);
    }
  });

  it("keeps the CV optional for admin-entered applications", () => {
    assert.equal(
      jobApplicationSchema.safeParse({ ...base, job_post_id: "job-1" }).success,
      true,
    );
  });
});
