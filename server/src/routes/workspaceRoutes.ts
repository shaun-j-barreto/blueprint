import { Router } from "express";
import {
  deactivateMember,
  getMembers,
  reactivateMember,
  updateMemberRole,
} from "../controllers/workspaceController.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireWorkspaceRole } from "../middleware/auth.js";
import { memberRoleSchema } from "../validation/schemas.js";

const router = Router();

const adminOnly = [
  requireAuth,
  requireWorkspaceRole("OWNER", "ADMIN"),
] as const;

router.get("/members", ...adminOnly, getMembers);

router.patch(
  "/members/:userId",
  ...adminOnly,
  validateBody(memberRoleSchema),
  updateMemberRole,
);

router.delete("/members/:userId", ...adminOnly, deactivateMember);

router.post("/members/:userId/reactivate", ...adminOnly, reactivateMember);

export default router;
