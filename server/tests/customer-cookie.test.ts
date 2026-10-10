import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, describe, it } from "node:test";
import express from "express";
import cookieParser from "cookie-parser";
import "dotenv/config";
import { identifyCustomer } from "../src/middleware/identify-customer.js";

const COOKIE = "crispy_customer_id";
const servers: Server[] = [];
const VICTIM = "11111111-2222-4333-8444-555555555555";

const app = express();
app.use(cookieParser());
app.use(identifyCustomer);
app.get("/whoami", (req, res) => {
  res.json({ id: req.customerId });
});

const ready = new Promise<number>((resolve) => {
  const server = app.listen(0, "127.0.0.1", () => {
    servers.push(server);
    resolve((server.address() as AddressInfo).port);
  });
});

async function whoami(cookie?: string) {
  const port = await ready;
  const res = await fetch(`http://127.0.0.1:${port}/whoami`, {
    headers: cookie ? { Cookie: `${COOKIE}=${cookie}` } : {},
  });
  const body = (await res.json()) as { id: string };
  const setCookie = res.headers.getSetCookie().find((value) => value.startsWith(`${COOKIE}=`));
  return { id: body.id, setCookie };
}

/** The raw cookie value this server issued (what a browser would send back). */
function issuedValue(setCookie: string | undefined): string {
  assert.ok(setCookie, "a new identity should set the cookie");
  return decodeURIComponent(setCookie.slice(COOKIE.length + 1).split(";")[0]);
}

describe("customer cookie", { concurrency: 1 }, () => {
  it("issues a signed, HttpOnly, SameSite=Lax cookie for a new visitor", async () => {
    const { id, setCookie } = await whoami();
    assert.match(id, /^[0-9a-f-]{36}$/);
    assert.ok(setCookie);
    assert.match(setCookie, /HttpOnly/i);
    assert.match(setCookie, /SameSite=Lax/i);
    assert.match(issuedValue(setCookie), /\./, "value carries a signature");
  });

  it("keeps the same identity for the server-issued cookie", async () => {
    const first = await whoami();
    const second = await whoami(issuedValue(first.setCookie));
    assert.equal(second.id, first.id);
    assert.equal(second.setCookie, undefined, "no new cookie when the identity is trusted");
  });

  it("does not accept a uuid the client picks, even a real customer's", async () => {
    const { id } = await whoami(VICTIM);
    assert.notEqual(id, VICTIM);
  });

  it("does not accept a seeded non-uuid id such as customer-a", async () => {
    const { id } = await whoami("customer-a");
    assert.notEqual(id, "customer-a");
  });

  it("rejects a tampered id with a copied signature", async () => {
    const mine = await whoami();
    const signature = issuedValue(mine.setCookie).split(".")[1];
    const swapped = await whoami(`${VICTIM}.${signature}`);
    assert.notEqual(swapped.id, VICTIM);
    assert.notEqual(swapped.id, mine.id);
  });

  it("rejects a forged signature on another customer's id", async () => {
    const { id } = await whoami(`${VICTIM}.not-a-real-signature`);
    assert.notEqual(id, VICTIM);
  });

  it("rejects a value that is only the signature half", async () => {
    const mine = await whoami();
    const signature = issuedValue(mine.setCookie).split(".")[1];
    const { id } = await whoami(signature);
    assert.notEqual(id, mine.id);
  });
});

after(async () => {
  await Promise.all(servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});
