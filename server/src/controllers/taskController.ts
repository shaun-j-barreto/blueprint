import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import {
  attachmentCreatePayload,
} from "../lib/attachments.js";

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const { projectId } = req.query;
  try {
    const tasks = await prisma.task.findMany({
      where: {
        projectId: Number(projectId),
      },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });
    res.json(tasks);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retriving tasks: ${error.message}` });
  }
};

export const createTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  // multipart/form-data fields arrive as strings; plain JSON callers keep
  // their original types. Everything is normalised below.
  const body = req.body ?? {};
  const files = Array.isArray(req.files) ? req.files : [];

  const title = typeof body.title === "string" ? body.title.trim() : "";
  if (title === "") {
    res.status(400).json({ message: "Title is required" });
    return;
  }

  const projectId = Number(body.projectId);
  if (!Number.isInteger(projectId) || projectId <= 0) {
    res.status(400).json({ message: "Invalid projectId" });
    return;
  }

  const authorUserId = Number(body.authorUserId);
  if (!Number.isInteger(authorUserId) || authorUserId <= 0) {
    res.status(400).json({ message: "Invalid authorUserId" });
    return;
  }

  let assignedUserId: number | null = null;
  if (
    body.assignedUserId !== undefined &&
    body.assignedUserId !== null &&
    body.assignedUserId !== ""
  ) {
    assignedUserId = Number(body.assignedUserId);
    if (!Number.isInteger(assignedUserId) || assignedUserId <= 0) {
      res.status(400).json({ message: "Invalid assignedUserId" });
      return;
    }
  }

  let points: number | null = null;
  if (body.points !== undefined && body.points !== null && body.points !== "") {
    points = Number(body.points);
    if (!Number.isInteger(points) || points < 0) {
      res.status(400).json({ message: "Invalid points" });
      return;
    }
  }

  const dates: { startDate: Date | null; dueDate: Date | null } = {
    startDate: null,
    dueDate: null,
  };
  for (const field of ["startDate", "dueDate"] as const) {
    const value = body[field];
    if (value === undefined || value === null || value === "") continue;

    const date = new Date(value);
    if (isNaN(date.getTime())) {
      res.status(400).json({ message: `Invalid ${field}` });
      return;
    }
    dates[field] = date;
  }

  const optionalText = (value: unknown): string | null =>
    typeof value === "string" && value.trim() !== "" ? value : null;

  try {
    const newTask = await prisma.task.create({
      data: {
        title,
        description: optionalText(body.description),
        status: optionalText(body.status),
        priority: optionalText(body.priority),
        tags: optionalText(body.tags),
        startDate: dates.startDate,
        dueDate: dates.dueDate,
        points,
        projectId,
        authorUserId,
        assignedUserId,
        // Nested create keeps the task and its attachment blobs in one
        // transaction: a rejected file means no task is created.
        ...(files.length > 0
          ? {
              attachments: {
                create: files.map((file) =>
                  attachmentCreatePayload(file, authorUserId),
                ),
              },
            }
          : {}),
      },
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });
    res.status(201).json(newTask);
  } catch (error: any) {
    if (error.code === "P2003") {
      res.status(400).json({
        message: "Project, author, or assignee does not exist",
      });
      return;
    }
    res.status(500).json({ message: `Error creating task: ${error.message}` });
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { taskId } = req.params;
  const id = Number(taskId);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "Invalid task id" });
    return;
  }

  const body = req.body ?? {};
  const data: Record<string, any> = {};

  if (body.title !== undefined) {
    if (typeof body.title !== "string" || body.title.trim() === "") {
      res.status(400).json({ message: "Title cannot be empty" });
      return;
    }
    data.title = body.title.trim();
  }

  if (body.description !== undefined) {
    if (body.description !== null && typeof body.description !== "string") {
      res.status(400).json({ message: "Invalid description" });
      return;
    }
    data.description =
      typeof body.description === "string" && body.description.trim() === ""
        ? null
        : body.description;
  }

  for (const field of ["status", "priority", "tags"] as const) {
    if (body[field] === undefined) continue;
    if (body[field] !== null && typeof body[field] !== "string") {
      res.status(400).json({ message: `Invalid ${field}` });
      return;
    }
    data[field] = body[field] === "" ? null : body[field];
  }

  for (const field of ["startDate", "dueDate"] as const) {
    if (body[field] === undefined) continue;
    if (body[field] === null || body[field] === "") {
      data[field] = null;
      continue;
    }
    const date = new Date(body[field]);
    if (isNaN(date.getTime())) {
      res.status(400).json({ message: `Invalid ${field}` });
      return;
    }
    data[field] = date;
  }

  if (body.points !== undefined) {
    if (body.points === null || body.points === "") {
      data.points = null;
    } else {
      const points = Number(body.points);
      if (!Number.isInteger(points) || points < 0) {
        res.status(400).json({ message: "Invalid points" });
        return;
      }
      data.points = points;
    }
  }

  if (body.authorUserId !== undefined) {
    const authorUserId = Number(body.authorUserId);
    if (!Number.isInteger(authorUserId) || authorUserId <= 0) {
      res.status(400).json({ message: "Invalid authorUserId" });
      return;
    }
    data.authorUserId = authorUserId;
  }

  if (body.assignedUserId !== undefined) {
    if (body.assignedUserId === null || body.assignedUserId === "") {
      data.assignedUserId = null;
    } else {
      const assignedUserId = Number(body.assignedUserId);
      if (!Number.isInteger(assignedUserId) || assignedUserId <= 0) {
        res.status(400).json({ message: "Invalid assignedUserId" });
        return;
      }
      data.assignedUserId = assignedUserId;
    }
  }

  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: "No valid fields provided to update" });
    return;
  }

  try {
    const updatedTask = await prisma.task.update({
      where: { id },
      data,
      include: {
        author: true,
        assignee: true,
        comments: true,
        attachments: true,
      },
    });
    res.json(updatedTask);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    if (error.code === "P2003") {
      res
        .status(400)
        .json({ message: "Author or assignee does not exist" });
      return;
    }
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

export const updateTasksStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    const updatedTask = await prisma.task.update({
      where: {
        id: Number(taskId),
      },
      data: {
        status: status,
      },
    });
    res.json(updatedTask);
  } catch (error: any) {
    res.status(500).json({ message: `Error updating tasks: ${error.message}` });
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { taskId } = req.params;
  const id = Number(taskId);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "Invalid task id" });
    return;
  }

  try {
    // Comments, attachments and task assignments reference Task with
    // ON DELETE RESTRICT, so they must be removed first. The array form of
    // $transaction runs these in order and rolls back if any step fails.
    await prisma.$transaction([
      prisma.comment.deleteMany({ where: { taskId: id } }),
      prisma.attachment.deleteMany({ where: { taskId: id } }),
      prisma.taskAssignment.deleteMany({ where: { taskId: id } }),
      prisma.task.delete({ where: { id } }),
    ]);

    res.status(200).json({ message: "Task deleted successfully", id });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.status(500).json({ message: `Error deleting task: ${error.message}` });
  }
};

export const getUserTasks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { userId } = req.params;
  try {
    const tasks = await prisma.task.findMany({
      where: {
        OR: [
          { authorUserId: Number(userId) },
          { assignedUserId: Number(userId) },
        ],
      },
      include: {
        author: true,
        assignee: true,
        attachments: true,
      },
    });
    res.json(tasks);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving user's tasks: ${error.message}` });
  }
};
