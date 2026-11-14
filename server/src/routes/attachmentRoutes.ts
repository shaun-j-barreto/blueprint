import { Router } from "express";
import {
  deleteAttachment,
  getAttachmentFile,
} from "../controllers/attachmentController.js";

const router = Router();

router.get("/:attachmentId/file", getAttachmentFile);
router.delete("/:attachmentId", deleteAttachment);

export default router;
