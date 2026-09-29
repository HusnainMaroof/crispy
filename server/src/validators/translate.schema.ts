import { z } from "zod";

export const translateSchema = z.object({
  text: z.string().min(1).max(1000),
  /** Only Arabic is supported today. */
  target: z.enum(["ar"]).optional(),
});
