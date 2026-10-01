import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";

/**
 * One-off: the storefront used to read the ordering mode from two independent
 * CMS sections (`navbar/ordering` and `site/ordering`). They are merged into
 * `site/ordering`, which is now the single source of truth. This copies the
 * navbar value across so an existing Redirect setup stays on Redirect, then
 * deletes the duplicate navbar section.
 */
const prisma = getPrisma();

const [site, navbar] = await Promise.all([
  prisma.cms_sections.findUnique({ where: { page_key: { page: "site", key: "ordering" } }, include: { translations: true } }),
  prisma.cms_sections.findUnique({ where: { page_key: { page: "navbar", key: "ordering" } }, include: { translations: true } }),
]);

if (!site) {
  console.error("site/ordering section is missing — run the seed first.");
  process.exit(1);
}

if (!navbar) {
  console.log("Nothing to do: navbar/ordering no longer exists.");
  process.exit(0);
}

for (const translation of navbar.translations) {
  const mode = (translation.content as { mode?: string } | null)?.mode;
  if (mode !== "redirect" && mode !== "cart") continue;

  const current = site.translations.find((item) => item.locale === translation.locale);
  const next = { ...((current?.content as object | null) ?? {}), mode };

  await prisma.cms_section_translations.upsert({
    where: { section_id_locale: { section_id: site.id, locale: translation.locale } },
    create: { section_id: site.id, locale: translation.locale, content: next, is_published: translation.is_published },
    update: { content: next, is_published: translation.is_published },
  });
  console.log(`site/ordering [${translation.locale}] mode -> ${mode}`);
}

await prisma.cms_sections.delete({ where: { id: navbar.id } });
console.log("Deleted the duplicate navbar/ordering section.");

process.exit(0);
