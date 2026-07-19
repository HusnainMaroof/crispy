import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import authRoutes from "./admin/auth.js";
import categoryRoutes from "./admin/categories.js";
import adminMenuRoutes from "./admin/menu.js";
import dealRoutes from "./admin/deals.js";
import orderRoutes from "./admin/orders.js";
import locationRoutes from "./admin/locations.js";
import settingsRoutes from "./admin/settings.js";
import jobRoutes from "./admin/jobs.js";
import jobApplicationRoutes from "./admin/job-applications.js";
import dashboardRoutes from "./admin/dashboard.js";
import uploadRoutes from "./upload.js";
import publicMenuRoutes from "./menu.js";
import storeRoutes from "./store.js";
import actionRoutes from "./actions.js";

const router = Router();

// Public routes
router.use("/menu", publicMenuRoutes);
router.use("/store", storeRoutes);
router.use("/", actionRoutes);

// Admin routes (auth-protected)
router.use("/admin/auth", authRoutes);
router.use("/admin/categories", authenticate, categoryRoutes);
router.use("/admin/menu", authenticate, adminMenuRoutes);
router.use("/admin/deals", authenticate, dealRoutes);
router.use("/admin/orders", authenticate, orderRoutes);
router.use("/admin/locations", authenticate, locationRoutes);
router.use("/admin/settings", authenticate, settingsRoutes);
router.use("/admin/jobs", authenticate, jobRoutes);
router.use("/admin/job-applications", authenticate, jobApplicationRoutes);
router.use("/admin/dashboard", authenticate, dashboardRoutes);
router.use("/admin", authenticate, uploadRoutes);

export default router;
