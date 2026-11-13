import { Request, Response } from "express";
import { prisma } from "../prisma.js";

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
  const {
    title,
    description,
    status,
    priority,
    tags,
    startDate,
    dueDate,
    points,
    projectId,
    authorUserId,
    assignedUserId,
  } = req.body;
  try {
    const newtask = await prisma.task.create({
      data: {
        title,
        description,
        status,
        priority,
        tags,
        startDate,
        dueDate,
        points,
        projectId,
        authorUserId,
        assignedUserId,
      },
    });
    res.status(201).json(newtask);
  } catch (error: any) {
    res.status(500).json({ message: `Error creating task: ${error.message}` });
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
