import type { Request, Response } from "express";
import { prisma } from "../prisma.js";
import {
  isLastActiveOwner,
  memberUserSelect,
} from "../lib/access.js";
import { currentUser } from "../middleware/auth.js";
import type { MemberRoleInput } from "../validation/schemas.js";

const userIdFrom = (req: Request): number | null => {
  const id = Number(req.params.userId);
  return Number.isInteger(id) && id > 0 ? id : null;
};

/**
 * Workspace roster for the settings screen. Owner/Admin only: it is the only
 * endpoint that exposes every member's email and workspace role.
 */
export const getMembers = async (
  _req: Request,
  res: Response,
): Promise<void> => {
  try {
    const members = await prisma.user.findMany({
      where: { deactivatedAt: null },
      select: {
        ...memberUserSelect,
        _count: { select: { projectMembers: true } },
      },
      orderBy: [{ role: "asc" }, { username: "asc" }],
    });

    res.json(members);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: `Error retrieving members: ${message}` });
  }
};

/**
 * Changes a workspace role. Ownership rules:
 * - nobody can change their own role (prevents an accidental lockout);
 * - only an owner can grant or remove the OWNER role;
 * - the last active owner can never be demoted.
 */
export const updateMemberRole = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const actor = currentUser(res);
  const userId = userIdFrom(req);
  const { role } = req.body as MemberRoleInput;

  if (userId === null) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  if (userId === actor.id) {
    res.status(400).json({ message: "You cannot change your own role" });
    return;
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, deactivatedAt: true },
    });

    if (!target || target.deactivatedAt !== null) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    if (target.role === role) {
      res.json({ message: "Role unchanged", id: userId, role });
      return;
    }

    if (
      (target.role === "OWNER" || role === "OWNER") &&
      actor.role !== "OWNER"
    ) {
      res
        .status(403)
        .json({ message: "Only an owner can grant or remove ownership" });
      return;
    }

    if (target.role === "OWNER" && (await isLastActiveOwner(userId))) {
      res.status(409).json({
        message: "The workspace must keep at least one owner",
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: memberUserSelect,
    });

    res.json(updated);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: `Error updating the member: ${message}` });
  }
};

/**
 * Soft-deactivates a member. Their rows stay in place so task history keeps
 * working; every session is deleted immediately and guards reject the account
 * on its next request. Assigned tasks are left untouched so they can be
 * reassigned from the board.
 */
export const deactivateMember = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const actor = currentUser(res);
  const userId = userIdFrom(req);

  if (userId === null) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  if (userId === actor.id) {
    res.status(400).json({ message: "You cannot deactivate your own account" });
    return;
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, deactivatedAt: true },
    });

    if (!target || target.deactivatedAt !== null) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    if (target.role === "OWNER" && actor.role !== "OWNER") {
      res.status(403).json({ message: "Only an owner can remove an owner" });
      return;
    }

    if (target.role === "OWNER" && (await isLastActiveOwner(userId))) {
      res.status(409).json({
        message: "The workspace must keep at least one owner",
      });
      return;
    }

    const openAssignedTasks = await prisma.task.count({
      where: { assignedUserId: userId, NOT: { status: "Completed" } },
    });

    await prisma.$transaction([
      prisma.session.deleteMany({ where: { userId } }),
      prisma.user.update({
        where: { id: userId },
        data: { deactivatedAt: new Date() },
      }),
    ]);

    res.json({
      message: "Member deactivated",
      id: userId,
      openAssignedTasks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: `Error deactivating the member: ${message}` });
  }
};

/** Restores a deactivated account without changing its workspace role. */
export const reactivateMember = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = userIdFrom(req);

  if (userId === null) {
    res.status(400).json({ message: "Invalid user id" });
    return;
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, deactivatedAt: true },
    });

    if (!target) {
      res.status(404).json({ message: "Member not found" });
      return;
    }

    if (target.deactivatedAt === null) {
      res.json({ message: "Member is already active", id: userId });
      return;
    }

    const restored = await prisma.user.update({
      where: { id: userId },
      data: { deactivatedAt: null },
      select: memberUserSelect,
    });

    res.json(restored);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: `Error reactivating the member: ${message}` });
  }
};
