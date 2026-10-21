import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { menuCategorySchema, menuCategoryUpdateSchema } from "../src/validators/menu.schema.js";

const category = {
  number: "01",
  image: "https://res.cloudinary.com/demo/image/upload/sample.jpg",
};

describe("category title casing", () => {
  it("title cases a lowercase title", () => {
    const parsed = menuCategorySchema.parse({ ...category, title: "chicken wraps" });
    assert.equal(parsed.title, "Chicken Wraps");
  });

  it("title cases an uppercase title", () => {
    const parsed = menuCategorySchema.parse({ ...category, title: "SIDES AND DRINKS" });
    assert.equal(parsed.title, "Sides And Drinks");
  });

  it("keeps a title that is already title cased", () => {
    const parsed = menuCategorySchema.parse({ ...category, title: "Chickens" });
    assert.equal(parsed.title, "Chickens");
  });

  it("collapses extra spaces and trims the ends", () => {
    const parsed = menuCategorySchema.parse({ ...category, title: "  hot   DOGS  " });
    assert.equal(parsed.title, "Hot Dogs");
  });

  it("starts a new word after a hyphen, slash or ampersand", () => {
    const parsed = menuCategorySchema.parse({ ...category, title: "gluten-free/sides & dips" });
    assert.equal(parsed.title, "Gluten-Free/Sides & Dips");
  });

  it("rejects a title that is only spaces", () => {
    assert.equal(menuCategorySchema.safeParse({ ...category, title: "   " }).success, false);
  });

  it("title cases a partial update too", () => {
    const parsed = menuCategoryUpdateSchema.parse({ title: "MEALS" });
    assert.equal(parsed.title, "Meals");
  });
});
