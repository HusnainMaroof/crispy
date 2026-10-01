import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCurrency, formatDate, formatNumber, localeDir, localizedName, localizedText, resolveLocale, translate } from "./index.ts";

describe("stage 14 locale", () => {
  it("resolves a supported locale and falls back otherwise", () => {
    assert.equal(resolveLocale("en"), "en");
    assert.equal(resolveLocale("ar"), "ar");
    assert.equal(resolveLocale("AR"), "ar");
    assert.equal(resolveLocale("ar-SA"), "ar");
    assert.equal(resolveLocale("ur"), "en");
    assert.equal(resolveLocale("xx"), "en");
    assert.equal(resolveLocale("../../"), "en");
  });

  it("uses the Arabic catalogue name, then a known phrase, then English", () => {
    assert.equal(localizedName("ar", "Burgers", "البرجر"), "البرجر");
    assert.equal(localizedName("ar", "Crispy Chicken Burger"), "برجر دجاج مقرمش");
    assert.equal(localizedName("en", "Crispy Chicken Burger", "برجر دجاج مقرمش"), "Crispy Chicken Burger");
    assert.equal(localizedText("ar", "Coming Soon"), "قريباً");
    assert.equal(localizedText("ar", "11:00 AM – 11:00 PM"), "11:00 ص – 11:00 م");
  });

  it("uses the English string when a translation key is missing", () => {
    assert.equal(translate("en", "nav.menu"), "Menu");
    assert.equal(translate("ar", "nav.menu"), "القائمة");
    assert.equal(translate("en", "missing.key"), "missing.key");
    assert.equal(translate("ar", "missing.key"), "missing.key");
  });

  it("fills interpolation params", () => {
    assert.equal(translate("en", "cart.count", { count: 3 }), "3 items");
    assert.equal(translate("ar", "cart.count", { count: 3 }), "3 أصناف");
    assert.equal(translate("en", "order.statusLine", { id: 7, status: "Ready" }), "Order #7 is Ready.");
  });

  it("formats money as GBP and dates with the locale", () => {
    assert.match(formatCurrency(12.5, "en"), /12\.50/);
    assert.match(formatCurrency(12.5, "ar"), /12\.50|GBP/);
    assert.equal(formatNumber(1200, "en"), "1,200");
    assert.match(formatDate("2026-09-27T12:00:00.000Z", "en"), /2026/);
    assert.match(formatDate("2026-09-27T12:00:00.000Z", "ar"), /٢٠٢٦|2026/);
  });

  it("flips the page right-to-left for Arabic only", () => {
    assert.equal(localeDir("ar"), "rtl");
    assert.equal(localeDir("en"), "ltr");
    assert.equal(localeDir("xx"), "ltr");
  });
});
