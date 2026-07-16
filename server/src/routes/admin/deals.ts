import { Router } from "express";
import { getDeals, createDeal, updateDeal, deleteDeal } from "../../services/menu.service.js";
import { validate } from "../../middleware/validate.js";
import { dealSchema, dealUpdateSchema } from "../../validators/menu.schema.js";
import { sendSuccess, sendError } from "../../utils/response.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    const deals = await getDeals(false);
    sendSuccess(res, deals);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error");
  }
});

router.post("/", validate(dealSchema), async (req, res) => {
  try {
    const deal = await createDeal(req.body);
    sendSuccess(res, deal, 201);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.put("/:id", validate(dealUpdateSchema), async (req, res) => {
  try {
    const deal = await updateDeal(req.params.id as string, req.body);
    sendSuccess(res, deal);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.patch("/:id/toggle", async (req, res) => {
  try {
    const deal = await getDeals(false);
    const target = deal.find((d) => d.id === req.params.id as string);
    if (!target) {
      sendError(res, "Deal not found", 404);
      return;
    }
    const updated = await updateDeal(req.params.id as string, { active: !target.active });
    sendSuccess(res, updated);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await deleteDeal(req.params.id as string);
    sendSuccess(res, null, 204);
  } catch (e) {
    sendError(res, e instanceof Error ? e.message : "Unknown error", 400);
  }
});

export default router;
