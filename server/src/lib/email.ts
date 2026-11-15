type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

const defaultFrom = "BluePrint <no-reply@blueprint.local>";

/**
 * Single email entry point. Resend is used when an API key is configured
 * (production); otherwise the message is printed to the server log, which is
 * the local development transport described in the Sprint 1 plan.
 */
export const sendEmail = async ({
  to,
  subject,
  html,
  text,
}: EmailMessage): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.info(`[email:console] to=${to} subject=${subject}\n${text}`);
    return;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM ?? defaultFrom,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(
      `Resend rejected the email (${response.status}): ${detail}`,
    );
  }
};
