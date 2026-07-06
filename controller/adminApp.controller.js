import App from "../models/app.model.js";
import { deleteFromSupabase } from "../config/supabase.js";


// Get All Apps
export const getAllApps = async (req, res) => {
  try {
    const apps = await App.find()
      .populate("developer", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: apps.length,
      apps,
    });
  } catch (error) {
    console.error("Error in getAllApps:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get Single App Details
export const getAppDetails = async (req, res) => {
  try {
    const app = await App.findById(req.params.id)
      .populate("developer", "name email");

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    return res.status(200).json({
      success: true,
      app,
    });
  } catch (error) {
    console.error("Error in getAppDetails:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Block App
export const blockApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    if (app.status === "blocked") {
      return res.status(400).json({
        success: false,
        message: "App is already blocked",
      });
    }

    app.status = "blocked";
    await app.save();

    return res.status(200).json({
      success: true,
      message: "App blocked successfully",
      app,
    });
  } catch (error) {
    console.error("Error in blockApp:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unblock App
export const unblockApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    if (app.status === "approved") {
      return res.status(400).json({
        success: false,
        message: "App is already approved",
      });
    }

    app.status = "approved";
    await app.save();

    return res.status(200).json({
      success: true,
      message: "App unblocked successfully",
      app,
    });
  } catch (error) {
    console.error("Error in unblockApp:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Delete App (Admin) - Updated for Supabase
export const deleteApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    // Delete files from Supabase
    try {
      if (app.appIcon && app.appIcon.publicId) {
        await deleteFromSupabase(app.appIcon.publicId);
        console.log(`Deleted icon: ${app.appIcon.publicId}`);
      }

      if (app.appFile && app.appFile.publicId) {
        await deleteFromSupabase(app.appFile.publicId);
        console.log(`Deleted APK: ${app.appFile.publicId}`);
      }

      if (app.appScreenshots && app.appScreenshots.length > 0) {
        for (const screenshot of app.appScreenshots) {
          if (screenshot.publicId) {
            await deleteFromSupabase(screenshot.publicId);
            console.log(`Deleted screenshot: ${screenshot.publicId}`);
          }
        }
      }

    } catch (supabaseError) {
      console.error("Error deleting from Supabase:", supabaseError);
      // Continue with app deletion even if Supabase fails
    }

    await App.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: "App deleted successfully from database and cloud storage",
    });
  } catch (error) {
    console.error("Error in deleteApp:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Apps Statistics
export const getAppStats = async (req, res) => {
  try {
    const totalApps = await App.countDocuments();
    const approvedApps = await App.countDocuments({ status: "approved" });
    const blockedApps = await App.countDocuments({ status: "blocked" });
    
    const categoryStats = await App.aggregate([
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const topApps = await App.find()
      .sort({ downloads: -1 })
      .limit(5)
      .select("appName appIcon.url downloads");

    return res.status(200).json({
      success: true,
      stats: {
        totalApps,
        approvedApps,
        blockedApps,
        categoryStats,
        topApps,
      },
    });
  } catch (error) {
    console.error("Error in getAppStats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Search Apps (Admin)
export const searchApps = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const apps = await App.find({
      $or: [
        { appName: { $regex: query, $options: "i" } },
        { appDescription: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    })
      .populate("developer", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: apps.length,
      apps,
    });
  } catch (error) {
    console.error("Error in searchApps:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};