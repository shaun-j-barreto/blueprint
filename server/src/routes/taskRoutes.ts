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

const router = Router();

router.get("/", getTasks);
router.post(
  "/",
  uploadAttachments.array("files", MAX_ATTACHMENT_COUNT),
  createTask,
);
router.post(
  "/:taskId/attachments",
  uploadAttachments.array("files", MAX_ATTACHMENT_COUNT),
  addTaskAttachments,
);
router.patch("/:taskId", updateTask);
router.patch("/:taskId/status", updateTasksStatus);
router.delete("/:taskId", deleteTask);
router.get("/user/:userId", getUserTasks);

export default router;
