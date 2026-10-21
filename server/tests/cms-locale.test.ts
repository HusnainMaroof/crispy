import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findCmsSection } from "../src/config/cms-registry.js";
import { isSharedField, mergeSectionContent, stripSharedFields } from "../src/services/cms-merge.js";

const instagram = findCmsSection("home", "instagram");
const flavours = findCmsSection("home", "flavours");
assert.ok(instagram);
assert.ok(flavours);

const english = {
  title: "Instagram",
  username: "crispiesuk",
  profileUrl: "https://www.instagram.com/crispiesuk",
  posts: "557",
  followers: "16.1k",
  following: "19",
  bio: "Good Mood Food",
  followLabel: "Follow",
  reels: [
    {
      url: "https://www.instagram.com/reel/new/",
      thumbnailUrl: "https://cdn.example.com/new.jpg",
      likes: "50",
      views: "10.2K",
    },
  ],
};

describe("cms locale merge", () => {
  it("keeps pictures and links from English when the translation is older", () => {
    const local = {
      bio: "طعام المزاج الجيد",
      posts: "",
      reels: [
        {
          url: "https://www.instagram.com/reel/old/",
          thumbnailUrl: "/images/old-placeholder.jpg",
          likes: "",
          views: "",
        },
      ],
    };
    const merged = mergeSectionContent(instagram, english, local);
    const reel = (merged.reels as Record<string, unknown>[])[0];

    // Shared media and links come from English, so the old picture cannot return.
    assert.equal(reel.url, "https://www.instagram.com/reel/new/");
    assert.equal(reel.thumbnailUrl, "https://cdn.example.com/new.jpg");
    // The counts are not translated, so blank Arabic fields fall back to English.
    assert.equal(reel.likes, "50");
    assert.equal(reel.views, "10.2K");
    assert.equal(merged.posts, "557");
    // Translated text still wins.
    assert.equal(merged.bio, "طعام المزاج الجيد");
  });

  it("treats a gallery, a picture and the reels row as shared fields", () => {
    assert.equal(isSharedField(flavours.fields.galleryImages), true);
    assert.equal(isSharedField(flavours.fields.centerImage), true);
    assert.equal(isSharedField(flavours.fields.tiles), false);
    assert.equal(isSharedField(instagram.fields.reels), true);
  });

  it("keeps one reel row for every language, ignoring extra Arabic rows", () => {
    const local = {
      reels: [
        { url: "https://www.instagram.com/reel/old/", thumbnailUrl: "/images/old.jpg", likes: "9", views: "1K" },
        { url: "https://www.instagram.com/reel/extra/", thumbnailUrl: "/images/extra.jpg", likes: "1", views: "2" },
      ],
    };
    const merged = mergeSectionContent(instagram, english, local);
    assert.deepEqual(merged.reels, english.reels);
  });

  it("strips a shared link and keeps the translation text", () => {
    const cleaned = stripSharedFields(instagram, {
      username: "crispiesuk",
      profileUrl: "https://www.instagram.com/crispiesuk",
      bio: "طعام المزاج الجيد",
    });

    assert.equal("profileUrl" in cleaned, false);
    assert.equal(cleaned.username, "crispiesuk");
    assert.equal(cleaned.bio, "طعام المزاج الجيد");
  });

  it("removes the whole reels row from a translation", () => {
    const cleaned = stripSharedFields(instagram, {
      bio: "طعام المزاج الجيد",
      reels: [{ url: "https://www.instagram.com/reel/old/", thumbnailUrl: "/images/old.jpg" }],
    });
    assert.equal("reels" in cleaned, false);
    assert.equal(cleaned.bio, "طعام المزاج الجيد");
  });

  it("drops a gallery out of a translation", () => {
    const cleaned = stripSharedFields(flavours, {
      title: "نكهات",
      centerImage: "/images/center.png",
      galleryImages: ["/images/one.jpg", "/images/two.jpg"],
    });
    assert.equal(cleaned.title, "نكهات");
    assert.equal("centerImage" in cleaned, false);
    assert.equal("galleryImages" in cleaned, false);
  });
});
