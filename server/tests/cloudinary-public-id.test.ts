import { describe, it } from "node:test";
import { publicIdFromUrl } from "../src/services/upload.service.js";
import { envConfig } from "../src/config/env.js";

/**
 * `publicIdFromUrl` decides which Cloudinary asset gets destroyed when a
 * catalogue row is deleted. Getting it wrong means either deleting someone
 * else's asset or silently leaving an orphan behind, so every rejection path
 * matters as much as the happy one.
 */
describe("publicIdFromUrl", () => {
  const cloud = envConfig.CLOUDINARY.CLOUD_NAME;

  it("recovers the public id and drops the version segment", () => {
    const url = `https://res.cloudinary.com/${cloud}/image/upload/v1699999999/uploads/abc-123.jpg`;
    assert(publicIdFromUrl(url) === "uploads/abc-123");
  });

  it("keeps nested folders and strips only the final extension", () => {
    const url = `https://res.cloudinary.com/${cloud}/image/upload/v1/uploads/nested/folder/a.b.c.webp`;
    assert(publicIdFromUrl(url) === "uploads/nested/folder/a.b.c");
  });

  it("refuses assets on another cloud", () => {
    // The seed points at Cloudinary's shared `demo` cloud. Destroying that
    // would strip an asset this project does not own.
    const other = cloud === "demo" ? "someothercloud" : "demo";
    const url = `https://res.cloudinary.com/${other}/image/upload/v1/uploads/sample.jpg`;
    assert(publicIdFromUrl(url) === null);
  });

  it("refuses non-image and non-upload URLs", () => {
    assert(publicIdFromUrl(`https://res.cloudinary.com/${cloud}/raw/upload/v1/cvs/cv-1.pdf`) === null);
    assert(publicIdFromUrl(`https://res.cloudinary.com/${cloud}/video/upload/v1/videos/clip.mp4`) === null);
  });

  it("refuses a URL with no version segment", () => {
    assert(publicIdFromUrl(`https://res.cloudinary.com/${cloud}/image/upload/uploads/abc.jpg`) === null);
  });

  it("refuses placeholders and off-Cloudinary URLs", () => {
    assert(publicIdFromUrl("/placeholder.jpg") === null);
    assert(publicIdFromUrl("https://example.com/uploads/abc.jpg") === null);
    assert(publicIdFromUrl("") === null);
    assert(publicIdFromUrl("not a url") === null);
  });

  it("refuses a public id with no file extension", () => {
    assert(publicIdFromUrl(`https://res.cloudinary.com/${cloud}/image/upload/v1/uploads/abc`) === null);
  });
});

function assert(condition: boolean): void {
  if (!condition) throw new Error("assertion failed");
}