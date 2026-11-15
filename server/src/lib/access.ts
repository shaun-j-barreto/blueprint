import { prisma } from "../prisma.js";
import type {
  ProjectRole,
  WorkspaceRole,
} from "../generated/prisma/enums.js";

/**
 * The subset of the user row the API is allowed to trust. Guards build this
 * once per request from the database so role changes and deactivations take
 * effect immediately, even when a session cookie is still valid.
 */
export type AuthUser = {
  id: number;
  email: string;
  username: string;
  role: WorkspaceRole;
  onboardedAt: Date | null;
  deactivatedAt: Date | null;
};

export const authUserSelect = {
  id: true,
  email: true,
  username: true,
  role: true,
  onboardedAt: true,
  deactivatedAt: true,
} as const;

/**
 * Columns that are safe to expose for authors, assignees and other workspace
 * members. Never widen this to the full user row: it contains credentials
 * metadata, role, and audit timestamps.
 */
export const publicUserSelect = {
  id: true,
  username: true,
  profilePictureUrl: true,
} as const;

/**
 * The workspace directory is visible to every signed-in teammate, so it can
 * include the email that the UI already renders on person cards. It still
 * excludes role and audit columns.
 */
export const directoryUserSelect = {
  ...publicUserSelect,
  email: true,
  teamId: true,
} as const;

/** Full member record for the Owner/Admin-only members screen. */
export const memberUserSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  profilePictureUrl: true,
  teamId: true,
  onboardedAt: true,
  deactivatedAt: true,
  createdAt: true,
} as const;

export const isWorkspaceAdmin = (user: AuthUser): boolean =>
  user.role === "OWNER" || user.role === "ADMIN";

/** Number of owners who could still administer the workspace. */
export const countActiveOwners = (): Promise<number> =>
  prisma.user.count({ where: { role: "OWNER", deactivatedAt: null } });

/**
 * Guards every path that could leave the workspace without an owner: demoting,
 * deactivating, or deleting the last one.
 */
export const isLastActiveOwner = async (userId: number): Promise<boolean> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, deactivatedAt: true },
  });

  if (!user || user.role !== "OWNER" || user.deactivatedAt !== null) {
    return false;
  }

  return (await countActiveOwners()) <= 1;
};

/**
 * Project ids the user may read. `null` means "every project" (owners and
 * admins); an empty array means the user has no project access yet.
 */
export const accessibleProjectIds = async (
  user: AuthUser,
): Promise<number[] | null> => {
  if (isWorkspaceAdmin(user)) return null;

  const memberships = await prisma.projectMember.findMany({
    where: { userId: user.id },
    select: { projectId: true },
  });

  return memberships.map((membership) => membership.projectId);
};

export const projectRoleFor = async (
  userId: number,
  projectId: number,
): Promise<ProjectRole | null> => {
  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });

  return membership?.role ?? null;
};

/** Project members with their project role, for pickers and sharing UI. */
export const projectMemberUserSelect = {
  id: true,
  username: true,
  email: true,
  profilePictureUrl: true,
} as const;

/** Assignees must be active members of the task's project. */
export const isActiveProjectMember = async (
  projectId: number,
  userId: number,
): Promise<boolean> => {
  const membership = await prisma.projectMember.findFirst({
    where: {
      projectId,
      userId,
      user: { deactivatedAt: null },
    },
    select: { id: true },
  });

  return membership !== null;
};
