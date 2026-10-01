import { Resend } from "resend";
import { envConfig } from "../config/env.js";
import { logger } from "../middleware/logger.js";

const resend = new Resend(envConfig.EMAIL.RESEND_API_KEY);

interface SendEmailProps {
  to: string;
  subject: string;
  htmlContent: string;
}

export async function sendEmail({ to, subject, htmlContent }: SendEmailProps) {
  try {
    // Resend resolves with an { error } payload instead of throwing, so both
    // failure shapes have to be checked or a bad send looks like a success.
    const { data, error } = await resend.emails.send({
      from: envConfig.EMAIL.EMAIL_FROM,
      to: [to],
      subject,
      html: htmlContent,
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
