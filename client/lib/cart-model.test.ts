import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addLine,
  cartCount,
  cartSubtotal,
  changeQuantity,
  clearLines,
  emptyCart,
  needsBranchSwitch,
  parseStoredCart,
  removeLine,
  replaceBranch,
} from "./cart-model.ts";

describe("stage 7 cart", () => {
  it("adds a product and a deal as separate lines", () => {
    let cart = emptyCart();
    cart = addLine(cart, { id: "burger", kind: "product", name: "Burger", price: 8.5, locationId: "harrow" });
    cart = addLine(cart, { id: "deal", kind: "deal", name: "Meal", price: 10.99, locationId: "harrow" });
    assert.equal(cart.locationId, "harrow");
    assert.equal(cartCount(cart), 2);
    assert.equal(cartSubtotal(cart).toFixed(2), "19.49");
  });

  it("increases, decreases, and removes quantity", () => {
    let cart = addLine(emptyCart(), { id: "burger", kind: "product", name: "Burger", price: 8.5, locationId: "harrow" });
    cart = addLine(cart, { id: "burger", kind: "product", name: "Burger", price: 8.5, locationId: "harrow" });
    assert.equal(cart.items[0].quantity, 2);
    cart = changeQuantity(cart, "burger", "product", 1);
    assert.equal(cart.items[0].quantity, 1);
    cart = changeQuantity(cart, "burger", "product", 0);
    assert.equal(cart.items.length, 0);
  });

  it("clears lines and keeps the branch", () => {
    const cart = clearLines(addLine(emptyCart(), { id: "burger", kind: "product", name: "Burger", price: 8.5, locationId: "harrow" }));
    assert.deepEqual(cart, { locationId: "harrow", items: [] });
  });

  it("asks before mixing branches and can clear on switch", () => {
    const cart = addLine(emptyCart(), { id: "burger", kind: "product", name: "Burger", price: 8.5, locationId: "harrow" });
    assert.equal(needsBranchSwitch(cart, "tower"), true);
    assert.equal(needsBranchSwitch(cart, "harrow"), false);
    const next = replaceBranch(cart, "tower");
    assert.equal(next.locationId, "tower");
    assert.equal(next.items.length, 0);
  });

  it("reads an older array cart", () => {
    const cart = parseStoredCart([{ id: "burger", name: "Burger", price: 8.5, quantity: 2 }]);
    assert.equal(cart.locationId, null);
    assert.equal(cart.items[0].kind, "product");
    assert.equal(removeLine(cart, "burger", "product").items.length, 0);
  });
});
