import { z } from "zod";

/**
 * Request schemas. Multipart fields arrive as strings, so ids, points and
 * dates accept both their JSON and form-data spellings.
 */

const nullableText = z.union([z.string(), z.null()]);

const optionalId = z
  .union([z.literal(""), z.null(), z.coerce.number().int().positive()])
  .optional();

const optionalPoints = z
  .union([z.literal(""), z.null(), z.coerce.number().int().min(0)])
  .optional();

const dateInput = z
  .union([z.string(), z.null()])
  .optional()
  .refine(
    (value) =>
      value === undefined ||
      value === null ||
      value === "" ||
      !Number.isNaN(new Date(value).getTime()),
    "Invalid date",
  );

export const projectCreateSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  description: nullableText.optional(),
  startDate: dateInput,
  endDate: dateInput,
});

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  projectId: z.coerce.number().int().positive("Invalid projectId"),
  assignedUserId: optionalId,
  description: nullableText.optional(),
  status: nullableText.optional(),
  priority: nullableText.optional(),
  tags: nullableText.optional(),
  startDate: dateInput,
  dueDate: dateInput,
  points: optionalPoints,
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").optional(),
  description: nullableText.optional(),
  status: nullableText.optional(),
  priority: nullableText.optional(),
  tags: nullableText.optional(),
  startDate: dateInput,
  dueDate: dateInput,
  points: optionalPoints,
  // Accepted so the API can answer 403 (not 400) when a non-admin tries to
  // change the author. The controller ignores it for everyone else.
  authorUserId: optionalId,
  assignedUserId: optionalId,
});

export const taskStatusSchema = z.object({
  status: z.string().min(1, "Status is required"),
});

export const searchQuerySchema = z.object({
  query: z.string().min(1, "Search query is required").max(200),
});

export const projectIdQuerySchema = z.object({
  projectId: z
    .union([z.literal(""), z.coerce.number().int().positive("Invalid projectId")])
    .optional(),
});

/* ---------------------------------------------------------------- workspace */

export const workspaceRoleSchema = z.enum([
  "OWNER",
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

/** Invitations may not mint owners: ownership is transferred, never emailed. */
export const invitationWorkspaceRoleSchema = z.enum([
  "ADMIN",
  "MEMBER",
  "VIEWER",
]);

export const projectRoleSchema = z.enum(["MANAGER", "CONTRIBUTOR", "VIEWER"]);

export const memberRoleSchema = z.object({
  role: workspaceRoleSchema,
});

export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username must be between 3 and 40 characters")
  .max(40, "Username must be between 3 and 40 characters")
  .regex(
    /^[A-Za-z0-9][A-Za-z0-9 ._-]*$/,
    "Username can only use letters, numbers, spaces, dots, dashes, and underscores",
  );

const profilePictureSchema = z
  .union([z.string().trim().max(2048), z.literal(""), z.null()])
  .optional();

export const profileUpdateSchema = z.object({
  username: usernameSchema.optional(),
  profilePictureUrl: profilePictureSchema,
});

export const onboardingSchema = profileUpdateSchema;

const invitationEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine(
    (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Enter a valid email address",
  );

export const invitationCreateSchema = z.object({
  email: invitationEmailSchema,
  role: invitationWorkspaceRoleSchema.default("MEMBER"),
  projects: z
    .array(
      z.object({
        projectId: z.coerce.number().int().positive("Invalid projectId"),
        role: projectRoleSchema.default("CONTRIBUTOR"),
      }),
    )
    .max(50)
    .default([]),
});

export const projectMemberUpsertSchema = z.object({
  role: projectRoleSchema,
});

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type InvitationCreateInput = z.infer<typeof invitationCreateSchema>;
export type MemberRoleInput = z.infer<typeof memberRoleSchema>;
export type ProjectMemberUpsertInput = z.infer<
  typeof projectMemberUpsertSchema
>;
