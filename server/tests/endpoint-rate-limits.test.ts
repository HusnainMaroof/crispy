import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, describe, it } from "node:test";
import express, { type RequestHandler } from "express";
import "dotenv/config";
import { brochureLimiter, contactLimiter, translateLimiter } from "../src/middleware/rate-limiter.js";

const servers: Server[] = [];

async function startWith(limiter: RequestHandler): Promise<number> {
  const app = express();
  app.use(express.json());
  app.post("/limited", limiter, (_req, res) => {
    res.json({ ok: true });
  });
  return new Promise((resolve) => {
    const server = app.listen(0, "127.0.0.1", () => {
      servers.push(server);
      resolve((server.address() as AddressInfo).port);
    });
  });
}

async function postMany(port: number, count: number): Promise<number[]> {
  const statuses: number[] = [];
  for (let index = 0; index < count; index += 1) {
    const res = await fetch(`http://127.0.0.1:${port}/limited`, { method: "POST" });
    statuses.push(res.status);
    await res.arrayBuffer();
  }
  return statuses;
}

describe("endpoint rate limits", { concurrency: 1 }, () => {
  it("contact allows five messages per window and then refuses", async () => {
    const port = await startWith(contactLimiter);
    const statuses = await postMany(port, 6);
    assert.deepEqual(statuses.slice(0, 5), [200, 200, 200, 200, 200]);
    assert.equal(statuses[5], 429);
  });

  it("brochure allows five requests per window and then refuses", async () => {
    const port = await startWith(brochureLimiter);
    const statuses = await postMany(port, 6);
    assert.deepEqual(statuses.slice(0, 5), [200, 200, 200, 200, 200]);
    assert.equal(statuses[5], 429);
  });

  it("translate allows sixty calls per window and then refuses", async () => {
    const port = await startWith(translateLimiter);
    const statuses = await postMany(port, 61);
    assert.equal(statuses.slice(0, 60).every((status) => status === 200), true);
    assert.equal(statuses[60], 429);
  });

  it("returns the standard too-many error body", async () => {
    const port = await startWith(contactLimiter);
    await postMany(port, 5);
    const res = await fetch(`http://127.0.0.1:${port}/limited`, { method: "POST" });
    assert.equal(res.status, 429);
    const body = (await res.json()) as { success: boolean; code: string };
    assert.equal(body.success, false);
    assert.equal(body.code, "ERR_TOO_MANY");
  });
});

after(async () => {
  await Promise.all(servers.map((server) => new Promise<void>((resolve) => server.close(() => resolve()))));
});
