import { Request, Response } from "express";
import { prisma } from "../prisma.js";

export const getTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const [teams, users] = await Promise.all([
      prisma.team.findMany({
        include: {
          projectTeams: {
            include: {
              project: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.user.findMany({
        select: {
          userId: true,
          username: true,
          profilePictureUrl: true,
          teamId: true,
        },
      }),
    ]);

    const usersById = new Map(users.map((user) => [user.userId, user]));

    const teamsWithDetails = teams.map((team) => {
      const projects = Array.from(
        new Map(
          team.projectTeams.map((projectTeam) => [
            projectTeam.project.id,
            projectTeam.project,
          ]),
        ).values(),
      );

      return {
        id: team.id,
        teamName: team.teamName,
        productOwnerUserId: team.productOwnerUserId,
        projectManagerUserId: team.projectManagerUserId,
        productOwnerUsername:
          team.productOwnerUserId !== null
            ? usersById.get(team.productOwnerUserId)?.username
            : undefined,
        projectManagerUsername:
          team.projectManagerUserId !== null
            ? usersById.get(team.projectManagerUserId)?.username
            : undefined,
        users: users.filter((user) => user.teamId === team.id),
        projects,
      };
    });

    res.json(teamsWithDetails);
  } catch (error: any) {
    res
      .status(500)
      .json({ message: `Error retriving teams: ${error.message}` });
  }
};
