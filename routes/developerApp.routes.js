import express from "express";
import authDeveloper from "../middlewares/authDeveloper.js"; 
import upload from "../config/multer.js";
import {
  uploadApp,
  updateApp,
  deleteApp,
  myApps,
  getSingleApp,
} from "../controller/developerApp.controller.js";

const router = express.Router();

// Upload App
router.post(
  "/app",
  authDeveloper,
  upload.fields([
    { name: "appIcon", maxCount: 1 },
    { name: "appScreenshots", maxCount: 5 }, // Max 5 screenshots
    { name: "appFile", maxCount: 1 }
  ]),
  uploadApp
);

// Update App
router.put(
  "/app/:id",
  authDeveloper,
  upload.fields([
    { name: "appIcon", maxCount: 1 },
    { name: "appScreenshots", maxCount: 5 },
    { name: "appFile", maxCount: 1 }
  ]),
  updateApp
);

// Delete App
router.delete("/app/:id", authDeveloper, deleteApp);

// My Apps
router.get("/my-apps", authDeveloper, myApps);

// Single App
router.get("/app/:id", authDeveloper, getSingleApp);

export default router;