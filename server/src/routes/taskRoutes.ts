import { Router } from "express";
import {
  createTask,
  deleteTask,
  getTasks,
  getUserTasks,
  updateTask,
  updateTasksStatus,
} from "../controllers/taskController.js";

const router = Router();

router.get("/", getTasks);
router.post("/", createTask);
router.patch("/:taskId", updateTask);
router.patch("/:taskId/status", updateTasksStatus);
router.delete("/:taskId", deleteTask);
router.get("/user/:userId", getUserTasks);

export default router;
