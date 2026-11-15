import { Router } from "express";
import {
  acceptInvitation,
  createInvitation,
  getInvitationPreview,
  listInvitations,
  resendInvitation,
  revokeInvitation,
} from "../controllers/invitationController.js";
import { validateBody } from "../middleware/validate.js";
import { requireAuth, requireWorkspaceRole } from "../middleware/auth.js";
import { invitationCreateSchema } from "../validation/schemas.js";

const router = Router();

const adminOnly = [
  requireAuth,
  requireWorkspaceRole("OWNER", "ADMIN"),
] as const;

router.get("/", ...adminOnly, listInvitations);
router.post(
  "/",
  ...adminOnly,
  validateBody(invitationCreateSchema),
  createInvitation,
);

router.post("/:invitationId/resend", ...adminOnly, resendInvitation);
router.delete("/:invitationId", ...adminOnly, revokeInvitation);

// Public: the invitee has no account or session yet. Only a digest of the
// token is stored, so an unknown token is indistinguishable from a wrong one.
router.get("/:token", getInvitationPreview);

// The invitee creates their account through Better Auth first, then this
// attaches the workspace and project memberships to that session.
router.post("/:token/accept", requireAuth, acceptInvitation);

export default router;
