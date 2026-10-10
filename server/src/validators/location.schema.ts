import { z } from "zod";

/** Finite numbers only. NaN, Infinity, and numeric strings are rejected. */
export const coordinateSchema = z.object({
  lat: z.number().finite().min(-90).max(90),
  lng: z.number().finite().min(-180).max(180),
}).strict();

/**
 * Exactly one of `query` or `origin`. Sending both, or neither, is rejected
 * so a request can never be ambiguous about what to resolve.
 */
export const resolveLocationSchema = z.object({
  query: z.string().trim().min(1, "Enter a postcode, address, or place").max(200).optional(),
  origin: coordinateSchema.optional(),
}).strict().superRefine((value, ctx) => {
  const hasQuery = value.query !== undefined;
  const hasOrigin = value.origin !== undefined;
  if (hasQuery === hasOrigin) {
    ctx.addIssue({
      code: "custom",
      message: "Send either query or origin, not both or neither",
      path: ["query"],
    });
  }
});

export const locationRouteSchema = z.object({
  origin: coordinateSchema,
  destinationLocationId: z.string().trim().min(1).max(80),
  travelMode: z.enum(["driving"]).default("driving"),
}).strict();
