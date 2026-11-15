"use client";

import {
  useGetMeQuery,
  useGetProjectAccessQuery,
  type ProjectRole,
  type WorkspaceRole,
} from "@/state/api";

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
  VIEWER: "Viewer",
};

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  MANAGER: "Manager",
  CONTRIBUTOR: "Contributor",
  VIEWER: "Viewer",
};

export const isAdminRole = (role: WorkspaceRole | null | undefined): boolean =>
  role === "OWNER" || role === "ADMIN";

/** Workspace-level capability checks, shared by every guarded control. */
export type Permissions = {
  user?: {
    id: number;
    email: string;
    username: string;
    role: WorkspaceRole;
    onboardedAt: string | null;
  };
  role?: WorkspaceRole;
  isLoading: boolean;
  isError: boolean;
  isOwner: boolean;
  isAdmin: boolean;
  /** Owners and admins manage members and invitations. */
  canManageWorkspace: boolean;
  /** Viewers are read-only; everyone else may create projects. */
  canCreateProject: boolean;
  /** Owners and admins bypass project roles. */
  canManageProject: (projectRole?: ProjectRole | null) => boolean;
  canContributeToProject: (projectRole?: ProjectRole | null) => boolean;
};

/**
 * The single client-side source of role truth. It mirrors the server rules,
 * but the server remains the authority: these checks only decide whether a
 * control is rendered, never whether an action is allowed.
 */
export const usePermissions = (): Permissions => {
  const { data, isLoading, isError } = useGetMeQuery();
  const user = data?.user;
  const role = user?.role;
  const isOwner = role === "OWNER";
  const isAdmin = isAdminRole(role);
  const canWrite = role === "OWNER" || role === "ADMIN" || role === "MEMBER";

  return {
    user,
    role,
    isLoading,
    isError,
    isOwner,
    isAdmin,
    canManageWorkspace: isAdmin,
    canCreateProject: canWrite,
    canManageProject: (projectRole) => isAdmin || projectRole === "MANAGER",
    canContributeToProject: (projectRole) =>
      isAdmin || projectRole === "MANAGER" || projectRole === "CONTRIBUTOR",
  };
};

/**
 * Combines workspace and project capabilities for one board. Owners and admins
 * bypass project roles, matching the server guards.
 */
export const useProjectPermissions = (projectId: number) => {
  const permissions = usePermissions();
  const isValidProject = Number.isInteger(projectId) && projectId > 0;
  const { data, isLoading, isError } = useGetProjectAccessQuery(projectId, {
    skip: !isValidProject,
  });
  const projectRole = data?.role;

  return {
    ...permissions,
    projectRole,
    projectLoading: isLoading,
    projectError: isError,
    canManage: permissions.canManageProject(projectRole),
    canContribute: permissions.canContributeToProject(projectRole),
  };
};
