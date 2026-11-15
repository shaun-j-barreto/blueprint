import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../auth.js";
import { prisma } from "../prisma.js";
import {
  authUserSelect,
  isWorkspaceAdmin,
  projectRoleFor,
  type AuthUser,
} from "../lib/access.js";
import type {
  ProjectRole,
  WorkspaceRole,
} from "../generated/prisma/enums.js";

/** Marks "the referenced row does not exist" without overloading `null`. */
const PROJECT_NOT_FOUND = Symbol("project-not-found");

const positiveInt = (value: unknown): number | null => {
  if (typeof value !== "string") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

/**
 * Resolve the project a guarded route operates on:
 * `/projects/:projectId`, `/tasks/:taskId/*`, `/attachments/:attachmentId/*`.
 */
const resolveProjectId = async (
  req: Request,
): Promise<number | typeof PROJECT_NOT_FOUND | null> => {
  if (req.params.projectId !== undefined) {
    return positiveInt(req.params.projectId) ?? PROJECT_NOT_FOUND;
  }

  if (req.params.taskId !== undefined) {
    const taskId = positiveInt(req.params.taskId);
    if (taskId === null) return PROJECT_NOT_FOUND;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { projectId: true },
    });

    return task?.projectId ?? PROJECT_NOT_FOUND;
  }

  if (req.params.attachmentId !== undefined) {
    const attachmentId = positiveInt(req.params.attachmentId);
    if (attachmentId === null) return PROJECT_NOT_FOUND;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: { task: { select: { projectId: true } } },
    });

    return attachment?.task.projectId ?? PROJECT_NOT_FOUND;
  }

  return null;
};

/**
 * Authenticates the request from the Better Auth session cookie and reloads the
 * user from the database. `res.locals.user` is the only identity downstream
 * handlers may trust.
 */
export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (!session) {
      res.status(401).json({ message: "Not signed in" });
      return;
    }

    // Better Auth serialises ids as strings; the primary key is an Int.
    const id = Number(session.user.id);
    if (!Number.isInteger(id) || id <= 0) {
      res.status(401).json({ message: "Not signed in" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: authUserSelect,
    });

    if (!user) {
      // The session outlived its user; treat it as signed out.
      res.status(401).json({ message: "Not signed in" });
      return;
    }

    if (user.deactivatedAt !== null) {
      // Deactivation is immediate: revoke every session for this user.
      await prisma.session.deleteMany({ where: { userId: user.id } });
      res.status(403).json({ message: "This account has been deactivated" });
      return;
    }

    res.locals.user = user;
    next();
  } catch (error) {
    console.error("Failed to verify the auth session", error);
    res.status(500).json({ message: "Could not verify your session" });
  }
};

export const requireWorkspaceRole =
  (...roles: WorkspaceRole[]) =>
  (_req: Request, res: Response, next: NextFunction): void => {
    const user = res.locals.user as AuthUser | undefined;

    if (!user) {
      res.status(401).json({ message: "Not signed in" });
      return;
    }

    if (!roles.includes(user.role)) {
      res.status(403).json({ message: "You don't have permission to do that" });
      return;
    }

    next();
  };

/**
 * Requires the caller to be a member of the route's project with one of the
 * given roles. Owners and admins bypass the project-level check.
 *
 * A non-member gets the same 404 as a missing project so the API does not leak
 * which project ids exist.
 */
export const requireProjectRole =
  (...roles: ProjectRole[]) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const user = res.locals.user as AuthUser | undefined;

    if (!user) {
      res.status(401).json({ message: "Not signed in" });
      return;
    }

    try {
      const resolved = await resolveProjectId(req);

      if (resolved === PROJECT_NOT_FOUND) {
        res.status(404).json({ message: "Project not found" });
        return;
      }

      if (resolved === null) {
        res.status(400).json({ message: "Project context is required" });
        return;
      }

      const admin = isWorkspaceAdmin(user);
      let role: ProjectRole | null = null;

      if (!admin) {
        role = await projectRoleFor(user.id, resolved);

        if (role === null) {
          res.status(404).json({ message: "Project not found" });
          return;
        }

        if (!roles.includes(role)) {
          res
            .status(403)
            .json({ message: "You don't have permission to do that" });
          return;
        }
      }

      res.locals.projectId = resolved;
      // Owners and admins act with manager-level authority inside a project.
      res.locals.projectRole = admin ? "MANAGER" : role;
      next();
    } catch (error) {
      console.error("Failed to verify project access", error);
      res.status(500).json({ message: "Could not verify project access" });
    }
  };

/** Read the authenticated user. Throws only if the route forgot `requireAuth`. */
export const currentUser = (res: Response): AuthUser => {
  const user = res.locals.user as AuthUser | undefined;

  if (!user) {
    throw new Error("requireAuth must run before this handler");
  }

  return user;
};

/** Read the project resolved by `requireProjectRole`. */
export const currentProject = (
  res: Response,
): { id: number; role: ProjectRole } => {
  const id = res.locals.projectId as number | undefined;
  const role = res.locals.projectRole as ProjectRole | undefined;

  if (id === undefined || role === undefined) {
    throw new Error("requireProjectRole must run before this handler");
  }

  return { id, role };
};
