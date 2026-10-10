import assert from "node:assert/strict";
import { describe, it } from "node:test";
import cloudinary from "../src/config/cloudinary.js";

/**
 * The image upload path has no local step to unit test, so what is asserted here
 * is the contract it sends to Cloudinary. A regression that drops the
 * transformation would otherwise only show up as a slow page, never as a
 * failing test.
 */

/** Captures the options `uploadImage` builds, without touching the network. */
function captureOptions(): { options?: Record<string, unknown>; done: () => void } {
  const seen: { options?: Record<string, unknown> } = {};
  const original = cloudinary.uploader.upload_stream;
  cloudinary.uploader.upload_stream = ((options: Record<string, unknown>, callback: (err: unknown, result: unknown) => void) => {
    seen.options = options;
    // The service resolves on this callback, so it fires with a stub result.
    setImmediate(() => callback(null, { secure_url: "https://example.test/x", public_id: "x" }));
    return { end: () => undefined };
  }) as typeof original;

  return {
    get options() {
      return seen.options;
    },
    done: () => {
      cloudinary.uploader.upload_stream = original;
    },
  };
}

describe("image upload transformation", () => {
  it("caps the stored image and lets Cloudinary pick the format", async () => {
    const { uploadImage } = await import("../src/services/upload.service.js");
    const captured = captureOptions();

    try {
      await uploadImage(Buffer.from("image bytes"), "homepage");
    } finally {
      captured.done();
    }

    const options = captured.options as { transformation?: Record<string, unknown>[] } & Record<string, unknown>;
    assert.equal(options.folder, "homepage");
    assert.equal(options.resource_type, "image");

    const steps = options.transformation ?? [];
    assert.deepEqual(
      steps.map((step) => step.width ?? step.quality ?? step.fetch_format),
      [2000, 82, "auto"],
    );
    assert.equal(steps[0].crop, "limit");
  });

  it("leaves a video and a document untouched by the image transform", async () => {
    const { uploadVideo, uploadDocument } = await import("../src/services/upload.service.js");

    const video = captureOptions();
    try {
      await uploadVideo(Buffer.from("video bytes"), "homepage");
    } finally {
      video.done();
    }
    assert.equal((video.options as Record<string, unknown>).resource_type, "video");
    assert.equal((video.options as Record<string, unknown>).transformation, undefined);

    const document = captureOptions();
    try {
      await uploadDocument(Buffer.from("pdf bytes"), "pdf");
    } finally {
      document.done();
    }
    assert.equal((document.options as Record<string, unknown>).resource_type, "raw");
    assert.equal((document.options as Record<string, unknown>).transformation, undefined);
  });
});