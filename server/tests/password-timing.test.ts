import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { checkPassword, hashPassword } from "../src/utils/password.js";

describe("login password check", () => {
  it("rejects an unknown account after a real hash compare", async () => {
    assert.equal(await checkPassword("guess", null), false);
  });

  it("accepts the right password and rejects the wrong one", async () => {
    const stored = await hashPassword("correct-horse");
    assert.equal(await checkPassword("correct-horse", stored), true);
    assert.equal(await checkPassword("wrong-horse", stored), false);
  });
});
