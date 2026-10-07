import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { removalMode } from "../scripts/remove-mock-menu.ts";

describe("remove mock menu guards", () => {
  it("dry-runs unless --confirm is passed", () => {
    assert.equal(removalMode("development", []).confirm, false);
    assert.equal(removalMode("development", ["--confirm"]).confirm, true);
  });

  it("refuses production without a backup flag", () => {
    assert.throws(
      () => removalMode("production", []),
      /--i-have-a-backup/,
    );
    assert.throws(
      () => removalMode("production", ["--confirm"]),
      /--i-have-a-backup/,
    );
  });

  it("allows a production dry-run only after the backup flag", () => {
    assert.equal(removalMode("production", ["--i-have-a-backup"]).confirm, false);
    assert.equal(removalMode("production", ["--confirm", "--i-have-a-backup"]).confirm, true);
  });
});
