import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { isWorkspaceAdmin, publicUserSelect } from "../lib/access.js";
import { currentProject, currentUser } from "../middleware/auth.js";
import {
  AttachmentError,
  attachmentCreatePayload,
  isInlineMimeType,
  MAX_ATTACHMENT_COUNT,
  safeAttachmentName,
} from "../lib/attachments.js";

const taskInclude = {
  author: { select: publicUserSelect },
  assignee: { select: publicUserSelect },
  comments: true,
  attachments: true,
} as const;

export const getAttachmentFile = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const attachmentId = Number(req.params.attachmentId);

  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    res.status(400).json({ message: "Invalid attachment id" });
    return;
  }

  try {
    const file = await prisma.attachmentFile.findUnique({
      where: { attachmentId },
      include: { attachment: true },
    });

    // Legacy seeded attachments only have a fileURL (served from the client's
    // public folder), so they have no blob row and are not handled here.
    if (!file) {
      res.status(404).json({ message: "Attachment file not found" });
      return;
    }

    const { attachment } = file;
    const fileName = safeAttachmentName(
      attachment.fileName ?? `attachment-${attachmentId}`,
    );
    const mimeType = attachment.mimeType ?? "application/octet-stream";
    const disposition = isInlineMimeType(mimeType) ? "inline" : "attachment";
    const encodedName = encodeURIComponent(fileName);

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Length", String(file.data.length));
    res.setHeader(
      "Content-Disposition",
      `${disposition}; filename="${encodedName}"; filename*=UTF-8''${encodedName}`,
    );
    // Attachments are immutable once created.
    res.setHeader("Cache-Control", "private, max-age=31536000, immutable");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(Buffer.from(file.data));
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving attachment: ${error.message}` });
  }
};

export const addTaskAttachments = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = currentUser(res);
  const taskId = Number(req.params.taskId);

  if (!Number.isInteger(taskId) || taskId <= 0) {
    res.status(400).json({ message: "Invalid task id" });
    return;
  }

  const files = Array.isArray(req.files) ? req.files : [];

  if (files.length === 0) {
    res.status(400).json({ message: "No files were provided" });
    return;
  }

  try {
    const updatedTask = await prisma.$transaction(
      async (tx) => {
        const task = await tx.task.findUnique({
          where: { id: taskId },
          select: { id: true },
        });

        if (!task) {
          throw new AttachmentError("Task not found", 404);
        }

        const existingCount = await tx.attachment.count({
          where: { taskId },
        });

        if (existingCount + files.length > MAX_ATTACHMENT_COUNT) {
          throw new AttachmentError(
            `A task can have at most ${MAX_ATTACHMENT_COUNT} attachments (${existingCount} already attached)`,
          );
        }

        for (const file of files) {
          await tx.attachment.create({
            data: {
              task: { connect: { id: taskId } },
              // The signed-in user is the uploader, never the task author.
              ...attachmentCreatePayload(file, user.id),
            },
          });
        }

        return tx.task.findUnique({
          where: { id: taskId },
          include: taskInclude,
        });
      },
      // Up to five 10 MB blobs are written in this transaction, so the
      // default 5s interactive-transaction timeout can be too tight.
      { timeout: 30_000 },
    );

    if (!updatedTask) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    res.status(201).json(updatedTask);
  } catch (error: any) {
    if (error instanceof AttachmentError) {
      res.status(error.status).json({ message: error.message });
      return;
    }
    if (error.code === "P2003") {
      res.status(400).json({ message: "Task or user does not exist" });
      return;
    }
    res
      .status(500)
      .json({ message: `Error adding attachments: ${error.message}` });
  }
};

export const deleteAttachment = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = currentUser(res);
  const { role } = currentProject(res);
  const attachmentId = Number(req.params.attachmentId);

  if (!Number.isInteger(attachmentId) || attachmentId <= 0) {
    res.status(400).json({ message: "Invalid attachment id" });
    return;
  }

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { id: true, taskId: true, uploadedById: true },
    });

    if (!attachment) {
      res.status(404).json({ message: "Attachment not found" });
      return;
    }

    const canDelete =
      isWorkspaceAdmin(user) ||
      role === "MANAGER" ||
      attachment.uploadedById === user.id;

    if (!canDelete) {
      res.status(403).json({
        message:
          "Only the uploader or a project manager can delete this attachment",
      });
      return;
    }

    // Deleting the Attachment cascades to its AttachmentFile blob. Legacy
    // seeded rows have no blob, so only the row is removed.
    await prisma.attachment.delete({ where: { id: attachmentId } });

    res.status(200).json({
      message: "Attachment deleted successfully",
      id: attachment.id,
      taskId: attachment.taskId,
    });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Attachment not found" });
      return;
    }
    res
      .status(500)
      .json({ message: `Error deleting attachment: ${error.message}` });
  }
};
