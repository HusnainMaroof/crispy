import { Router } from "express";
import { getLocations, updateLocation } from "../../services/admin.service.js";
import { validate } from "../../middleware/validate.js";
import { locationUpdateSchema } from "../../validators/order.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const locations = await getLocations();
    sendSuccess(res, locations);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.patch("/:id", validate(locationUpdateSchema), async (req, res) => {
  try {
    const location = await updateLocation(req.params.id as string, req.body);
    sendSuccess(res, location);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

export default router;
