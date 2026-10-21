import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { locationSchema, locationUpdateSchema } from "../src/validators/order.schema.js";
import { menuItemSchema } from "../src/validators/menu.schema.js";

const branch = {
  name: "Test branch",
  address: "1 Test Street, London",
  hours: "Every day · 11:00 AM – 11:00 PM",
  phone: "020 0000 0000",
};

describe("branch form fields", () => {
  it("accepts a manual pin number and a Google Maps link", () => {
    const parsed = locationSchema.safeParse({
      ...branch,
      pin_number: 7,
      google_maps_url: "https://maps.app.goo.gl/abc123",
    });
    assert.equal(parsed.success, true);
  });

  it("accepts an empty pin number and an empty maps link", () => {
    const parsed = locationSchema.safeParse({ ...branch, pin_number: null, google_maps_url: "" });
    assert.equal(parsed.success, true);
  });

  it("rejects a pin number below 1", () => {
    assert.equal(locationSchema.safeParse({ ...branch, pin_number: 0 }).success, false);
    assert.equal(locationSchema.safeParse({ ...branch, pin_number: 1.5 }).success, false);
  });

  it("rejects a maps link that is not https", () => {
    assert.equal(locationSchema.safeParse({ ...branch, google_maps_url: "http://maps.google.com" }).success, false);
    assert.equal(locationSchema.safeParse({ ...branch, google_maps_url: "maps.google.com" }).success, false);
  });

  it("allows reordering with a partial update", () => {
    assert.equal(locationUpdateSchema.safeParse({ sort_order: 2 }).success, true);
  });
});

describe("menu item price", () => {
  const item = { category_id: "cat-1", name: "Free side", price: 0, image: "/placeholder.jpg" };

  it("allows a zero price", () => {
    const parsed = menuItemSchema.safeParse(item);
    assert.equal(parsed.success, true);
    assert.equal(parsed.data?.price, 0);
  });

  it("still rejects a negative price", () => {
    assert.equal(menuItemSchema.safeParse({ ...item, price: -1 }).success, false);
  });
});
