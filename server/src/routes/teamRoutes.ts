import { Router } from "express";
import { getTeams } from "../controllers/teamController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, getTeams);

export default router;
