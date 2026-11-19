import { readFileSync } from "node:fs";
import { Resend } from "resend";
import { envConfig } from "../config/env.js";
import { logger } from "../middleware/logger.js";

const resend = new Resend(envConfig.EMAIL.RESEND_API_KEY);

/** A file sent with the email. With `contentId` it is shown inline via `cid:`. */
export interface EmailAttachment {
  filename: string;
  content: Buffer;
  contentType?: string;
  contentId?: string;
}

interface SendEmailProps {
  to: string;
  subject: string;
  htmlContent: string;
  /** Where a reply goes, e.g. the applicant, so the team can answer from the inbox. */
  replyTo?: string;
  /** Plain-text version. Shown by text-only clients and helps spam scoring. */
  text?: string;
  attachments?: EmailAttachment[];
}

const LOGO_CID = "crispies-logo";
let logoFile: Buffer | null | undefined;

/**
 * The logo for email headers. EMAIL_LOGO_URL wins when set. Otherwise the
 * official logo in server/assets/email-logo.png (made from the site's
 * svgLogo.svg) is attached inline, so it shows without any outside link.
 * The path is the same from src/services and dist/services.
 */
export function emailLogo(): { src: string; attachments: EmailAttachment[] } {
  if (envConfig.EMAIL.LOGO_URL) return { src: envConfig.EMAIL.LOGO_URL, attachments: [] };
  if (logoFile === undefined) {
    try {
      logoFile = readFileSync(new URL("../../assets/email-logo.png", import.meta.url));
    } catch (err) {
      logger.error({ err }, "Email logo file is missing, sending without it");
      logoFile = null;
    }
  }
  if (!logoFile) return { src: "", attachments: [] };
  return {
    src: `cid:${LOGO_CID}`,
    attachments: [{ filename: "crispies-logo.png", content: logoFile, contentType: "image/png", contentId: LOGO_CID }],
  };
}

export async function sendEmail({ to, subject, htmlContent, replyTo, text, attachments }: SendEmailProps) {
  try {
    // Resend resolves with an { error } payload instead of throwing, so both
    // failure shapes have to be checked or a bad send looks like a success.
    const { data, error } = await resend.emails.send({
      from: envConfig.EMAIL.EMAIL_FROM,
      to: [to],
      subject,
      html: htmlContent,
      ...(replyTo ? { replyTo } : {}),
      ...(text ? { text } : {}),
      ...(attachments?.length ? { attachments } : {}),
    });
    if (error) throw new Error(error.message);
    logger.info({ id: data?.id }, "Email sent");
    return data;
  } catch (error) {
    logger.error({ err: error, subject }, "Failed to send email");
    throw error;
  }
}

export async function sendAdminEmail(subject: string, htmlContent: string) {
  return sendEmail({
    to: envConfig.EMAIL.ADMIN_EMAIL,
    subject,
    htmlContent,
  });
}
