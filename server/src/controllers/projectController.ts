import { Request, Response } from "express";
import { prisma } from "../prisma.js";

export const getProjects = async (
  req: Request,
  res: Response,
): Promise<void> => {
  try {
    const projects = await prisma.project.findMany();
    res.json(projects);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retriving project: ${error.message}` });
  }
};

export const createProject = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { name, description, startDate, endDate } = req.body;
  try {
    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        startDate,
        endDate,
      },
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
