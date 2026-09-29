import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { CMS_PAGES, findCmsSection, sectionDefaults } from "../src/config/cms-registry.js";
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
    assert.equal(schemaFor("site", "ordering").safeParse({ mode: "redirect", redirectUrl: "" }).success, false);
    assert.equal(schemaFor("site", "ordering").safeParse({ mode: "redirect", redirectUrl: "http://orders.example.com" }).success, false);
    assert.equal(schemaFor("site", "ordering").safeParse({ mode: "redirect", redirectUrl: "https://orders.example.com" }).success, true);
    assert.equal(cmsSectionUpdateSchema.safeParse({ locale: "../../" }).success, false);
    assert.equal(cmsSectionUpdateSchema.parse({ locale: "ur", is_published: true }).locale, "ar");
    assert.equal(cmsSectionUpdateSchema.parse({ locale: "ar", is_published: true }).locale, "ar");
    assert.equal(cmsSectionUpdateSchema.safeParse({}).success, false);
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
    assert.equal(page.sections.welcome.headline, "Welcome to");
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
    const locations = await section("home", "locations");
    await moveCmsSection(superadmin, locations.id, "down");
    try {
      assert.deepEqual((await getPublicCmsPage("home")).order, ["hero", "welcome", "flavours", "partner", "locations", "instagram"]);
    } finally {
      await moveCmsSection(superadmin, locations.id, "up");
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
    assert.deepEqual(page.order, ["ordering", "logo", "navigation", "socials"]);
    assert.equal(["cart", "redirect"].includes(String(page.sections.ordering.mode)), true);
    assert.equal((page.sections.navigation.links as { label: string }[])[0].label, "Menu");
    assert.equal(page.sections.socials.show, true);
  });

  it("serves the ordering settings from the site page", async () => {
    const site = await getPublicCmsPage("site");
    assert.equal(site.sections.ordering.mode, "cart");
    assert.equal(site.sections.ordering.ctaLabel, "Order Now");
  });
});

after(async () => {
  await prisma.$disconnect();
});
