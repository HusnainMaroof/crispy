import assert from "node:assert/strict";
import { describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { getFullMenu } from "../src/services/menu.service.js";
import { accessibleLocationIds } from "../src/services/branch-access.service.js";

const prisma = getPrisma();

async function branchId(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row, `missing branch ${slug}`);
  return row.id;
}

describe("development mock catalogue", () => {
  it("loads categories, products, deals and nine-branch rows", async () => {
    const [categories, products, deals, branches, menuRows, dealRows] = await Promise.all([
      prisma.menu_categories.count({ where: { id: { startsWith: "mock-cat-" } } }),
      prisma.menu_items.count({ where: { id: { startsWith: "mock-" }, active: true } }),
      prisma.deals.count({ where: { id: { startsWith: "mock-deal-" } } }),
      prisma.locations.count({ where: { slug: { in: ["harrow-road", "tower-hill", "kilburn", "harrow", "elephant-and-castle", "edgware-road", "stockwell", "wembley-central", "ruislip"] } } }),
      prisma.branch_menu_items.count(),
      prisma.branch_deals.count(),
    ]);
    assert.equal(categories, 10);
    assert.ok(products >= 30 && products <= 40);
    assert.ok(deals >= 5 && deals <= 8);
    assert.equal(branches, 9);
    assert.equal(menuRows, products * 9);
    assert.equal(dealRows, deals * 9);
  });

  it("hides an unavailable product on one branch and keeps the global price elsewhere", async () => {
    const globalMenu = await getFullMenu();
    const spicy = globalMenu.flatMap((category) => category.items).find((item) => item.id === "mock-burger-spicy");
    assert.equal(Number(spicy?.price), 9.5);

    const tower = await getFullMenu({ locationId: await branchId("tower-hill"), required: true });
    const harrowRoad = await getFullMenu({ locationId: await branchId("harrow-road"), required: true });
    const towerItems = tower.flatMap((category) => category.items);
    const harrowItems = harrowRoad.flatMap((category) => category.items);

    assert.equal(towerItems.some((item) => item.id === "mock-burger-spicy"), false);
    assert.equal(Number(harrowItems.find((item) => item.id === "mock-burger-spicy")?.price), 9.5);
    assert.equal(Number(harrowItems.find((item) => item.id === "mock-burger-crispy")?.price), 9.25);
    assert.equal(tower.some((category) => category.title === "Grill"), false);
    assert.equal(harrowRoad.some((category) => category.title === "Grill"), true);
  });

  it("keeps branch managers scoped and admins open", () => {
    assert.equal(accessibleLocationIds("superadmin", []), null);
    assert.equal(accessibleLocationIds("admin", []), null);
    assert.deepEqual(accessibleLocationIds("branch_manager", ["only-one"]), ["only-one"]);
  });
});
