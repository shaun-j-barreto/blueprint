import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjects,
} from "../controllers/projectController.js";
import {
  requireAuth,
  requireProjectRole,
  requireWorkspaceRole,
} from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import { projectCreateSchema } from "../validation/schemas.js";

const router = Router();

router.get("/", requireAuth, getProjects);

router.post(
  "/",
  requireAuth,
  requireWorkspaceRole("OWNER", "ADMIN", "MEMBER"),
  validateBody(projectCreateSchema),
  createProject,
);

router.delete(
  "/:projectId",
  requireAuth,
  requireWorkspaceRole("OWNER", "ADMIN", "MEMBER"),
  requireProjectRole("MANAGER"),
  deleteProject,
);

export default router;
