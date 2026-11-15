import { Router } from "express";
import {
  completeOnboarding,
  getUsers,
  updateMe,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.js";
import { validateBody } from "../middleware/validate.js";
import {
  onboardingSchema,
  profileUpdateSchema,
} from "../validation/schemas.js";

const router = Router();

router.get("/", requireAuth, getUsers);

router.patch("/me", requireAuth, validateBody(profileUpdateSchema), updateMe);

router.post(
  "/me/onboarding",
  requireAuth,
  validateBody(onboardingSchema),
  completeOnboarding,
);

export default router;
