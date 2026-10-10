import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { CMS_PAGES, findCmsSection, lockedFieldNames, sectionDefaults, sectionDefinition } from "../src/config/cms-registry.js";
import {
  getCmsPageForEditing,
  getPublicCmsPage,
  listCmsPages,
  moveCmsSection,
  resetCmsSection,
  updateCmsSection,
} from "../src/services/cms.service.js";
import { cmsSectionUpdateSchema, sectionContentSchema } from "../src/validators/cms.schema.js";
import { BadRequestException, ForbiddenException, NotFoundException } from "../src/utils/app-error.js";

const prisma = getPrisma();
const superadmin = { sub: "cms-super", role: "superadmin" as const };
const manager = { sub: "cms-manager", role: "branch_manager" as const };

async function section(page: string, key: string) {
  const row = await prisma.cms_sections.findUnique({ where: { page_key: { page, key } } });
  assert.ok(row);
  return row;
}

function schemaFor(page: string, key: string) {
  const definition = findCmsSection(page, key);
  assert.ok(definition);
  return sectionContentSchema(definition);
}

describe("cms registry", () => {
  it("has valid defaults for every section", () => {
    for (const page of CMS_PAGES) {
      for (const definition of page.sections) {
        const result = sectionContentSchema(definition).safeParse(sectionDefaults(definition));
        assert.equal(result.success, true, `${page.id}.${definition.key} defaults are invalid`);
      }
    }
  });

  it("rejects html, unknown fields, unsafe links, and bad media", () => {
    assert.equal(schemaFor("home", "welcome").safeParse({ description: "<script>alert(1)</script>" }).success, false);
    assert.equal(schemaFor("home", "welcome").safeParse({ banner: "x" }).success, false);
    assert.equal(schemaFor("home", "locations").safeParse({ ctaUrl: "/admin" }).success, false);
    assert.equal(schemaFor("home", "locations").safeParse({ ctaUrl: "/locations" }).success, true);
    assert.equal(schemaFor("home", "flavours").safeParse({ centerImage: "https://cdn.example.com/card.png" }).success, true);
    assert.equal(schemaFor("home", "flavours").safeParse({ galleryImages: ["javascript:alert(1)"] }).success, false);
    assert.equal(schemaFor("home", "welcome").safeParse({ backImage: "javascript:alert(1)" }).success, false);
    assert.equal(schemaFor("home", "hero").safeParse({ videoUrl: "https://cdn.example.com/hero.mp4" }).success, true);
    assert.equal(schemaFor("home", "hero").safeParse({ lines: ["a", "b", "c", "d"] }).success, false);
    assert.equal(schemaFor("home", "flavours").safeParse({ galleryImages: ["/images/aboutimage.jpg"] }).success, true);
    assert.equal(schemaFor("home", "instagram").safeParse({ reels: [{ url: "https://evil.example/reel/1", thumbnailUrl: "/images/reel.jpg" }] }).success, false);
    assert.equal(schemaFor("home", "instagram").safeParse({ reels: [{ url: "https://www.instagram.com/reel/abc/", thumbnailUrl: "/images/reel.jpg" }] }).success, true);
    assert.equal(schemaFor("home", "locations").safeParse({ locationIds: ["branch-1", "branch-2"] }).success, true);
    assert.equal(schemaFor("home", "locations").safeParse({ locationIds: Array.from({ length: 13 }, (_, index) => `branch-${index}`) }).success, false);
    assert.equal(schemaFor("site", "ordering").safeParse({ mode: "redirect", redirectUrl: "" }).success, true);
    assert.equal(schemaFor("site", "ordering").safeParse({ mode: "redirect", redirectUrl: "http://orders.example.com" }).success, false);
    assert.equal(schemaFor("site", "ordering").safeParse({ mode: "redirect", redirectUrl: "https://orders.example.com" }).success, true);
    assert.equal(cmsSectionUpdateSchema.safeParse({ locale: "../../" }).success, false);
    assert.equal(cmsSectionUpdateSchema.parse({ locale: "ur", is_published: true }).locale, "ar");
    assert.equal(cmsSectionUpdateSchema.parse({ locale: "ar", is_published: true }).locale, "ar");
    assert.equal(cmsSectionUpdateSchema.safeParse({}).success, false);
  });

  it("hides locked fields from the editor and keeps them out of saves", async () => {
    const flavours = findCmsSection("home", "flavours");
    assert.ok(flavours);
    const definition = sectionDefinition(flavours);
    // Only the center image and the carousel stay editable.
    assert.deepEqual(Object.keys(definition.fields), ["centerImage", "galleryImages"]);
    assert.deepEqual(lockedFieldNames(flavours), ["title", "discoverTitle", "tiles", "scaleTitle", "scale", "ctaLabel", "ctaUrl"]);
    // Every other page keeps its full field set.
    const welcome = findCmsSection("home", "welcome");
    assert.ok(welcome);
    assert.equal(Object.keys(sectionDefinition(welcome).fields).length, Object.keys(welcome.fields).length);
  });

  it("ignores attempts to change a locked field on the flavours section", async () => {
    const flavours = await section("home", "flavours");
    const existing = await prisma.cms_section_translations.findUnique({ where: { section_id_locale: { section_id: flavours.id, locale: "en" } } });
    const before = (await getPublicCmsPage("home")).sections.flavours;
    try {
      await updateCmsSection(superadmin, flavours.id, {
        content: { ...before, centerImage: "/images/new-center.png", ctaLabel: "Hacked label", title: "Hacked heading" },
        is_published: true,
      });
      const after = (await getPublicCmsPage("home")).sections.flavours;
      assert.equal(after.centerImage, "/images/new-center.png");
      assert.equal(after.ctaLabel, before.ctaLabel);
      assert.equal(after.title, before.title);
    } finally {
      await prisma.cms_section_translations.deleteMany({ where: { section_id: flavours.id } });
      if (existing) {
        await prisma.cms_section_translations.create({
          data: { section_id: flavours.id, locale: "en", content: existing.content ?? {}, is_published: existing.is_published },
        });
      }
    }
  });
});

describe("cms pages", { concurrency: 1 }, () => {
  it("serves the migrated homepage with defaults and hides inactive sections", async () => {
    const page = await getPublicCmsPage("home");
    assert.deepEqual(page.order, ["hero", "welcome", "flavours", "locations", "partner", "instagram"]);
    assert.deepEqual(page.sections.hero.lines, ["Always Good", "Mood Food"]);
    assert.equal("flavours" in page.sections.flavours, false);
    assert.ok(Array.isArray(page.sections.flavours.galleryImages));
    assert.equal(typeof page.sections.flavours.centerImage, "string");
    // The welcome headline is fixed and no longer served from the CMS.
    assert.equal("headline" in page.sections.welcome, false);
    assert.equal("accent" in page.sections.welcome, false);
    assert.equal("id" in page.sections.hero, false);

    const hero = await section("home", "hero");
    await updateCmsSection(superadmin, hero.id, { is_active: false });
    try {
      const hidden = await getPublicCmsPage("home");
      assert.equal(hidden.sections.hero, undefined);
      assert.equal(hidden.order.includes("hero"), false);
    } finally {
      await updateCmsSection(superadmin, hero.id, { is_active: true });
    }
    await assert.rejects(() => getPublicCmsPage("nope"), NotFoundException);
  });

  it("only lets a superadmin edit, and validates saved content", async () => {
    const welcome = await section("home", "welcome");
    const before = (await getPublicCmsPage("home")).sections.welcome;
    await updateCmsSection(superadmin, welcome.id, { content: { description: "Fresh handmade food." } });
    assert.equal((await getPublicCmsPage("home")).sections.welcome.description, "Fresh handmade food.");
    await updateCmsSection(superadmin, welcome.id, { content: before });
    await assert.rejects(() => updateCmsSection(superadmin, welcome.id, { content: { description: "<b>x</b>" } }), BadRequestException);
    for (const actor of [manager]) {
      await assert.rejects(() => listCmsPages(actor), ForbiddenException);
      await assert.rejects(() => getCmsPageForEditing(actor, "home"), ForbiddenException);
      await assert.rejects(() => updateCmsSection(actor, welcome.id, { content: { description: "No" } }), ForbiddenException);
    }
  });

  it("keeps pinned sections first and reorders the rest", async () => {
    const hero = await section("home", "hero");
    await assert.rejects(() => moveCmsSection(superadmin, hero.id, "down"), BadRequestException);
    // Partner is hidden and fixed, so a visible section cannot move past it. Flavours moves past Locations instead.
    const flavours = await section("home", "flavours");
    await moveCmsSection(superadmin, flavours.id, "down");
    try {
      assert.deepEqual((await getPublicCmsPage("home")).order, ["hero", "welcome", "locations", "flavours", "partner", "instagram"]);
    } finally {
      await moveCmsSection(superadmin, flavours.id, "up");
    }
    assert.deepEqual((await getPublicCmsPage("home")).order, ["hero", "welcome", "flavours", "locations", "partner", "instagram"]);
  });

  it("falls back to English until a translation is published, and resets it", async () => {
    const hero = await section("home", "hero");
    const existing = await prisma.cms_section_translations.findUnique({ where: { section_id_locale: { section_id: hero.id, locale: "ar" } } });
    if (existing) await prisma.cms_section_translations.delete({ where: { id: existing.id } });
    try {
      await assert.rejects(() => updateCmsSection(superadmin, hero.id, { locale: "../../" }), BadRequestException);
      const draft = await getCmsPageForEditing(superadmin, "home", "ar");
      const heroDraft = draft.sections.find((item) => item.key === "hero")!;
      assert.equal(heroDraft.copied_from_english, true);
      assert.deepEqual(heroDraft.content.lines, ["Always Good", "Mood Food"]);

      await updateCmsSection(superadmin, hero.id, { locale: "ar", content: { lines: ["مزاج رائع"] }, is_published: false });
      assert.deepEqual((await getPublicCmsPage("home", "ar")).sections.hero.lines, ["Always Good", "Mood Food"]);
      assert.deepEqual((await getPublicCmsPage("home", "../../")).sections.hero.lines, ["Always Good", "Mood Food"]);
      await updateCmsSection(superadmin, hero.id, { locale: "ar", is_published: true });
      assert.deepEqual((await getPublicCmsPage("home", "ar")).sections.hero.lines, ["مزاج رائع"]);

      await resetCmsSection(superadmin, hero.id, "ar");
      assert.deepEqual((await getPublicCmsPage("home", "ar")).sections.hero.lines, ["Always Good", "Mood Food"]);
    } finally {
      await prisma.cms_section_translations.deleteMany({ where: { section_id: hero.id, locale: "ar" } });
      if (existing) {
        await prisma.cms_section_translations.create({
          data: { section_id: hero.id, locale: "ar", content: existing.content ?? {}, is_published: existing.is_published },
        });
      }
    }
  });

  it("serves navbar defaults before anything is saved", async () => {
    const page = await getPublicCmsPage("navbar");
    // The ordering mode lives only on the site page, so the navbar has no
    // ordering section of its own to drift out of sync with.
    assert.deepEqual(page.order, ["logo"]);
    assert.equal("ordering" in page.sections, false);
    // Navigation links and social icons are fixed and no longer served from the CMS.
    assert.equal("navigation" in page.sections, false);
    assert.equal("socials" in page.sections, false);
  });

  it("serves the ordering settings from the site page", async () => {
    const site = await getPublicCmsPage("site");
    assert.equal(["cart", "redirect"].includes(String(site.sections.ordering.mode)), true);
    assert.equal(typeof site.sections.ordering.ctaLabel, "string");
  });
});

after(async () => {
  await prisma.$disconnect();
});
