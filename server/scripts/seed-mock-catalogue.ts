import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  MOCK_BRANCH_SLUGS,
  mockBranchDealRules,
  mockBranchMenuRules,
  mockCategories,
  mockDeals,
  mockItems,
} from "../src/data/mock-catalogue.js";

const connectionString = process.env.NEON_DATABASE_URL;
if (!connectionString) {
  console.error("NEON_DATABASE_URL is not set in server/.env");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

async function seedMockCatalogue() {
  for (const category of mockCategories) {
    await prisma.menu_categories.upsert({
      where: { id: category.id },
      create: category,
      update: category,
    });
  }

  for (const item of mockItems) {
    await prisma.menu_items.upsert({
      where: { id: item.id },
      create: { ...item, active: true },
      update: { ...item, active: true },
    });
  }

  for (const deal of mockDeals) {
    await prisma.deals.upsert({
      where: { id: deal.id },
      create: { ...deal, active: true },
      update: { ...deal, active: true },
    });
  }

  const branches = await prisma.locations.findMany({
    where: { slug: { in: [...MOCK_BRANCH_SLUGS] } },
  });
  if (branches.length !== MOCK_BRANCH_SLUGS.length) {
    throw new Error(`Expected ${MOCK_BRANCH_SLUGS.length} branches, found ${branches.length}`);
  }

  let menuRows = 0;
  let dealRows = 0;
  for (const branch of branches) {
    const slug = branch.slug ?? "";
    const menuRules = mockBranchMenuRules[slug] ?? {};
    for (const item of mockItems) {
      const rule = menuRules[item.id] ?? {};
      await prisma.branch_menu_items.upsert({
        where: { location_id_menu_item_id: { location_id: branch.id, menu_item_id: item.id } },
        create: {
          location_id: branch.id,
          menu_item_id: item.id,
          price: rule.price ?? null,
          available: rule.available ?? true,
        },
        update: {
          price: rule.price ?? null,
          available: rule.available ?? true,
        },
      });
      menuRows += 1;
    }
    const dealRules = mockBranchDealRules[slug] ?? {};
    for (const deal of mockDeals) {
      const rule = dealRules[deal.id] ?? {};
      await prisma.branch_deals.upsert({
        where: { location_id_deal_id: { location_id: branch.id, deal_id: deal.id } },
        create: {
          location_id: branch.id,
          deal_id: deal.id,
          price: rule.price ?? null,
          available: rule.available ?? true,
        },
        update: {
          price: rule.price ?? null,
          available: rule.available ?? true,
        },
      });
      dealRows += 1;
    }
  }

  console.log(JSON.stringify({
    label: "development mock catalogue",
    categories: mockCategories.length,
    products: mockItems.length,
    deals: mockDeals.length,
    branches: branches.length,
    branchMenuRows: menuRows,
    branchDealRows: dealRows,
  }));
}

seedMockCatalogue()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
