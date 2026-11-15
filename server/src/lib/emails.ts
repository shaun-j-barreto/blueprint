import type { MailMessage } from "./mailer.js";

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const shell = (heading: string, body: string): string => `
  <div style="font-family:ui-sans-serif,system-ui,-apple-system,'Segoe UI',sans-serif;background:#f7f8fa;padding:28px">
    <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e5ea;border-radius:14px;padding:28px">
      <p style="margin:0 0 18px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#64748b">BluePrint</p>
      <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:#0f172a">${heading}</h1>
      ${body}
      <p style="margin:24px 0 0;font-size:11px;color:#94a3b8">You received this email because someone added you to a BluePrint workspace.</p>
    </div>
  </div>
`;

const button = (href: string, label: string): string => `
  <p style="margin:22px 0">
    <a href="${href}" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:11px 18px;border-radius:9px">${escapeHtml(label)}</a>
  </p>
  <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all">${escapeHtml(href)}</p>
`;

/** Ordering used when describing the workspace role in plain language. */
const roleLabel = (role: string): string => {
  switch (role) {
    case "OWNER":
      return "owner";
    case "ADMIN":
      return "admin";
    case "VIEWER":
      return "viewer";
    default:
      return "member";
  }
};

export const inviteEmail = ({
  to,
  inviterName,
  role,
  projects,
  inviteUrl,
  expiresOn,
}: {
  to: string;
  inviterName: string;
  role: string;
  projects: string[];
  inviteUrl: string;
  expiresOn: string;
}): MailMessage => {
  const projectLine =
    projects.length === 0
      ? "You will start with access to the shared workspace."
      : projects.length === 1
        ? `You also get access to the project ${projects[0]}.`
        : `You also get access to these projects: ${projects.join(", ")}.`;

  return {
    to,
    subject: `${inviterName} invited you to BluePrint`,
    text: [
      `${inviterName} invited you to join BluePrint as ${roleLabel(role)}.`,
      projectLine,
      "",
      `Accept the invitation: ${inviteUrl}`,
      "",
      `This link expires on ${expiresOn}.`,
    ].join("\n"),
    html: shell(
      `${escapeHtml(inviterName)} invited you to BluePrint`,
      `<p style="margin:0;font-size:14px;line-height:1.6;color:#334155">
        You have been invited to join the workspace as <strong>${escapeHtml(roleLabel(role))}</strong>.
        ${escapeHtml(projectLine)}
      </p>
      ${button(inviteUrl, "Accept invitation")}
      <p style="margin:0;font-size:12px;color:#64748b">This link expires on ${escapeHtml(expiresOn)}.</p>`,
    ),
  };
};

export const assignmentEmail = ({
  to,
  assigneeName,
  taskTitle,
  projectName,
  assignedBy,
  taskUrl,
}: {
  to: string;
  assigneeName: string;
  taskTitle: string;
  projectName: string;
  assignedBy: string;
  taskUrl: string;
}): MailMessage => ({
  to,
  subject: `New task assigned: ${taskTitle}`,
  text: [
    `Hi ${assigneeName},`,
    "",
    `${assignedBy} assigned you "${taskTitle}" in ${projectName}.`,
    "",
    `Open the task: ${taskUrl}`,
  ].join("\n"),
  html: shell(
    "A task was assigned to you",
    `<p style="margin:0;font-size:14px;line-height:1.6;color:#334155">
      Hi ${escapeHtml(assigneeName)}, ${escapeHtml(assignedBy)} assigned you
      <strong>${escapeHtml(taskTitle)}</strong> in ${escapeHtml(projectName)}.
    </p>
    ${button(taskUrl, "Open the task")}`,
  ),
});
