import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { formatCurrency, formatDate, formatNumber, resolveLocale, translate } from "./index.ts";

describe("stage 14 locale", () => {
  it("resolves a supported locale and falls back otherwise", () => {
    assert.equal(resolveLocale("en"), "en");
    assert.equal(resolveLocale("ur"), "ur");
    assert.equal(resolveLocale("xx"), "en");
    assert.equal(resolveLocale("../../"), "en");
  });

  it("uses the English string when a translation key is missing", () => {
    assert.equal(translate("en", "nav.menu"), "Menu");
    assert.equal(translate("ur", "nav.menu"), "Menu");
    assert.equal(translate("en", "missing.key"), "missing.key");
  });

  it("formats money as GBP and dates with the locale", () => {
    assert.match(formatCurrency(12.5, "en"), /12\.50/);
    assert.match(formatCurrency(12.5, "ur"), /12\.50|GBP/);
    assert.equal(formatNumber(1200, "en"), "1,200");
    assert.match(formatDate("2026-09-27T12:00:00.000Z", "en"), /2026/);
  });
});
