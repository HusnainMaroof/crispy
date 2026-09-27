import assert from "node:assert/strict";
import { describe, it } from "node:test";
import "dotenv/config";
import { getPrisma } from "../src/config/prisma.js";
import { quoteCart } from "../src/services/quote.service.js";
import { ItemUnavailableException, NotFoundException } from "../src/utils/app-error.js";
import { quoteSchema } from "../src/validators/order.schema.js";

const prisma = getPrisma();

async function idFor(slug: string) {
  const row = await prisma.locations.findUnique({ where: { slug } });
  assert.ok(row);
  return row.id;
}

describe("server quote", () => {
  it("uses the Harrow Road override and ignores a tampered client price", async () => {
    const locationId = await idFor("harrow-road");
    const parsed = quoteSchema.parse({
      locationId,
      items: [{ kind: "product", id: "mock-burger-crispy", quantity: 2, price: 0.01, name: "Fake" }],
    });
    const quote = await quoteCart(locationId, parsed.items);
    assert.equal(quote.items[0].unitPrice, 9.25);
    assert.equal(quote.items[0].lineTotal, 18.5);
    assert.equal(quote.subtotal, 18.5);
    assert.equal(quote.items[0].name, "Crispy Chicken Burger");

    const tampered = quoteSchema.parse({
      locationId,
      items: [{ kind: "product", id: "mock-burger-crispy", quantity: 1, price: 999.99 }],
    });
    const again = await quoteCart(locationId, tampered.items);
    assert.equal(again.items[0].unitPrice, 9.25);
  });

  it("returns the global price when the branch has no override", async () => {
    const kilburn = await idFor("kilburn");
    const quote = await quoteCart(kilburn, [
      { kind: "product", id: "mock-burger-crispy", quantity: 1 },
    ]);
    assert.equal(quote.items[0].unitPrice, 8.99);
  });

  it("rejects an unavailable product and an unavailable deal", async () => {
    const tower = await idFor("tower-hill");
    const elephant = await idFor("elephant-and-castle");
    await assert.rejects(
      () => quoteCart(tower, [{ kind: "product", id: "mock-burger-spicy", quantity: 1 }]),
      (error: unknown) => error instanceof ItemUnavailableException && error.item.id === "mock-burger-spicy",
    );
    await assert.rejects(
      () => quoteCart(elephant, [{ kind: "deal", id: "mock-deal-wings", quantity: 1 }]),
      (error: unknown) => error instanceof ItemUnavailableException && error.item.id === "mock-deal-wings",
    );
  });

  it("rejects a missing branch, product, deal, and bad quantities", async () => {
    const harrow = await idFor("harrow-road");
    await assert.rejects(
      () => quoteCart("missing-branch", [{ kind: "product", id: "mock-burger-crispy", quantity: 1 }]),
      NotFoundException,
    );
    await assert.rejects(
      () => quoteCart(harrow, [{ kind: "product", id: "missing-product", quantity: 1 }]),
      NotFoundException,
    );
    await assert.rejects(
      () => quoteCart(harrow, [{ kind: "deal", id: "missing-deal", quantity: 1 }]),
      NotFoundException,
    );
    assert.equal(quoteSchema.safeParse({ locationId: "x", items: [{ kind: "product", id: "y", quantity: 0 }] }).success, false);
    assert.equal(quoteSchema.safeParse({ locationId: "x", items: [{ kind: "product", id: "y", quantity: -1 }] }).success, false);
    assert.equal(quoteSchema.safeParse({ locationId: "x", items: [{ kind: "product", id: "y", quantity: 1.5 }] }).success, false);
  });

  it("sums several lines from server prices", async () => {
    const harrow = await idFor("harrow-road");
    const quote = await quoteCart(harrow, [
      { kind: "product", id: "mock-burger-crispy", quantity: 2 },
      { kind: "product", id: "mock-side-fries", quantity: 1 },
    ]);
    assert.equal(quote.items.length, 2);
    assert.equal(quote.subtotal, 21);
    assert.equal(quote.total, quote.subtotal);
  });
});
