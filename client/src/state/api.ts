import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type {
  BaseQueryFn,
  FetchArgs,
  FetchBaseQueryError,
} from "@reduxjs/toolkit/query";

export interface Project {
  id: number;
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface SearchResults {
  tasks?: Task[];
  projects?: Project[];
  users?: User[];
}

export enum Priority {
  Low = "Low",
  Medium = "Medium",
  High = "High",
  Urgent = "Urgent",
  Backlog = "Backlog",
}

export enum Status {
  ToDo = "To Do",
  WorkInProgress = "Work In Progress",
  UnderReview = "Under Review",
  Completed = "Completed",
}

export interface User {
  id?: number;
  username: string;
  email?: string;
  profilePictureUrl?: string;
  congitoId?: string;
  teamId?: number;
}
export interface Team {
  id: number;
  teamName: string;
  productOwnerUserId?: number | null;
  projectManagerUserId?: number | null;
  productOwnerUsername?: string;
  projectManagerUsername?: string;
  /** Enriched by GET /teams so directory cards can show people and projects. */
  users?: Pick<User, "id" | "username" | "profilePictureUrl" | "teamId">[];
  projects?: Pick<Project, "id" | "name">[];
}

export type WorkspaceRole = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type ProjectRole = "MANAGER" | "CONTRIBUTOR" | "VIEWER";

export interface CurrentUser {
  id: number;
  email: string;
  username: string;
  role: WorkspaceRole;
  onboardedAt: string | null;
  deactivatedAt: string | null;
}

export interface WorkspaceMember extends CurrentUser {
  profilePictureUrl?: string | null;
  teamId?: number | null;
  createdAt?: string;
  _count?: { projectMembers: number };
}

export interface ProjectMember {
  id: number;
  username: string;
  email: string;
  profilePictureUrl?: string | null;
  role: ProjectRole;
}

export interface ProjectMembersResponse {
  projectId: number;
  myRole: ProjectRole;
  members: ProjectMember[];
}

export interface InvitationProjectSummary {
  projectId: number;
  name: string;
  role: ProjectRole;
}

export interface Invitation {
  id: number;
  email: string;
  maskedEmail: string;
  role: WorkspaceRole;
  status: "pending" | "accepted" | "revoked" | "expired";
  expiresAt: string;
  acceptedAt?: string | null;
  revokedAt?: string | null;
  createdAt: string;
  invitedBy: string;
  projects: InvitationProjectSummary[];
  inviteUrl?: string;
  emailDelivered?: boolean;
  mailerConfigured?: boolean;
}

export interface InvitationPreview {
  email: string;
  maskedEmail: string;
  role: WorkspaceRole;
  inviterName: string;
  expiresAt: string;
  workspaceName: string;
  projects: InvitationProjectSummary[];
}

export interface CreateInvitationPayload {
  email: string;
  role: Exclude<WorkspaceRole, "OWNER">;
  projects: Array<{ projectId: number; role: ProjectRole }>;
}

export interface Attachment {
  id: number;
  fileURL?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  fileSize?: number | null;
  taskId: number;
  uploadedById: number;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string;
  startDate?: string;
  dueDate?: string;
  points?: number;
  projectId: number;
  authorUserId?: number;
  assignedUserId?: number;

  author?: User;
  assignee?: User;
  comments?: Comment[];
  attachments?: Attachment[];
}
export type UpdateTaskPayload = {
  taskId: number;
  title?: string;
  description?: string | null;
  status?: Status;
  priority?: Priority;
  tags?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  points?: number | null;
  authorUserId?: number;
  assignedUserId?: number | null;
};

export type CreateTaskPayload = {
  title: string;
  description?: string;
  status?: Status;
  priority?: Priority;
  tags?: string;
  startDate?: string;
  dueDate?: string;
  points?: number;
  projectId: number;
  assignedUserId?: number;
  files?: File[];
};

const apiBaseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "").replace(
  /\/+$/,
  "",
);

/**
 * Uploaded attachments are served by the API; legacy seeded attachments are
 * bare filenames served from the client's public folder.
 */
export const attachmentUrl = (attachment: Attachment): string =>
  attachment.fileURL
    ? `/${attachment.fileURL}`
    : `${apiBaseUrl}/attachments/${attachment.id}/file`;

export type AddTaskAttachmentsPayload = {
  taskId: number;
  files: File[];
};

export type DeleteAttachmentResult = {
  message: string;
  id: number;
  taskId: number;
};

const rawBaseQuery = fetchBaseQuery({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
  credentials: "include",
});

const isAuthPage = (pathname: string) =>
  pathname === "/login" ||
  pathname === "/signup" ||
  pathname.startsWith("/login/") ||
  pathname.startsWith("/signup/");

/**
 * An expired or revoked session must not leave the dashboard showing empty
 * panels. Send the browser through the login page with a return path; the
 * auth pages are excluded so a failed request cannot loop.
 */
const baseQueryWithAuth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);

  if (result.error?.status === 401 && typeof window !== "undefined") {
    const { pathname, search } = window.location;

    if (!isAuthPage(pathname)) {
      window.location.replace(
        `/login?next=${encodeURIComponent(`${pathname}${search}`)}`,
      );
    }
  }

  return result;
};

export const api = createApi({
  baseQuery: baseQueryWithAuth,
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams", "Me", "Members", "Invitations"],
  endpoints: (build) => ({
    getProjects: build.query<Project[], void>({
      query: () => "projects",
      providesTags: ["Projects"],
    }),
    createProject: build.mutation<Project, Partial<Project>>({
      query: (project) => ({
        url: "projects",
        method: "POST",
        body: project,
      }),
      invalidatesTags: ["Projects"],
    }),
    deleteProject: build.mutation<{ message: string; id: number }, number>({
      query: (projectId) => ({
        url: `projects/${projectId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Projects", "Tasks"],
    }),
    getTasks: build.query<Task[], { projectId: number }>({
      query: ({ projectId }) => `tasks?projectId=${projectId}`,
      // The project-level tag must exist even when the list is empty. Without
      // it, creating the first task in a new project cannot invalidate the
      // cached empty list, so the board would stay blank until a reload.
      providesTags: (result, error, { projectId }) => [
        { type: "Tasks" as const, id: `PROJECT_${projectId}` },
        ...(result?.map(({ id }) => ({ type: "Tasks" as const, id })) ?? []),
      ],
    }),
    getAllTasks: build.query<Task[], void>({
      query: () => "tasks",
      providesTags: (result) => [
        { type: "Tasks" as const },
        ...(result?.map(({ id }) => ({ type: "Tasks" as const, id })) ?? []),
      ],
    }),
    createTask: build.mutation<Task, CreateTaskPayload>({
      query: ({ files, ...task }) => {
        // Multipart so files and the task are created in one request.
        // fetchBaseQuery leaves FormData bodies untouched, letting the
        // browser add the multipart boundary.
        const body = new FormData();

        for (const [key, value] of Object.entries(task)) {
          if (value === undefined || value === null || value === "") continue;
          body.append(key, String(value));
        }

        files?.forEach((file) => body.append("files", file));

        return {
          url: "tasks",
          method: "POST",
          body,
        };
      },
      invalidatesTags: (
        result,
        error,
        { projectId, assignedUserId },
      ) => {
        const tags: { type: "Tasks"; id?: string | number }[] = [
          { type: "Tasks", id: `PROJECT_${projectId}` },
          { type: "Tasks" },
        ];

        if (assignedUserId) {
          tags.push({ type: "Tasks", id: `USER_${assignedUserId}` });
        }

        return tags;
      },
    }),
    addTaskAttachments: build.mutation<Task, AddTaskAttachmentsPayload>({
      query: ({ taskId, files }) => {
        const body = new FormData();
        files.forEach((file) => body.append("files", file));

        return {
          url: `tasks/${taskId}/attachments`,
          method: "POST",
          body,
        };
      },
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    deleteAttachment: build.mutation<DeleteAttachmentResult, number>({
      query: (attachmentId) => ({
        url: `attachments/${attachmentId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result) =>
        result
          ? [{ type: "Tasks" as const, id: result.taskId }]
          : [{ type: "Tasks" as const }],
    }),
    updateTask: build.mutation<Task, UpdateTaskPayload>({
      query: ({ taskId, ...body }) => ({
        url: `tasks/${taskId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    deleteTask: build.mutation<{ message: string; id: number }, number>({
      query: (taskId) => ({
        url: `tasks/${taskId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, taskId) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    updateTaskStatus: build.mutation<Task, { taskId: number; status: string }>({
      query: ({ taskId, status }) => ({
        url: `tasks/${taskId}/status`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: (result, error, { taskId }) => [
        { type: "Tasks", id: taskId },
      ],
    }),
    getTasksByUser: build.query<Task[], number>({
      query: (userId) => `tasks/user/${userId}`,
      // Keep a stable user-level tag for empty task lists as well, so the
      // sidebar counts refresh after the user creates their first task.
      providesTags: (result, error, userId) => [
        { type: "Tasks" as const, id: `USER_${userId}` },
        ...(result?.map(({ id }) => ({ type: "Tasks" as const, id })) ?? []),
      ],
    }),
    search: build.query<SearchResults, string>({
      query: (query) => `search?query=${query}`,
      providesTags: (result) =>
        result?.tasks
          ? result.tasks.map(({ id }) => ({ type: "Tasks" as const, id }))
          : [],
    }),
    getUsers: build.query<User[], void>({
      query: () => "users",
      providesTags: ["Users"],
    }),
    getTeams: build.query<Team[], void>({
      query: () => "teams",
      providesTags: ["Teams"],
    }),
    getMe: build.query<{ user: CurrentUser }, void>({
      query: () => "auth/me",
      providesTags: ["Me"],
    }),
    updateMe: build.mutation<
      WorkspaceMember,
      { username?: string; profilePictureUrl?: string | null }
    >({
      query: (body) => ({ url: "users/me", method: "PATCH", body }),
      invalidatesTags: ["Me", "Users", "Members"],
    }),
    completeOnboarding: build.mutation<
      WorkspaceMember,
      { username?: string; profilePictureUrl?: string | null }
    >({
      query: (body) => ({
        url: "users/me/onboarding",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Me", "Users", "Members"],
    }),
    getMembers: build.query<WorkspaceMember[], void>({
      query: () => "workspace/members",
      providesTags: ["Members"],
    }),
    updateMemberRole: build.mutation<
      WorkspaceMember,
      { userId: number; role: WorkspaceRole }
    >({
      query: ({ userId, role }) => ({
        url: `workspace/members/${userId}`,
        method: "PATCH",
        body: { role },
      }),
      invalidatesTags: ["Members", "Me", "Users"],
    }),
    deactivateMember: build.mutation<
      { message: string; id: number; openAssignedTasks: number },
      number
    >({
      query: (userId) => ({
        url: `workspace/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Members", "Users", "Tasks", "Teams"],
    }),
    reactivateMember: build.mutation<WorkspaceMember, number>({
      query: (userId) => ({
        url: `workspace/members/${userId}/reactivate`,
        method: "POST",
      }),
      invalidatesTags: ["Members", "Users"],
    }),
    getInvitations: build.query<Invitation[], void>({
      query: () => "invitations",
      providesTags: ["Invitations"],
    }),
    createInvitation: build.mutation<Invitation, CreateInvitationPayload>({
      query: (body) => ({ url: "invitations", method: "POST", body }),
      invalidatesTags: ["Invitations"],
    }),
    resendInvitation: build.mutation<Invitation, number>({
      query: (invitationId) => ({
        url: `invitations/${invitationId}/resend`,
        method: "POST",
      }),
      invalidatesTags: ["Invitations"],
    }),
    revokeInvitation: build.mutation<{ message: string; id: number }, number>({
      query: (invitationId) => ({
        url: `invitations/${invitationId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Invitations"],
    }),
    getInvitationPreview: build.query<
      { invitation: InvitationPreview },
      string
    >({
      query: (token) => `invitations/${encodeURIComponent(token)}`,
    }),
    acceptInvitation: build.mutation<
      {
        message: string;
        user: WorkspaceMember;
        projectIds: number[];
      },
      string
    >({
      query: (token) => ({
        url: `invitations/${encodeURIComponent(token)}/accept`,
        method: "POST",
      }),
      invalidatesTags: ["Me", "Projects", "Members", "Invitations", "Tasks"],
    }),
    getProjectMembers: build.query<ProjectMembersResponse, number>({
      query: (projectId) => `projects/${projectId}/members`,
      providesTags: (result, error, projectId) => [
        { type: "Projects" as const, id: `MEMBERS_${projectId}` },
      ],
    }),
    getProjectAccess: build.query<
      { projectId: number; role: ProjectRole },
      number
    >({
      query: (projectId) => `projects/${projectId}/access`,
      providesTags: (result, error, projectId) => [
        { type: "Projects" as const, id: `ACCESS_${projectId}` },
      ],
    }),
    upsertProjectMember: build.mutation<
      ProjectMember,
      { projectId: number; userId: number; role: ProjectRole }
    >({
      query: ({ projectId, userId, role }) => ({
        url: `projects/${projectId}/members/${userId}`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Projects", id: `MEMBERS_${projectId}` },
      ],
    }),
    removeProjectMember: build.mutation<
      { message: string; userId: number },
      { projectId: number; userId: number }
    >({
      query: ({ projectId, userId }) => ({
        url: `projects/${projectId}/members/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { projectId }) => [
        { type: "Projects", id: `MEMBERS_${projectId}` },
      ],
    }),
  }),
});

export const {
  useGetProjectsQuery,
  useCreateProjectMutation,
  useDeleteProjectMutation,
  useGetTasksQuery,
  useGetAllTasksQuery,
  useCreateTaskMutation,
  useAddTaskAttachmentsMutation,
  useDeleteAttachmentMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useUpdateTaskStatusMutation,
  useSearchQuery,
  useGetUsersQuery,
  useGetTeamsQuery,
  useGetTasksByUserQuery,
  useGetMeQuery,
  useUpdateMeMutation,
  useCompleteOnboardingMutation,
  useGetMembersQuery,
  useUpdateMemberRoleMutation,
  useDeactivateMemberMutation,
  useReactivateMemberMutation,
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
  useGetInvitationPreviewQuery,
  useAcceptInvitationMutation,
  useGetProjectMembersQuery,
  useGetProjectAccessQuery,
  useUpsertProjectMemberMutation,
  useRemoveProjectMemberMutation,
} = api;
