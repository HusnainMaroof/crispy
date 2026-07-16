import type { Request, Response, NextFunction } from "express";
import type { ZodSchema } from "zod";

export function validate(schema: ZodSchema, source: "body" | "query" | "params" = "body") {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      res.status(400).json({ success: false, error: "Validation failed", errors });
      return;
    }

    req[source] = result.data;
    next();
  };
}
