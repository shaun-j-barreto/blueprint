import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import bodyParser from "body-parser";
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

// lib imports
import {
  AttachmentError,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENT_COUNT,
} from "./lib/attachments.js";
import { auth } from "./auth.js";

// configurations
dotenv.config();
const app = express();

// Better Auth reads the raw request stream, so it must be mounted before any
// JSON body parser. Everything else stays behind the parsers below.
app.all("/api/auth/*splat", toNodeHandler(auth));

app.use(express.json());
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cors());

// Routes
app.get("/", (req, res) => {
  res.send("This is home houte");
});

app.use("/projects", projectRoutes);
app.use("/tasks", taskRoutes);
app.use("/search", searchRoutes);
app.use("/users", userRoutes);
app.use("/teams", teamRoutes);
app.use("/attachments", attachmentRoutes);

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

// server
const port = Number(process.env.PORT) || 3000;
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
