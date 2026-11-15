import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import {
  directoryUserSelect,
  memberUserSelect,
} from "../lib/access.js";
import { currentUser } from "../middleware/auth.js";
import type { ProfileUpdateInput } from "../validation/schemas.js";

/**
 * Workspace directory, readable by every signed-in teammate. The email is
 * included because person cards render it; role and audit columns stay out.
 */
export const getUsers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { deactivatedAt: null },
      select: directoryUserSelect,
      orderBy: { username: "asc" },
    });
    res.json(users);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: `Error retrieving users: ${message}` });
  }
};

const profileData = (body: ProfileUpdateInput) => {
  const data: { username?: string; profilePictureUrl?: string | null } = {};

  if (body.username !== undefined) {
    data.username = body.username;
  }

  if (body.profilePictureUrl !== undefined) {
    data.profilePictureUrl =
      body.profilePictureUrl === null || body.profilePictureUrl === ""
        ? null
        : body.profilePictureUrl;
  }

  return data;
};

const assertUsernameAvailable = async (
  username: string,
  userId: number,
): Promise<boolean> => {
  const taken = await prisma.user.findFirst({
    where: { username, NOT: { id: userId } },
    select: { id: true },
  });

  return taken === null;
};

/** Updates the signed-in user's display fields. */
export const updateMe = async (req: Request, res: Response): Promise<void> => {
  const actor = currentUser(res);
  const body = req.body as ProfileUpdateInput;
  const data = profileData(body);

  if (Object.keys(data).length === 0) {
    res.status(400).json({ message: "No valid fields provided to update" });
    return;
  }

  try {
    if (data.username !== undefined) {
      if (!(await assertUsernameAvailable(data.username, actor.id))) {
        res.status(409).json({ message: "That username is already taken" });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: actor.id },
      data,
      select: memberUserSelect,
    });

    res.json(updated);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      res.status(409).json({ message: "That username is already taken" });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: `Error updating your profile: ${message}` });
  }
};

/**
 * Completes the first-run screen. Idempotent: submitting twice only refreshes
 * the display fields and leaves the original completion time intact.
 */
export const completeOnboarding = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const actor = currentUser(res);
  const body = req.body as ProfileUpdateInput;
  const data = profileData(body);

  try {
    if (data.username !== undefined) {
      if (!(await assertUsernameAvailable(data.username, actor.id))) {
        res.status(409).json({ message: "That username is already taken" });
        return;
      }
    }

    const updated = await prisma.user.update({
      where: { id: actor.id },
      data: { ...data, onboardedAt: new Date() },
      select: memberUserSelect,
    });

    res.json(updated);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      (error as { code?: string }).code === "P2002"
    ) {
      res.status(409).json({ message: "That username is already taken" });
      return;
    }

    const message = error instanceof Error ? error.message : "Unknown error";
    res
      .status(500)
      .json({ message: `Error completing onboarding: ${message}` });
  }
};
