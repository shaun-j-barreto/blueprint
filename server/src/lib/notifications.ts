import { prisma } from "../prisma.js";
import { assignmentEmail } from "./emails.js";
import { sendMail } from "./mailer.js";

const clientOrigin = (): string =>
  (process.env.CLIENT_ORIGIN ?? process.env.BETTER_AUTH_URL ?? "")
    .trim()
    .replace(/\/+$/, "");

/**
 * Emails a new assignee. Deliberately fire-and-forget: a missing address or an
 * SMTP outage must never fail the task write that triggered it.
 */
export const notifyTaskAssignment = async ({
  taskId,
  assigneeId,
  actorName,
}: {
  taskId: number;
  assigneeId: number;
  actorName: string;
}): Promise<void> => {
  const [task, assignee] = await Promise.all([
    prisma.task.findUnique({
      where: { id: taskId },
      select: {
        title: true,
        projectId: true,
        project: { select: { name: true } },
      },
    }),
    prisma.user.findUnique({
      where: { id: assigneeId },
      select: { email: true, username: true, deactivatedAt: true },
    }),
  ]);

  if (!task || !assignee || assignee.deactivatedAt !== null) return;

  await sendMail(
    assignmentEmail({
      to: assignee.email,
      assigneeName: assignee.username,
      taskTitle: task.title,
      projectName: task.project.name,
      assignedBy: actorName,
      taskUrl: `${clientOrigin()}/projects/${task.projectId}`,
    }),
  );
};
