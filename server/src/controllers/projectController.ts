import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import {
  accessibleProjectIds,
  projectMemberUserSelect,
} from "../lib/access.js";
import { currentProject, currentUser } from "../middleware/auth.js";
import type {
  ProjectCreateInput,
  ProjectMemberUpsertInput,
} from "../validation/schemas.js";

const toDate = (value: string | null | undefined): Date | null => {
  if (value === undefined || value === null || value === "") return null;
  return new Date(value);
};

export const getProjects = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = currentUser(res);

  try {
    const accessibleIds = await accessibleProjectIds(user);

    const projects = await prisma.project.findMany(
      accessibleIds === null
        ? undefined
        : { where: { id: { in: accessibleIds } } },
    );
    res.json(projects);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving projects: ${error.message}` });
  }
};

export const createProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const user = currentUser(res);
  const body = req.body as ProjectCreateInput;

  const name = body.name.trim();
  if (name === "") {
    res.status(400).json({ message: "Project name is required" });
    return;
  }

  const description =
    typeof body.description === "string" && body.description.trim() !== ""
      ? body.description
      : null;

  try {
    const newProject = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          name,
          description,
          startDate: toDate(body.startDate),
          endDate: toDate(body.endDate),
        },
      });

      // The creator manages the project they just created.
      await tx.projectMember.create({
        data: {
          projectId: project.id,
          userId: user.id,
          role: "MANAGER",
        },
      });

      return project;
    });

    res.status(201).json(newProject);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error creating project: ${error.message}` });
  }
};

export const deleteProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { projectId } = req.params;
  const id = Number(projectId);

  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ message: "Invalid project id" });
    return;
  }

  try {
    await prisma.$transaction(async (tx) => {
      const taskIds = (
        await tx.task.findMany({
          where: { projectId: id },
          select: { id: true },
        })
      ).map((task) => task.id);

      // Child rows use ON DELETE RESTRICT, so remove them before their parents.
      await tx.comment.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.attachment.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.taskAssignment.deleteMany({ where: { taskId: { in: taskIds } } });
      await tx.task.deleteMany({ where: { projectId: id } });
      await tx.projectTeam.deleteMany({ where: { projectId: id } });
      await tx.project.delete({ where: { id } });
    });

    res.status(200).json({ message: "Project deleted successfully", id });
  } catch (error: any) {
    if (error.code === "P2025") {
      res.status(404).json({ message: "Project not found" });
      return;
    }
    res
      .status(500)
      .json({ message: `Error deleting project: ${error.message}` });
  }
};

/* ------------------------------------------------------------ project members */

/**
 * The project role of the caller. The client uses it to decide which controls
 * to render; the server still enforces every action.
 */
export const getProjectAccess = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id, role } = currentProject(res);
  res.json({ projectId: id, role });
};

export const getProjectMembers = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id, role } = currentProject(res);

  try {
    const memberships = await prisma.projectMember.findMany({
      where: { projectId: id, user: { deactivatedAt: null } },
      select: {
        role: true,
        user: { select: projectMemberUserSelect },
      },
      orderBy: { user: { username: "asc" } },
    });

    res.json({
      projectId: id,
      myRole: role,
      members: memberships.map((membership) => ({
        ...membership.user,
        role: membership.role,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error retrieving project members: ${message}` });
  }
};

const countManagers = (projectId: number): Promise<number> =>
  prisma.projectMember.count({ where: { projectId, role: "MANAGER" } });

export const upsertProjectMember = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id: projectId } = currentProject(res);
  const userId = Number(req.params.userId);
  const { role } = req.body as ProjectMemberUpsertInput;

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deactivatedAt: true },
    });

    if (!user || user.deactivatedAt !== null) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });

    if (
      existing?.role === "MANAGER" &&
      role !== "MANAGER" &&
      (await countManagers(projectId)) <= 1
    ) {
      res.status(409).json({
        message: "A project must keep at least one manager",
      });
      return;
    }

    const membership = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId, userId } },
      update: { role },
      create: { projectId, userId, role },
      select: {
        role: true,
        user: { select: projectMemberUserSelect },
      },
    });

    res.json({ ...membership.user, role: membership.role });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error updating the project member: ${message}` });
  }
};

export const removeProjectMember = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { id: projectId } = currentProject(res);
  const userId = Number(req.params.userId);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  try {
    const existing = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId } },
      select: { role: true },
    });

    if (!existing) {
      res.status(404).json({ message: "That person is not on this project" });
      return;
    }

    if (existing.role === "MANAGER" && (await countManagers(projectId)) <= 1) {
      res.status(409).json({
        message: "A project must keep at least one manager",
      });
      return;
    }

    await prisma.projectMember.delete({
      where: { projectId_userId: { projectId, userId } },
    });

    res.json({ message: "Member removed from the project", userId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error removing the project member: ${message}` });
  }
};
