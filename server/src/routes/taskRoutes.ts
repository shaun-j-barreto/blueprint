import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTasks,
  getUserTasks,
  updateTask,
  updateTasksStatus,
} from "../controllers/taskController.js";
import { addTaskAttachments } from "../controllers/attachmentController.js";
import {
  MAX_ATTACHMENT_COUNT,
  uploadAttachments,
} from "../lib/attachments.js";
import {
  requireAuth,
  requireProjectRole,
  requireWorkspaceRole,
} from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  taskCreateSchema,
  taskStatusSchema,
  taskUpdateSchema,
} from "../validation/schemas.js";

const router = Router();

const canWrite = [
  requireAuth,
  requireWorkspaceRole("OWNER", "ADMIN", "MEMBER"),
] as const;

router.get("/", requireAuth, getTasks);

// Project access for a new task lives in the body, so it is checked after
// multer parses the form. Authentication still runs before any upload.
router.post(
  "/",
  ...canWrite,
  uploadAttachments.array("files", MAX_ATTACHMENT_COUNT),
  validateBody(taskCreateSchema),
  createTask,
);

router.post(
  "/:taskId/attachments",
  ...canWrite,
  requireProjectRole("MANAGER", "CONTRIBUTOR"),
  uploadAttachments.array("files", MAX_ATTACHMENT_COUNT),
  addTaskAttachments,
);

router.patch(
  "/:taskId",
  ...canWrite,
  requireProjectRole("MANAGER", "CONTRIBUTOR"),
  validateBody(taskUpdateSchema),
  updateTask,
);

router.patch(
  "/:taskId/status",
  ...canWrite,
  requireProjectRole("MANAGER", "CONTRIBUTOR"),
  validateBody(taskStatusSchema),
  updateTasksStatus,
);

// The controller allows the author, a project manager, or a workspace admin.
router.delete(
  "/:taskId",
  ...canWrite,
  requireProjectRole("MANAGER", "CONTRIBUTOR", "VIEWER"),
  deleteTask,
);

// Owners and admins may read anyone's tasks; everyone else only their own.
router.get("/user/:userId", requireAuth, getUserTasks);

export default router;
