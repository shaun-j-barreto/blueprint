import { Router } from "express";
import { currentUser, requireAuth } from "../middleware/auth.js";

const router = Router();

/**
 * Identity for the signed-in user. The client uses this instead of decoding
 * the session cookie or trusting a hardcoded id.
 */
router.get("/me", requireAuth, (_req, res) => {
  res.json({ user: currentUser(res) });
});

export default router;
