import type { Request, Response } from "express";
import { createOrder, getOrdersByCustomerId, getOrdersByEmail, getOrderById, customerCanView } from "../../services/order.service.js";
import { BadRequestException, InternalServerException, NotFoundException } from "../../utils/app-error.js";
import { resolvePage, sendPaged } from "../../utils/pagination.js";
import { createContactMessage, createJobApplication } from "../../services/admin.service.js";
import { sendSuccess } from "../../utils/response.js";
import { uploadDocument } from "../../services/upload.service.js";
import { compressCv } from "../../services/cv-compress.js";
import { logger } from "../../middleware/logger.js";

/** The multer filter admits exactly these three types, so the map is total. */
const CV_EXTENSIONS: Record<string, string> = {
  "application/pdf": "pdf",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
};

export const ActionsController = {
  async createOrder(req: Request, res: Response) {
    const order = await createOrder({ ...req.body, customer_id: req.customerId });
    sendSuccess(res, order, 201);
  },

  async contact(req: Request, res: Response) {
    const message = await createContactMessage(req.body);
    sendSuccess(res, message, 201);
  },

  async applyForJob(req: Request, res: Response) {
    // Same rule as the public job page: draft and closed posts are not found.
    const application = await createJobApplication(
      { ...req.body, job_post_id: req.params.id },
      { activeOnly: true },
    );
    sendSuccess(res, application, 201);
  },

  /**
   * Stores the CV a job applicant picked on the careers page and hands back its
   * URL, which the apply call then sends as `cv_url`. Kept separate from the
   * application write so the multipart upload never shares a schema with the
   * JSON body.
   */
  async uploadCv(req: Request, res: Response) {
    const file = req.file;
    if (!file) throw new BadRequestException("No file provided");

    try {
      // Shrunk before it leaves the server, see `compressCv`. The extension
      // goes into the stored name so the admin's "View CV" link opens a file
      // the browser can preview.
      const buffer = await compressCv(file.mimetype, file.buffer);
      const { url } = await uploadDocument(buffer, CV_EXTENSIONS[file.mimetype] ?? "pdf");
      sendSuccess(res, { url }, 201);
    } catch (err: unknown) {
      logger.error({ err }, "Cloudinary CV upload failed");
      // The provider's message can name internal buckets and credential
      // metadata, so it is logged rather than returned.
      throw new InternalServerException("CV upload failed. Please try again.");
    }
  },

  async myOrders(req: Request, res: Response) {
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });
    const { orders, total } = await getOrdersByCustomerId(req.customerId, page);
    sendPaged(res, orders, total, page);
  },

  async lookupOrder(req: Request, res: Response) {
    const { email } = req.body;
    const page = resolvePage(req.query as { page?: unknown; limit?: unknown });
    // The ownership check is a second where clause now, not a JavaScript
    // filter over whatever the email happened to match.
    const { orders, total } = await getOrdersByEmail(email, req.customerId, page);
    sendPaged(res, orders, total, page);
  },

  async getOrder(req: Request, res: Response) {
    const result = await getOrderById(req.params.id as string);
    if (!customerCanView(result.order.customer_id, req.customerId)) {
      throw new NotFoundException("Order not found");
    }
    sendSuccess(res, result);
  },
};
