const escapeHtml = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

type ResetPasswordEmailProps = {
  name: string;
  url: string;
};

/**
 * Plain-text and HTML bodies for the password-reset email. The link carries a
 * single-use token that expires after one hour.
 */
export const resetPasswordEmail = ({
  name,
  url,
}: ResetPasswordEmailProps): {
  subject: string;
  html: string;
  text: string;
} => {
  const safeName = escapeHtml(name);
  const safeUrl = escapeHtml(url);

  const text = [
    `Hi ${name},`,
    "",
    "Someone asked to reset the password for your BluePrint account.",
    "Open the link below to choose a new password. It expires in one hour and can only be used once.",
    "",
    url,
    "",
    "If you did not ask for this, you can ignore this email. Your password will not change.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="en">
  <body style="margin:0;padding:24px;background:#f5f3ff;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:12px;padding:32px;">
      <tr>
        <td>
          <h1 style="margin:0 0 16px;font-size:20px;color:#312e81;">Reset your BluePrint password</h1>
          <p style="margin:0 0 12px;line-height:1.5;">Hi ${safeName},</p>
          <p style="margin:0 0 20px;line-height:1.5;">
            Someone asked to reset the password for your BluePrint account. Choose a new password
            using the button below. The link expires in one hour and can only be used once.
          </p>
          <p style="margin:0 0 24px;">
            <a href="${safeUrl}" style="display:inline-block;background:#4338ca;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:8px;font-weight:600;">
              Choose a new password
            </a>
          </p>
          <p style="margin:0 0 8px;line-height:1.5;font-size:13px;color:#4b5563;">
            If the button does not work, copy this link into your browser:
          </p>
          <p style="margin:0 0 20px;word-break:break-all;font-size:13px;color:#4338ca;">${safeUrl}</p>
          <p style="margin:0;line-height:1.5;font-size:13px;color:#4b5563;">
            If you did not ask for this, you can ignore this email. Your password will not change.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    subject: "Reset your BluePrint password",
    html,
    text,
  };
};
