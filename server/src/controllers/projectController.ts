import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { accessibleProjectIds } from "../lib/access.js";
import { currentUser } from "../middleware/auth.js";
import type { ProjectCreateInput } from "../validation/schemas.js";

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
