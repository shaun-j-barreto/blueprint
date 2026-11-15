import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import {
  accessibleProjectIds,
  publicUserSelect,
} from "../lib/access.js";
import { currentUser } from "../middleware/auth.js";
import { searchQuerySchema } from "../validation/schemas.js";

/**
 * Workspace search. Task and project hits are limited to projects the caller
 * can read; people search stays workspace-wide for active users only.
 */
export const search = async (req: Request, res: Response): Promise<void> => {
  const user = currentUser(res);
  const parsed = searchQuerySchema.safeParse(req.query);

  if (!parsed.success) {
    res.status(400).json({ message: "A search query is required" });
    return;
  }

  const query = parsed.data.query;

  try {
    const accessibleIds = await accessibleProjectIds(user);

    const taskScope =
      accessibleIds === null ? {} : { projectId: { in: accessibleIds } };
    const projectScope =
      accessibleIds === null ? {} : { id: { in: accessibleIds } };

    const [tasks, projects, users] = await Promise.all([
      prisma.task.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: query, mode: "insensitive" } },
                {
                  description: { contains: query, mode: "insensitive" },
                },
              ],
            },
            taskScope,
          ],
        },
        include: { attachments: true },
      }),
      prisma.project.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                {
                  description: { contains: query, mode: "insensitive" },
                },
              ],
            },
            projectScope,
          ],
        },
      }),
      prisma.user.findMany({
        where: {
          deactivatedAt: null,
          OR: [{ username: { contains: query, mode: "insensitive" } }],
        },
        select: { ...publicUserSelect, teamId: true },
        orderBy: { username: "asc" },
        take: 50,
      }),
    ]);

    res.json({ tasks, projects, users });
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error performing search: ${error.message}` });
  }
};
