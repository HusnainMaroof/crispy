import { Router } from "express";
import { getLocations } from "../services/admin.service.js";
import { getSettings } from "../services/admin.service.js";
import { sendSuccess, sendError } from "../utils/response.js";

const router = Router();

router.get("/locations", async (_req, res) => {
  try {
    const locations = await getLocations();
    sendSuccess(res, locations);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.get("/settings", async (_req, res) => {
  try {
    const settings = await getSettings();
    sendSuccess(res, settings);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

export default router;
