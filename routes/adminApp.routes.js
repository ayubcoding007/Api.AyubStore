import express from "express";
import {
  getAllApps,
  getAppDetails,
  blockApp,
  unblockApp,
  deleteApp,
  getAppStats,
  searchApps,
   moveToPending,
} from "../controller/adminApp.controller.js";
import {authAdmin} from '../middlewares/authAdmin.js';

const router = express.Router();

// All admin routes are protected
router.use(authAdmin);

// Get all apps
router.get("/apps", getAllApps);

// Get app details
router.get("/app/:id", getAppDetails);

// Block/Unblock app
router.patch("/block-app/:id", blockApp);
router.patch("/unblock-app/:id", unblockApp);

// Move to Pending
router.patch("/move-to-pending/:id", authAdmin, moveToPending);


// Delete app with cloudinary cleanup
router.delete("/delete-app/:id", deleteApp);

// Get statistics
router.get("/apps/stats", getAppStats);

// Search apps
router.get("/apps/search", searchApps);

export default router;