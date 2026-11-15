import nodemailer, { type Transporter } from "nodemailer";

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const host = process.env.SMTP_HOST?.trim();
const port = Number(process.env.SMTP_PORT ?? 1025);
const user = process.env.SMTP_USER?.trim();
const pass = process.env.SMTP_PASSWORD;
const from =
  process.env.MAIL_FROM?.trim() || "BluePrint <no-reply@blueprint.local>";

/** True when SMTP is configured; used to decide whether links are surfaced. */
export const isMailerConfigured = Boolean(host);

let transporter: Transporter | null = null;

const getTransporter = (): Transporter | null => {
  if (!host) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: process.env.SMTP_SECURE === "true",
    auth: user ? { user, pass } : undefined,
  });

  return transporter;
};

/**
 * Sends a message when SMTP is configured. Without SMTP (local development,
 * CI) the message is printed to the server log instead so flows that depend on
 * a link — invitations, assignments — stay testable without extra services.
 *
 * Never throws: a mail outage must not roll back the database work that
 * triggered the message. Callers get a boolean so they can report delivery.
 */
export const sendMail = async (message: MailMessage): Promise<boolean> => {
  const transport = getTransporter();

  if (!transport) {
    console.log(
      [
        "",
        "────────── email preview (SMTP not configured) ──────────",
        `To:      ${message.to}`,
        `Subject: ${message.subject}`,
        "",
        message.text,
        "─────────────────────────────────────────────────────────",
        "",
      ].join("\n"),
    );
    return false;
  }

  try {
    await transport.sendMail({ from, ...message });
    return true;
  } catch (error) {
    console.error("Failed to send email", {
      to: message.to,
      subject: message.subject,
      error,
    });
    return false;
  }
};
