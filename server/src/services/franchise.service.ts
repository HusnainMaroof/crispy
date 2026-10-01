import { envConfig } from "../config/env.js";
import { logger } from "../middleware/logger.js";
import { sendAdminEmail, sendEmail } from "./email.service.js";
import { brochureEmail, brochureLeadAdminEmail, type BrochureLead } from "./email-templates.js";
import { BadRequestException } from "../utils/app-error.js";

export type BrochureRequestInput = BrochureLead;

/**
 * Stores the lead, emails the brochure to the visitor, and alerts the franchise
 * team. The visitor's email is the only thing that must succeed — a provider
 * outage should still look like a success to them, and the lead is already
 * saved for a manual follow-up.
 */
export async function requestBrochure(input: BrochureRequestInput): Promise<{ email: string }> {
  const email = input.email.trim().toLowerCase();
  const name = input.name?.trim() ?? "";
  const phone = input.phone?.trim() ?? "";
  const locale = input.locale ?? "en";

  const lead: BrochureLead = { name, email, phone, locale };

  const brochureUrl = envConfig.FRANCHISE.BROCHURE_URL;
  if (!/^https:\/\//i.test(brochureUrl)) {
    throw new BadRequestException("The brochure link is not configured correctly");
  }

  const toVisitor = brochureEmail(lead, brochureUrl);
  const toAdmin = brochureLeadAdminEmail(lead);

  const results = await Promise.allSettled([
    sendEmail({ to: email, subject: toVisitor.subject, htmlContent: toVisitor.html }),
    sendAdminEmail(toAdmin.subject, toAdmin.html),
  ]);

  for (const result of results) {
    if (result.status === "rejected") {
      logger.error({ error: result.reason }, "Brochure email failed to send");
    }
  }

  const visitorFailed = results[0].status === "rejected";
  if (visitorFailed) {
    throw new BadRequestException("We could not send the brochure right now. Please try again.");
  }

  return { email };
}
