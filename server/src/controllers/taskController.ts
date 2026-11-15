import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import {
  accessibleProjectIds,
  isActiveProjectMember,
  isWorkspaceAdmin,
  projectRoleFor,
  publicUserSelect,
} from "../lib/access.js";
import { attachmentCreatePayload } from "../lib/attachments.js";
import { currentProject, currentUser } from "../middleware/auth.js";
import {
  projectIdQuerySchema,
  type TaskCreateInput,
  type TaskStatusInput,
  type TaskUpdateInput,
} from "../validation/schemas.js";

const taskInclude = {
  author: { select: publicUserSelect },
  assignee: { select: publicUserSelect },
  comments: true,
  attachments: true,
} as const;

const optionalText = (value: string | null | undefined): string | null =>
  typeof value === "string" && value.trim() !== "" ? value : null;

const optionalId = (
  value: number | "" | null | undefined,
): number | null => (typeof value === "number" ? value : null);

const optionalPoints = (
  value: number | "" | null | undefined,
): number | null => (typeof value === "number" ? value : null);

const toDate = (value: string | null | undefined): Date | null => {
  if (value === undefined || value === null || value === "") return null;
  return new Date(value);
};

const taskIdFrom = (req: Request): number | null => {
  const id = Number(req.params.taskId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
  const user = currentUser(res);
  const parsedQuery = projectIdQuerySchema.safeParse(req.query);

  if (!parsedQuery.success) {
    res.status(400).json({ message: "Invalid projectId" });
    return;
  }

  const filter = parsedQuery.data.projectId;

  try {
    const accessibleIds = await accessibleProjectIds(user);

    let where;
    if (filter !== undefined && filter !== "") {
      if (accessibleIds !== null && !accessibleIds.includes(filter)) {
        // Same response as a missing project: do not leak project ids.
        res.status(404).json({ message: "Project not found" });
        return;
      }
      where = { projectId: filter };
    } else {
      // The collection endpoint doubles as the dashboard source. Without an
      // explicit project it must still be limited to what the caller can read.
      where =
        accessibleIds === null ? {} : { projectId: { in: accessibleIds } };
    }

    const tasks = await prisma.task.findMany({ where, include: taskInclude });
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ message: `Error retrieving tasks: ${error.message}` });
  }
};

export const createTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = currentUser(res);
  const body = req.body as TaskCreateInput;
  const files = Array.isArray(req.files) ? req.files : [];

  const title = body.title.trim();
  if (title === "") {
    res.status(400).json({ message: "Title is required" });
    return;
  }

  const assignedUserId = optionalId(body.assignedUserId);

  try {
    // The project id travels in the body, so project membership has to be
    // checked here rather than in the route guard.
    const accessibleIds = await accessibleProjectIds(user);

    if (accessibleIds !== null && !accessibleIds.includes(body.projectId)) {
      res.status(404).json({ message: "Project not found" });
      return;
    }

    if (!isWorkspaceAdmin(user)) {
      const role = await projectRoleFor(user.id, body.projectId);

      if (role !== "MANAGER" && role !== "CONTRIBUTOR") {
        res.status(403).json({
          message: "You don't have permission to add tasks to this project",
        });
        return;
      }
    }

    if (
      assignedUserId !== null &&
      !(await isActiveProjectMember(body.projectId, assignedUserId))
    ) {
      res.status(422).json({
        message: "Assignee must be an active member of this project",
      });
      return;
    }

    const newTask = await prisma.task.create({
      data: {
        title,
        description: optionalText(body.description),
        status: optionalText(body.status),
        priority: optionalText(body.priority),
        tags: optionalText(body.tags),
        startDate: toDate(body.startDate),
        dueDate: toDate(body.dueDate),
        points: optionalPoints(body.points),
        projectId: body.projectId,
        // The author is always the signed-in user; client input is ignored.
        authorUserId: user.id,
        assignedUserId,
        // Nested create keeps the task and its attachment blobs in one
        // transaction: a rejected file means no task is created.
        ...(files.length > 0
          ? {
              attachments: {
                create: files.map((file) =>
                  attachmentCreatePayload(file, user.id),
                ),
              },
            }
          : {}),
      },
      include: taskInclude,
    });

    res.status(201).json(newTask);
  } catch (error: any) {
    if (error.code === "P2003") {
      res.status(400).json({ message: "Project or assignee does not exist" });
      return;
    }
    res.status(500).json({ message: `Error creating task: ${error.message}` });
  }
};

export const updateTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = currentUser(res);
  const taskId = taskIdFrom(req);

  if (taskId === null) {
    res.status(400).json({ message: "Invalid task id" });
    return;
  }

  const body = req.body as TaskUpdateInput;

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { id: true, authorUserId: true, projectId: true },
    });

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const data: {
      title?: string;
      description?: string | null;
      status?: string | null;
      priority?: string | null;
      tags?: string | null;
      startDate?: Date | null;
      dueDate?: Date | null;
      points?: number | null;
      authorUserId?: number;
      assignedUserId?: number | null;
    } = {};

    if (body.title !== undefined) {
      const title = body.title.trim();
      if (title === "") {
        res.status(400).json({ message: "Title cannot be empty" });
        return;
      }
      data.title = title;
    }

    if (body.description !== undefined) {
      data.description = optionalText(body.description);
    }
    for (const field of ["status", "priority", "tags"] as const) {
      if (body[field] !== undefined) {
        data[field] = optionalText(body[field]);
      }
    }

    for (const field of ["startDate", "dueDate"] as const) {
      if (body[field] !== undefined) {
        data[field] = toDate(body[field]);
      }
    }

    if (body.points !== undefined) {
      data.points = optionalPoints(body.points);
    }

    if (body.authorUserId !== undefined) {
      const nextAuthor = optionalId(body.authorUserId);

      if (nextAuthor !== null && nextAuthor !== task.authorUserId) {
        if (!isWorkspaceAdmin(user)) {
          res.status(403).json({
            message: "Only workspace owners and admins can change the author",
          });
          return;
        }
        data.authorUserId = nextAuthor;
      }
    }

    if (body.assignedUserId !== undefined) {
      const nextAssignee = optionalId(body.assignedUserId);

      if (nextAssignee === null) {
        data.assignedUserId = null;
      } else {
        if (!(await isActiveProjectMember(task.projectId, nextAssignee))) {
          res.status(422).json({
            message: "Assignee must be an active member of this project",
          });
          return;
        }
        data.assignedUserId = nextAssignee;
      }
    }

    if (Object.keys(data).length === 0) {
      res.status(400).json({ message: "No valid fields provided to update" });
      return;
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data,
      include: taskInclude,
    });

    res.json(updatedTask);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    if (error.code === "P2003") {
      res.status(400).json({ message: "Author or assignee does not exist" });
      return;
    }
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

export const updateTasksStatus = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const taskId = taskIdFrom(req);

  if (taskId === null) {
    res.status(400).json({ message: "Invalid task id" });
    return;
  }

  const body = req.body as TaskStatusInput;

  try {
    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data: { status: body.status },
    });
    res.json(updatedTask);
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Task not found" });
      return;
    }
    res.status(500).json({ message: `Error updating task: ${error.message}` });
  }
};

export const deleteTask = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = currentUser(res);
  const { role } = currentProject(res);
  const id = taskIdFrom(req);

  if (id === null) {
    res.status(400).json({ message: "Invalid task id" });
    return;
  }

  try {
    const task = await prisma.task.findUnique({
      where: { id },
      select: { id: true, authorUserId: true },
    });

    if (!task) {
      res.status(404).json({ message: "Task not found" });
      return;
    }

    const canDelete =
      isWorkspaceAdmin(user) ||
      role === "MANAGER" ||
      task.authorUserId === user.id;

    if (!canDelete) {
      res.status(403).json({
        message: "Only the task author or a project manager can delete this task",
      });
      return;
    }

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
  const user = currentUser(res);
  const targetUserId = Number(req.params.userId);

  if (!Number.isInteger(targetUserId) || targetUserId <= 0) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  if (targetUserId !== user.id && !isWorkspaceAdmin(user)) {
    res.status(403).json({ message: "You can only view your own tasks" });
    return;
  }

  try {
    const accessibleIds = await accessibleProjectIds(user);

    const tasks = await prisma.task.findMany({
      where:
        accessibleIds === null
          ? {
              OR: [
                { authorUserId: targetUserId },
                { assignedUserId: targetUserId },
              ],
            }
          : {
              AND: [
                {
                  OR: [
                    { authorUserId: targetUserId },
                    { assignedUserId: targetUserId },
                  ],
                },
                { projectId: { in: accessibleIds } },
              ],
            },
      include: taskInclude,
    });

    res.json(tasks);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving user's tasks: ${error.message}` });
  }
};
