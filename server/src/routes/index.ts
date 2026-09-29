import { Router } from "express";
import { authenticate, requireTab } from "../middleware/auth.js";
import authRoutes from "./admin/auth.js";
import categoryRoutes from "./admin/categories.js";
import adminMenuRoutes from "./admin/menu.js";
import dealRoutes from "./admin/deals.js";
import orderRoutes from "./admin/orders.js";
import customerRoutes from "./admin/customers.js";
import staffRoutes from "./admin/staff.js";
import cmsRoutes from "./admin/cms.js";
import locationRoutes from "./admin/locations.js";
import settingsRoutes from "./admin/settings.js";
import jobRoutes from "./admin/jobs.js";
import jobApplicationRoutes from "./admin/job-applications.js";
import dashboardRoutes from "./admin/dashboard.js";
import uploadRoutes from "./upload.js";
import translateRoutes from "./translate.js";
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
router.use("/admin/categories", authenticate, requireTab("categories", "menu", "branch-menu"), categoryRoutes);
router.use("/admin/menu", authenticate, requireTab("menu", "branch-menu", "categories"), adminMenuRoutes);
router.use("/admin/deals", authenticate, requireTab("deals"), dealRoutes);
router.use("/admin/orders", authenticate, requireTab("orders"), orderRoutes);
router.use("/admin/customers", authenticate, requireTab("customers"), customerRoutes);
router.use("/admin/staff", authenticate, requireTab("staff"), staffRoutes);
router.use("/admin/cms", authenticate, requireTab("content"), cmsRoutes);
router.use("/admin/locations", authenticate, requireTab("locations", "branches", "staff", "branch-menu", "menu", "orders", "customers"), locationRoutes);
router.use("/admin/settings", authenticate, requireTab("settings"), settingsRoutes);
router.use("/admin/jobs", authenticate, requireTab("posts"), jobRoutes);
router.use("/admin/job-applications", authenticate, requireTab("posts"), jobApplicationRoutes);
router.use("/admin/dashboard", authenticate, requireTab("dashboard"), dashboardRoutes);
router.use("/admin", authenticate, requireTab("menu", "categories", "deals", "locations", "branches", "content", "posts"), uploadRoutes);
router.use("/admin", authenticate, requireTab("menu", "categories", "deals", "content"), translateRoutes);

export default router;
