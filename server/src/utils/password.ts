import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

let dummyHash: Promise<string> | null = null;

function timingPad(): Promise<string> {
  dummyHash ??= hashPassword("timing-pad");
  return dummyHash;
}

/**
 * Unknown emails still pay for one scrypt compare, so login timing does not
 * reveal whether the address exists.
 */
export async function checkPassword(password: string, stored: string | null | undefined): Promise<boolean> {
  const hash = stored && stored.includes(":") ? stored : await timingPad();
  return verifyPassword(password, hash);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = (await scryptAsync(password, salt, 64)) as Buffer;
  const hashBuf = Buffer.from(hash, "hex");
  if (hashBuf.length !== derived.length) return false;
  return timingSafeEqual(hashBuf, derived);
}
