import { Request, Response } from "express";
import { prisma } from "../prisma.js";
import { publicUserSelect } from "../lib/access.js";

/**
 * Workspace directory. Only the columns the UI needs are exposed; the full
 * user row also contains role, legacy identifiers and audit timestamps.
 */
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { deactivatedAt: null },
      select: { ...publicUserSelect, teamId: true },
      orderBy: { username: "asc" },
    });
    res.json(users);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retrieving users: ${error.message}` });
  }
};
