import express from "express";
import {
  getAllApps,
  getAppsByCategory,
  getSingleApp,
  downloadApp,
  getFeaturedApps,
  searchApps,
  getPublicStats,
} from "../controller/app.controller.js";
// import authUser from "../middlewares/authUser.js";

const router = express.Router();
// All admin routes are protected
// router.use(authUser);

// Public routes (no authentication required)
router.get("/apps", getAllApps);
router.get("/apps/category/:category", getAppsByCategory);
router.get("/apps/featured", getFeaturedApps);
router.get("/apps/search", searchApps);
router.get("/apps/stats", getPublicStats);
router.get("/app/:id", getSingleApp);
router.get("/download/:id", downloadApp);

export default router;