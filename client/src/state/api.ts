import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

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
  authorUserId: number;
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

export const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "api",
  tagTypes: ["Projects", "Tasks", "Users", "Teams"],
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
        { projectId, authorUserId, assignedUserId },
      ) => {
        const tags: { type: "Tasks"; id?: string | number }[] = [
          { type: "Tasks", id: `PROJECT_${projectId}` },
          { type: "Tasks" },
        ];

        if (authorUserId) {
          tags.push({ type: "Tasks", id: `USER_${authorUserId}` });
        }

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
} = api;
