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

function brochureUrlOrNull(): string | null {
  const url = envConfig.FRANCHISE.BROCHURE_URL;
  if (/^https:\/\//i.test(url)) return url;
  logger.error({ brochureUrl: url }, "FRANCHISE_BROCHURE_URL is not an https URL");
  return null;
}

export type BrochureRequestInput = { name?: string; email: string; token: string; locale?: "en" | "ar" };

/**
 * Hands the brochure link to a visitor whose email is verified, and tells the
 * franchise team who downloaded it. The team alert is best effort.
 */
export async function requestBrochure(input: BrochureRequestInput): Promise<{ email: string; url: string }> {
  const email = await assertVerifiedEmail(input.email, input.token);

  const url = brochureUrlOrNull();
  if (!url) throw new BadRequestException("The brochure link is not configured correctly");

  const toTeam = brochureLeadAdminEmail({ name: input.name?.trim() ?? "", email, phone: "", locale: input.locale ?? "en" });
  await sendEmail({
    to: envConfig.FRANCHISE.INBOX,
    subject: toTeam.subject,
    htmlContent: toTeam.html,
    replyTo: email,
  }).catch((error) => logger.error({ error }, "Brochure alert email failed to send"));

  return { email, url };
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
  const toApplicant = franchiseApplicationReceivedEmail(app, brochureUrlOrNull());
  await sendEmail({
    to: app.email,
    subject: toApplicant.subject,
    htmlContent: toApplicant.html,
    replyTo: envConfig.FRANCHISE.INBOX,
  }).catch((error) => logger.error({ error }, "Franchise confirmation email failed to send"));

  return { email: app.email };
}
