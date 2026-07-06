import express from "express";
const router = express.Router();
import { authAdmin } from "../middlewares/authAdmin.js";
 import {
  checkAuth,
  adminLogin,
  adminLogout,
} from "../controller/admin.controller.js";
router.post("/login", adminLogin);
router.get("/is-auth", authAdmin, checkAuth);
router.get("/logout", authAdmin, adminLogout);


import {
  pendingDevelopers,
  approveDeveloper,
  rejectDeveloper,
} from "../controller/developerApproval.controller.js";
router.get("/pending-developers",authAdmin, pendingDevelopers);
router.patch("/approve-developer/:id",authAdmin, approveDeveloper);
router.delete("/reject-developer/:id",authAdmin, rejectDeveloper);

export default router;
