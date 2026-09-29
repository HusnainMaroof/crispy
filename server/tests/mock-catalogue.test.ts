import assert from "node:assert/strict";
import { describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { getFullMenu } from "../src/services/menu.service.js";
import { accessibleLocationIds } from "../src/services/branch-access.service.js";

const prisma = getPrisma();

describe("development mock catalogue", () => {
  // The catalogue is curated through the admin panel, so these checks assert
  // invariants instead of the pristine seed counts.
  it("keeps categories, products, deals and nine-branch rows consistent", async () => {
    const [categories, products, deals, branches, menuRows, dealRows] = await Promise.all([
      prisma.menu_categories.count({ where: { id: { startsWith: "mock-cat-" } } }),
      prisma.menu_items.count({ where: { id: { startsWith: "mock-" } } }),
      prisma.deals.count({ where: { id: { startsWith: "mock-deal-" } } }),
      prisma.locations.count(),
      prisma.branch_menu_items.count({ where: { menu_item_id: { startsWith: "mock-" } } }),
      prisma.branch_deals.count({ where: { deal_id: { startsWith: "mock-deal-" } } }),
    ]);
    assert.equal(branches, 9);
    assert.ok(categories > 0);
    assert.ok(products > 0);
    assert.ok(deals > 0);
    // Every mock product and deal is sold at every branch.
    assert.equal(menuRows, products * 9);
    assert.equal(dealRows, deals * 9);
  });

  it("hides an unavailable product on one branch and keeps the global price elsewhere", async () => {
    // Fixtures come from the live catalogue — any product one branch hides and
    // any product one branch reprices — so menu edits never break this test.
    const hidden = await prisma.branch_menu_items.findFirst({
      where: { menu_item_id: { startsWith: "mock-" }, available: false, menu_item: { active: true } },
      select: { menu_item_id: true, location_id: true },
    });
    assert.ok(hidden, "expected a mock product that one branch marks unavailable");

    const globalMenu = await getFullMenu();
    const globalItems = globalMenu.flatMap((category) => category.items);
    assert.equal(globalItems.some((item) => item.id === hidden.menu_item_id), true);

    const hiddenBranch = await getFullMenu({ locationId: hidden.location_id, required: true });
    assert.equal(hiddenBranch.flatMap((category) => category.items).some((item) => item.id === hidden.menu_item_id), false);

    const override = await prisma.branch_menu_items.findFirst({
      where: { menu_item_id: { startsWith: "mock-" }, price: { not: null }, menu_item: { active: true } },
      select: { menu_item_id: true, location_id: true, price: true },
    });
    assert.ok(override, "expected a mock product with a branch price override");

    const overrideBranch = await getFullMenu({ locationId: override.location_id, required: true });
    const overrideItems = overrideBranch.flatMap((category) => category.items);
    assert.equal(Number(overrideItems.find((item) => item.id === override.menu_item_id)?.price), Number(override.price));

    const standard = await prisma.branch_menu_items.findFirst({
      where: { menu_item_id: override.menu_item_id, price: null, available: true, location_id: { not: override.location_id } },
      select: { location_id: true },
    });
    assert.ok(standard, "expected a branch that keeps the standard price");
    const catalogue = await prisma.menu_items.findUnique({ where: { id: override.menu_item_id }, select: { price: true } });
    const standardBranch = await getFullMenu({ locationId: standard.location_id, required: true });
    const standardItems = standardBranch.flatMap((category) => category.items);
    assert.equal(Number(standardItems.find((item) => item.id === override.menu_item_id)?.price), Number(catalogue?.price));

    // A branch menu never shows empty categories.
    assert.ok([...hiddenBranch, ...overrideBranch, ...standardBranch].every((category) => category.items.length > 0));
  });

  it("keeps branch managers scoped and only the superadmin open", () => {
    assert.equal(accessibleLocationIds("superadmin", []), null);
    // The legacy admin role folds into branch_manager, so it stays branch-scoped.
    assert.deepEqual(accessibleLocationIds("admin", []), []);
    assert.deepEqual(accessibleLocationIds("branch_manager", ["only-one"]), ["only-one"]);
  });
});
