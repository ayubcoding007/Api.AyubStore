import express from "express";
const app = express();

import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";

// Import Routes
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import adminAppRoutes from "./routes/adminApp.routes.js";
import developerRoutes from "./routes/developer.routes.js";
import developerAppRoutes from "./routes/developerApp.routes.js";
import appRoutes from "./routes/app.routes.js";

// Import Config
import { connectDB } from "./config/connectDB.js";
import connectSupabase from "./config/supabase.js";

//MongoDB | node v24.18.0 Eroor Solve
import dns from "dns";
dns.setServers([
  '1.1.1.1' ,
  '8.8.8.8'
])
// Load environment variables
dotenv.config();

// CORS Configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// Test Route
app.get("/", (req, res) => {
  res.send("AyubStore API is running!");
  console.log("Headers:", req.headers);
});


// Health Check Route
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});


// Routes
app.use("/api", appRoutes); // Public Routes (No Authentication)

// Developer Routes
app.use("/api/developer", developerRoutes);
app.use("/api/developer", developerAppRoutes);

// Admin Routes
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminAppRoutes);

// User Routes
app.use("/api/user", userRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=>{
  connectDB()
  console.log(`Server is running on port ${PORT}`);
});
