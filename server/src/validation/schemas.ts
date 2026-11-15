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

export type ProjectCreateInput = z.infer<typeof projectCreateSchema>;
export type TaskCreateInput = z.infer<typeof taskCreateSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
export type TaskStatusInput = z.infer<typeof taskStatusSchema>;
