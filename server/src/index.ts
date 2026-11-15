import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import multer from "multer";
import { toNodeHandler } from "better-auth/node";
import type { NextFunction, Request, Response } from "express";

// route imports
import projectRoutes from "./routes/projectRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import searchRoutes from "./routes/searchRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import attachmentRoutes from "./routes/attachmentRoutes.js";
import authRoutes from "./routes/authRoutes.js";

// lib imports
import {
  AttachmentError,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_COUNT,
} from "./lib/attachments.js";
import { auth } from "./auth.js";
import { prisma } from "./prisma.js";

const app = express();

// Every request reaches Express through the Next.js rewrite, so the first
// proxy hop is trusted when resolving the client IP for rate limiting.
app.set("trust proxy", 1);

app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  }),
);

// Better Auth reads the raw request stream, so it must be mounted before any
// body parser. Everything else stays behind the parsers below.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Better Auth rate-limits its own routes; this covers application endpoints.
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 600,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many requests, please try again shortly" },
  }),
);

// Routes
app.get("/health", async (_req: Request, res: Response): Promise<void> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", db: "up" });
  } catch {
    res.status(503).json({ status: "error", db: "down" });
  }
});

app.get("/", (req, res) => {
  res.send("This is home houte");
});

app.use("/auth", authRoutes);
app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/search", searchRoutes);
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);
app.use("/attachments", attachmentRoutes);

app.use((_req: Request, res: Response) => {
  res.status(404).json({ message: "Not found" });
});

// Multer and attachment validation failures must stay JSON so the client can
// show the message in its form error banner.
app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (error instanceof multer.MulterError) {
      if (error.code === "LIMIT_FILE_SIZE") {
        res.status(413).json({
          message: `Each file must be ${
            MAX_ATTACHMENT_BYTES / (1024 * 1024)
          } MB or smaller`,
        });
        return;
      }
      if (
        error.code === "LIMIT_FILE_COUNT" ||
        error.code === "LIMIT_UNEXPECTED_FILE"
      ) {
        res.status(400).json({
          message: `You can attach up to ${MAX_ATTACHMENT_COUNT} files`,
        });
        return;
      }
      res.status(400).json({ message: `Upload error: ${error.message}` });
      return;
    }

    if (error instanceof AttachmentError) {
      res.status(error.status).json({ message: error.message });
      return;
    }

    next(error);
  },
);

app.use(
  (
    error: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
  ): void => {
    if (res.headersSent) {
      next(error);
      return;
    }

    // body-parser marks client errors (malformed JSON, oversized body) as an
    // exposed 4xx. Answer those explicitly instead of a blanket 500.
    const status =
      typeof (error as { status?: unknown }).status === "number"
        ? (error as { status: number }).status
        : undefined;

    if (status !== undefined && status >= 400 && status < 500) {
      res.status(status).json({
        message:
          status === 413
            ? "Request body is too large"
            : status === 400
              ? "Invalid request body"
              : "Bad request",
      });
      return;
    }

    console.error("Unhandled request error", error);
    res.status(500).json({ message: "Internal server error" });
  },
);

// server
const port = Number(process.env.PORT) || 8000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
