import type { NextFunction, Request, Response } from "express";
import type { ZodType } from "zod";

/**
 * Validates and normalises a JSON or multipart body, then hands the parsed
 * value to the controller. Unknown keys are stripped by Zod's object schema,
 * which is how client-supplied identity fields stop reaching Prisma.
 */
export const validateBody =
  (schema: ZodType) =>
  (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body ?? {});

    if (!result.success) {
      res.status(400).json({
        message: "Invalid request",
        errors: result.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    req.body = result.data;
    next();
  };
