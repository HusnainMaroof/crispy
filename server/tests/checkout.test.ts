import assert from "node:assert/strict";
import { after, describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { createOrder } from "../src/services/order.service.js";
import { quoteCart } from "../src/services/quote.service.js";
import { ItemUnavailableException } from "../src/utils/app-error.js";

const prisma = getPrisma();
const keys: string[] = [];

function key() {
  const value = crypto.randomUUID();
  keys.push(value);
  return value;
}

async function branch(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row);
  return row.id;
}

const customer = {
  customer_name: "Stage Nine",
  email: "stage9@example.com",
  phone: "07123456789",
  fulfilment: "collection" as const,
  payment_method: "cash" as const,
};

describe("checkout", () => {
  it("stores the Harrow Road price and ignores tampered totals", async () => {
    const locationId = await branch("harrow-road");
    const order = await createOrder({
      ...customer,
      location_id: locationId,
      checkout_key: key(),
      subtotal: 0.01,
      total: 0.01,
      items: [{ kind: "product", id: "mock-burger-crispy", quantity: 2, price: 0.01 }],
    } as never);
    assert.equal(Number(order.items[0].price), 9.25);
    assert.equal(Number(order.total), 18.5);
    assert.equal(order.status, "pending");
    assert.equal(order.items[0].name, "Crispy Chicken Burger");
  });

  it("stores a deal line without a menu item id", async () => {
    const order = await createOrder({
      ...customer,
      location_id: await branch("harrow-road"),
      checkout_key: key(),
      items: [{ kind: "deal", id: "mock-deal-lunch", quantity: 1 }],
    });
    assert.equal(order.items[0].kind, "deal");
    assert.equal(Number(order.items[0].price), 8.99);
  });

  it("does not create an order for an unavailable product or deal", async () => {
    const tower = await branch("tower-hill");
    const elephant = await branch("elephant-and-castle");
    const spicyKey = key();
    const dealKey = key();
    await assert.rejects(
      () => createOrder({
        ...customer,
        location_id: tower,
        checkout_key: spicyKey,
        items: [{ kind: "product", id: "mock-burger-spicy", quantity: 1 }],
      }),
      ItemUnavailableException,
    );
    await assert.rejects(
      () => createOrder({
        ...customer,
        location_id: elephant,
        checkout_key: dealKey,
        items: [{ kind: "deal", id: "mock-deal-weekend", quantity: 1 }],
      }),
      ItemUnavailableException,
    );
    assert.equal(await prisma.orders.count({ where: { checkout_key: { in: [spicyKey, dealKey] } } }), 0);
  });

  it("uses the price at order time, not an earlier quote", async () => {
    const locationId = await branch("kilburn");
    const quoted = await quoteCart(locationId, [{ kind: "product", id: "mock-burger-classic", quantity: 1 }]);
    assert.equal(quoted.items[0].unitPrice, 8.5);
    await prisma.branch_menu_items.update({
      where: { location_id_menu_item_id: { location_id: locationId, menu_item_id: "mock-burger-classic" } },
      data: { price: 10.25 },
    });
    try {
      const order = await createOrder({
        ...customer,
        location_id: locationId,
        checkout_key: key(),
        items: [{ kind: "product", id: "mock-burger-classic", quantity: 1 }],
      });
      assert.equal(Number(order.items[0].price), 10.25);
    } finally {
      await prisma.branch_menu_items.update({
        where: { location_id_menu_item_id: { location_id: locationId, menu_item_id: "mock-burger-classic" } },
        data: { price: null },
      });
    }
  });

  it("returns the same order when the checkout key is repeated", async () => {
    const checkout_key = key();
    const locationId = await branch("stockwell");
    const first = await createOrder({
      ...customer,
      location_id: locationId,
      checkout_key,
      items: [{ kind: "product", id: "mock-drink-water", quantity: 1 }],
    });
    const second = await createOrder({
      ...customer,
      location_id: locationId,
      checkout_key,
      items: [{ kind: "product", id: "mock-drink-water", quantity: 1 }],
    });
    assert.equal(first.id, second.id);
    const copies = await prisma.orders.count({ where: { checkout_key } });
    assert.equal(copies, 1);
  });
});

after(async () => {
  if (keys.length) {
    await prisma.orders.deleteMany({ where: { checkout_key: { in: keys } } });
  }
  await prisma.$disconnect();
});
