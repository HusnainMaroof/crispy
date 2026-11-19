import { createHash, createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { getPrisma } from "../config/prisma.js";
import { envConfig } from "../config/env.js";
import { HTTPSTATUS } from "../config/http.js";
import { logger } from "../middleware/logger.js";
import { emailLogo, sendEmail } from "./email.service.js";
import { verificationCodeEmail } from "./email-templates.js";
import { AppError, BadRequestException, ERROR_CODES, ForbiddenException } from "../utils/app-error.js";

/** How long a code can be used. */
export const CODE_TTL_MINUTES = 10;
/** Wrong guesses allowed before the code is burned. */
const MAX_ATTEMPTS = 5;
/** Minimum gap between two codes for the same email. */
export const RESEND_COOLDOWN_SECONDS = 30;
/** How long a verified email stays unlocked for the brochure and the form. */
const TOKEN_TTL_MINUTES = 60;

const normalize = (email: string) => email.trim().toLowerCase();

function hashCode(email: string, code: string): string {
  return createHmac("sha256", envConfig.JWT.SECRET).update(`${email}:${code}`).digest("hex");
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function sameHash(a: string, b: string): boolean {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  return left.length === right.length && timingSafeEqual(left, right);
}

/**
 * Creates a fresh 4-digit code for the email and sends it. Any older code for
 * the same email stops working, so only the newest email in the inbox counts.
 */
export async function sendVerificationCode(input: { name?: string; email: string; locale?: "en" | "ar" }) {
  const email = normalize(input.email);
  const prisma = getPrisma();

  const last = await prisma.email_verifications.findFirst({
    where: { email },
    orderBy: { created_at: "desc" },
    select: { created_at: true },
  });
  if (last && Date.now() - last.created_at.getTime() < RESEND_COOLDOWN_SECONDS * 1000) {
    throw new AppError("Please wait a moment before asking for a new code", HTTPSTATUS.TOO_MANY, ERROR_CODES.BAD_REQUEST);
  }

  const code = randomInt(0, 10_000).toString().padStart(4, "0");

  // Old unverified codes for this email are replaced. Verified rows are kept
  // so a token already issued keeps working until it expires.
  await prisma.email_verifications.deleteMany({
    where: {
      email,
      OR: [{ verified_at: null }, { token_expires_at: { lt: new Date() } }],
    },
  });
  await prisma.email_verifications.create({
    data: {
      email,
      code_hash: hashCode(email, code),
      expires_at: new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000),
    },
  });

  const logo = emailLogo();
  const message = verificationCodeEmail({
    code,
    minutes: CODE_TTL_MINUTES,
    locale: input.locale ?? "en",
    name: input.name?.trim() ?? "",
    logoUrl: logo.src,
  });
  try {
    await sendEmail({
      to: email,
      subject: message.subject,
      htmlContent: message.html,
      text: message.text,
      attachments: logo.attachments,
    });
  } catch {
    throw new BadRequestException("We could not send the code right now. Please try again.");
  }

  return { email, expiresInMinutes: CODE_TTL_MINUTES, resendInSeconds: RESEND_COOLDOWN_SECONDS };
}

/** Checks the code. A correct one returns a token for the brochure and the form. */
export async function checkVerificationCode(input: { email: string; code: string }) {
  const email = normalize(input.email);
  const prisma = getPrisma();

  const row = await prisma.email_verifications.findFirst({
    where: { email, verified_at: null },
    orderBy: { created_at: "desc" },
  });

  const wrong = () => new BadRequestException("That code is not correct, or it has expired. Try again or send a new one.");

  if (!row || row.expires_at.getTime() < Date.now() || row.attempts >= MAX_ATTEMPTS) throw wrong();

  if (!sameHash(row.code_hash, hashCode(email, input.code))) {
    await prisma.email_verifications.update({ where: { id: row.id }, data: { attempts: { increment: 1 } } });
    throw wrong();
  }

  const token = randomBytes(32).toString("base64url");
  // Only an unverified, unburned row can be claimed, so two tabs racing with
  // the same code cannot both get a token.
  const claimed = await prisma.email_verifications.updateMany({
    where: { id: row.id, verified_at: null, attempts: { lt: MAX_ATTEMPTS } },
    data: {
      verified_at: new Date(),
      token_hash: hashToken(token),
      token_expires_at: new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000),
    },
  });
  if (claimed.count !== 1) throw wrong();

  logger.info({ email }, "Email verified");
  return { email, token, expiresInMinutes: TOKEN_TTL_MINUTES };
}

/** Throws unless the token was issued for this email and has not expired. */
export async function assertVerifiedEmail(emailInput: string, token: string): Promise<string> {
  const email = normalize(emailInput);
  const row = await getPrisma().email_verifications.findUnique({
    where: { token_hash: hashToken(token) },
    select: { email: true, token_expires_at: true },
  });
  if (!row || row.email !== email || !row.token_expires_at || row.token_expires_at.getTime() < Date.now()) {
    throw new ForbiddenException("Please verify your email first");
  }
  return email;
}
