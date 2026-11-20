import { envConfig } from "../config/env.js";
import { logger } from "../middleware/logger.js";
import { sendEmail } from "./email.service.js";
import { assertVerifiedEmail } from "./email-verification.service.js";
import {
  brochureLeadAdminEmail,
  franchiseApplicationEmail,
  franchiseApplicationReceivedEmail,
  type FranchiseApplication,
} from "./email-templates.js";
import { BadRequestException } from "../utils/app-error.js";
import { getCmsContent } from "./cms.service.js";
import { signedDocumentUrl } from "./upload.service.js";

/** The popup opens the brochure straight away, so its link is short-lived. */
const POPUP_LINK_SECONDS = 60 * 60;
/** The confirmation email may be opened days later. */
const EMAIL_LINK_SECONDS = 7 * 24 * 60 * 60;

type Locale = "en" | "ar";

/** The brochure picked for one language in the admin Content tab, or "". */
async function cmsBrochure(locale: Locale): Promise<string> {
  const page = await getCmsContent("franchise", locale);
  const brochures = page.sections.brochures as { items?: { file?: string }[]; shown?: string } | undefined;
  // "0" means the admin switched every brochure off for this language.
  const shown = Number(brochures?.shown ?? "1");
  if (!shown) return "";
  return brochures?.items?.[shown - 1]?.file?.trim() ?? "";
}

/**
 * The brochure for the visitor's language. Arabic falls back to English when
 * it has none, and both fall back to FRANCHISE_BROCHURE_URL.
 */
async function brochureUrlFor(locale: Locale): Promise<string | null> {
  let url = "";
  try {
    url = await cmsBrochure(locale);
    if (!url && locale !== "en") url = await cmsBrochure("en");
  } catch (error) {
    logger.error({ error }, "Franchise brochures could not be read, using the env value");
  }
  url ||= envConfig.FRANCHISE.BROCHURE_URL;
  if (/^https:\/\//i.test(url)) return url;
  logger.error({ brochureUrl: url }, "Franchise brochure is not an https URL");
  return null;
}

export type BrochureRequestInput = { name?: string; email: string; token: string; locale?: "en" | "ar" };

/**
 * Hands the brochure link to a visitor whose email is verified, and tells the
 * franchise team who downloaded it. The team alert is best effort.
 */
export async function requestBrochure(input: BrochureRequestInput): Promise<{ email: string; url: string }> {
  const email = await assertVerifiedEmail(input.email, input.token);

  const url = await brochureUrlFor(input.locale ?? "en");
  if (!url) throw new BadRequestException("The brochure link is not configured correctly");

  const toTeam = brochureLeadAdminEmail({ name: input.name?.trim() ?? "", email, phone: "", locale: input.locale ?? "en" });
  await sendEmail({
    to: envConfig.FRANCHISE.INBOX,
    subject: toTeam.subject,
    htmlContent: toTeam.html,
    replyTo: email,
  }).catch((error) => logger.error({ error }, "Brochure alert email failed to send"));

  return { email, url: signedDocumentUrl(url, POPUP_LINK_SECONDS) };
}

export type FranchiseApplicationInput = FranchiseApplication & { token: string };

/**
 * Emails the application to the franchise inbox, with reply-to set to the
 * applicant. Only a verified email can apply. Nothing else stores the
 * application, so that email must succeed. The applicant then gets a
 * confirmation with the brochure link.
 */
export async function submitApplication(input: FranchiseApplicationInput): Promise<{ email: string }> {
  const { token, ...rest } = input;
  const email = await assertVerifiedEmail(rest.email, token);
  const app: FranchiseApplication = { ...rest, email, locale: rest.locale ?? "en" };
  const brochureUrl = await brochureUrlFor(app.locale ?? "en");

  const toTeam = franchiseApplicationEmail(app);
  try {
    await sendEmail({
      to: envConfig.FRANCHISE.INBOX,
      subject: toTeam.subject,
      htmlContent: toTeam.html,
      replyTo: app.email,
    });
  } catch {
    throw new BadRequestException("We could not send your application right now. Please try again.");
  }

  // Replies go to the franchise inbox. Best effort: the team already has it.
  const toApplicant = franchiseApplicationReceivedEmail(app, brochureUrl && signedDocumentUrl(brochureUrl, EMAIL_LINK_SECONDS));
  await sendEmail({
    to: app.email,
    subject: toApplicant.subject,
    htmlContent: toApplicant.html,
    replyTo: envConfig.FRANCHISE.INBOX,
  }).catch((error) => logger.error({ error }, "Franchise confirmation email failed to send"));

  return { email: app.email };
}
