import * as sib from "@getbrevo/brevo";
import { envConfig } from "../config/env.js";
import { logger } from "../middleware/logger.js";

const client = new sib.BrevoClient({
  apiKey: envConfig.EMAIL.BREVO_SMTP_SDK_KEY,
});

interface SendEmailProps {
  to: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailProps) {
  try {
    const res = await client.transactionalEmails.sendTransacEmail({
      sender: { email: envConfig.EMAIL.EMAIL_FROM, name: "Crispies" },
      to: [{ email: to }],
      subject,
      htmlContent,
    });
    logger.info({ to, subject }, "Email sent");
    return res;
  } catch (error) {
    logger.error({ error, to, subject }, "Failed to send email");
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
