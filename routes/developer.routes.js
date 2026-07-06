import express from "express";
const router = express.Router();

import {
  registerDeveloper,
  loginDeveloper,
  checkDeveloperAuth,
  logoutDeveloper,
} from "../controller/developer.controller.js";

import authDeveloper from "../middlewares/authDeveloper.js";

// Public Routes
router.post("/register", registerDeveloper);
router.post("/login", loginDeveloper);

// Protected Routes
router.get("/is-auth", authDeveloper, checkDeveloperAuth);
router.post("/logout", authDeveloper, logoutDeveloper);

export default router;