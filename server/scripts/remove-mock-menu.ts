import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client.js";

const MOCK_ITEM = { startsWith: "mock-" } as const;

export function removalMode(nodeEnv: string | undefined, argv: string[]): { confirm: boolean } {
  const confirm = argv.includes("--confirm");
  const backup = argv.includes("--i-have-a-backup");
  if (nodeEnv === "production" && !backup) {
    throw new Error("Refusing to run when NODE_ENV=production without --i-have-a-backup");
  }
  if (confirm && nodeEnv === "production" && !backup) {
    throw new Error("Refusing to delete when NODE_ENV=production without --i-have-a-backup");
  }
  return { confirm };
}

function looksPlaceholder(url: string | null | undefined): boolean {
  if (!url) return false;
  const value = url.toLowerCase();
  return value.includes("unsplash.com") || value.includes("placeholder") || value.includes("placehold");
}

async function main() {
  const { confirm } = removalMode(process.env.NODE_ENV, process.argv.slice(2));
  const connectionString = process.env.NEON_DATABASE_URL;
  if (!connectionString) {
    console.error("NEON_DATABASE_URL is not set");
    process.exit(1);
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await prisma.$transaction(async (tx) => {
      const items = await tx.menu_items.findMany({
        where: { id: MOCK_ITEM },
        select: { id: true },
        orderBy: { id: "asc" },
      });
      const ids = items.map((item) => item.id);
      const branchRows = await tx.branch_menu_items.count({ where: { menu_item_id: MOCK_ITEM } });
      const orderLines = await tx.order_items.count({ where: { menu_item_id: MOCK_ITEM } });
      const categories = await tx.menu_categories.findMany({
        where: { id: { startsWith: "mock-" } },
        select: { id: true, title: true, image: true },
        orderBy: { id: "asc" },
      });
      const deals = await tx.deals.findMany({
        where: { id: { startsWith: "mock-" } },
        select: { id: true, name: true, image: true },
        orderBy: { id: "asc" },
      });

      console.log(confirm ? "CONFIRM delete" : "DRY RUN (no rows deleted)");
      console.log(`menu_items to delete: ${ids.length}`);
      for (const id of ids) console.log(`  ${id}`);
      console.log(`branch_menu_items that cascade with those items: ${branchRows}`);
      console.log(`order_items that reference them (snapshot kept, menu_item_id set null): ${orderLines}`);
      console.log("mock categories kept:");
      for (const row of categories) {
        const flag = looksPlaceholder(row.image) ? ` placeholder ${row.image}` : "";
        console.log(`  ${row.id} ${row.title}${flag}`);
      }
      console.log("mock deals kept:");
      for (const row of deals) {
        const flag = looksPlaceholder(row.image) ? ` placeholder ${row.image}` : "";
        console.log(`  ${row.id} ${row.name}${flag}`);
      }

      if (!confirm) return;

      const deleted = await tx.menu_items.deleteMany({ where: { id: MOCK_ITEM } });
      const itemsLeft = await tx.menu_items.count({ where: { id: MOCK_ITEM } });
      const branchLeft = await tx.branch_menu_items.count({ where: { menu_item_id: MOCK_ITEM } });
      const linesStillLinked = await tx.order_items.count({ where: { menu_item_id: MOCK_ITEM } });
      console.log(`deleted menu_items: ${deleted.count}`);
      console.log(`menu_items with mock- prefix after: ${itemsLeft}`);
      console.log(`branch_menu_items with mock- prefix after: ${branchLeft}`);
      console.log(`order_items still pointing at mock- ids after: ${linesStillLinked}`);
    });
  } finally {
    await prisma.$disconnect();
  }
}

const isDirectRun = process.argv[1]?.replaceAll("\\", "/").endsWith("scripts/remove-mock-menu.ts");
if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  });
}
