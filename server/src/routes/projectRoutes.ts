import { Router } from "express";
import {
  createProject,
  deleteProject,
  getProjectAccess,
  getProjectMembers,
  getProjects,
  removeProjectMember,
  upsertProjectMember,
} from "../controllers/projectController.js";
import {
  requireAuth,
  requireProjectRole,
  requireWorkspaceRole,
} from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  projectCreateSchema,
  projectMemberUpsertSchema,
} from "../validation/schemas.js";

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

const canReadProject = [
  requireAuth,
  requireProjectRole("MANAGER", "CONTRIBUTOR", "VIEWER"),
] as const;

const canManageProject = [
  requireAuth,
  requireWorkspaceRole("OWNER", "ADMIN", "MEMBER"),
  requireProjectRole("MANAGER"),
] as const;

router.get("/:projectId/access", ...canReadProject, getProjectAccess);
router.get("/:projectId/members", ...canReadProject, getProjectMembers);

router.put(
  "/:projectId/members/:userId",
  ...canManageProject,
  validateBody(projectMemberUpsertSchema),
  upsertProjectMember,
);

router.delete(
  "/:projectId/members/:userId",
  ...canManageProject,
  removeProjectMember,
);

export default router;
