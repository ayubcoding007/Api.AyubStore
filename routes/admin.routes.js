import express from "express";
const router = express.Router();
import { authAdmin } from "../middlewares/authAdmin.js";
import {
  checkAuth,
  adminLogin,
  adminLogout,
} from "../controller/admin.controller.js";

import {
  pendingDevelopers,
  approveDeveloper,
  rejectDeveloper,
  getAllDevelopers,      
  blockDeveloper,        
  unblockDeveloper,      
} from "../controller/developerApproval.controller.js";

// Admin Auth Routes
router.post("/login", adminLogin);
router.get("/is-auth", authAdmin, checkAuth);
router.post("/logout", authAdmin, adminLogout);


// Developer Management Routes
// Pending Developers
router.get("/pending-developers", authAdmin, pendingDevelopers);

// Approve/Reject Developer
router.patch("/approve-developer/:id", authAdmin, approveDeveloper);
router.delete("/reject-developer/:id", authAdmin, rejectDeveloper);

// Get All Developers (Admin)
router.get("/developers", authAdmin, getAllDevelopers);

// Block/Unblock Developer
router.patch("/block-developer/:id", authAdmin, blockDeveloper);
router.patch("/unblock-developer/:id", authAdmin, unblockDeveloper);

export default router;