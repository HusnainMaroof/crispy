import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { getFullMenu } from "../src/services/menu.service.js";

const prisma = getPrisma();
const suffix = crypto.randomUUID().slice(0, 8);
const categoryId = `stage5-cat-${suffix}`;
const itemId = `stage5-item-${suffix}`;
const hiddenId = `stage5-hidden-${suffix}`;
const locationA = `stage5-a-${suffix}`;
const locationB = `stage5-b-${suffix}`;

describe("branch menu prices", () => {
  it("keeps the global price and applies each branch override", async () => {
    await prisma.menu_categories.create({
      data: { id: categoryId, number: "99", title: "Stage 5", updated_at: new Date() },
    });
    await prisma.menu_items.create({
      data: { id: itemId, category_id: categoryId, name: "Stage Burger", price: 8.5, active: true },
    });
    await prisma.menu_items.create({
      data: { id: hiddenId, category_id: categoryId, name: "Hidden Burger", price: 4, active: false },
    });
    await prisma.locations.createMany({
      data: [
        { id: locationA, name: "Stage A", slug: `stage-a-${suffix}`, address: "A", hours: "11-11", phone: "", status: "active" },
        { id: locationB, name: "Stage B", slug: `stage-b-${suffix}`, address: "B", hours: "11-11", phone: "", status: "active" },
      ],
    });
    await prisma.branch_menu_items.createMany({
      data: [
        { location_id: locationA, menu_item_id: itemId, price: 9.99, available: true },
        { location_id: locationB, menu_item_id: itemId, price: 10.99, available: true },
        { location_id: locationA, menu_item_id: hiddenId, price: null, available: true },
      ],
    });

    const globalMenu = await getFullMenu();
    const globalItem = globalMenu.flatMap((category) => category.items).find((item) => item.id === itemId);
    assert.equal(Number(globalItem?.price), 8.5);

    const branchA = await getFullMenu({ locationId: locationA, required: true });
    const branchB = await getFullMenu({ locationId: locationB, required: true });
    assert.equal(Number(branchA.flatMap((category) => category.items).find((item) => item.id === itemId)?.price), 9.99);
    assert.equal(Number(branchB.flatMap((category) => category.items).find((item) => item.id === itemId)?.price), 10.99);
    assert.equal(branchA.flatMap((category) => category.items).some((item) => item.id === hiddenId), false);

    await prisma.branch_menu_items.update({
      where: { location_id_menu_item_id: { location_id: locationA, menu_item_id: itemId } },
      data: { price: null },
    });
    const inherited = await getFullMenu({ locationId: locationA, required: true });
    assert.equal(Number(inherited.flatMap((category) => category.items).find((item) => item.id === itemId)?.price), 8.5);

    await prisma.branch_menu_items.update({
      where: { location_id_menu_item_id: { location_id: locationA, menu_item_id: itemId } },
      data: { available: false },
    });
    const hiddenAtBranch = await getFullMenu({ locationId: locationA, required: true });
    assert.equal(hiddenAtBranch.flatMap((category) => category.items).some((item) => item.id === itemId), false);
    // The category stays listed, with no items left in it at this branch.
    assert.equal(hiddenAtBranch.find((category) => category.id === categoryId)?.items.length, 0);
  });
});

after(async () => {
  await prisma.branch_menu_items.deleteMany({ where: { location_id: { in: [locationA, locationB] } } });
  await prisma.menu_items.deleteMany({ where: { id: { in: [itemId, hiddenId] } } });
  await prisma.menu_categories.deleteMany({ where: { id: categoryId } });
  await prisma.locations.deleteMany({ where: { id: { in: [locationA, locationB] } } });
  await prisma.$disconnect();
});
