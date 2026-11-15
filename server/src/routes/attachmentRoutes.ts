import { Router } from "express";
import {
  deleteAttachment,
  getAttachmentFile,
} from "../controllers/attachmentController.js";
import {
  requireAuth,
  requireProjectRole,
  requireWorkspaceRole,
} from "../middleware/auth.js";

const router = Router();

// Resolving the attachment to its task and project proves membership before
// the file is read from the database.
router.get(
  "/:attachmentId/file",
  requireAuth,
  requireProjectRole("MANAGER", "CONTRIBUTOR", "VIEWER"),
  getAttachmentFile,
);

router.delete(
  "/:attachmentId",
  requireAuth,
  requireWorkspaceRole("OWNER", "ADMIN", "MEMBER"),
  requireProjectRole("MANAGER", "CONTRIBUTOR", "VIEWER"),
  deleteAttachment,
);

export default router;
