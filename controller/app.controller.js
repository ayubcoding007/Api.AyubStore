import App from "../models/app.model.js";

// Get All Apps
export const getAllApps = async (req, res) => {
  try {
    const { category } = req.query;

    let filter = {
      status: "approved",
    };

    if (category && category !== "All") {
      filter.category = category;
    }

    const apps = await App.find(filter)
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


// Get Apps by Category
export const getAppsByCategory = async (req, res) => {
  try {
    const { category } = req.params;

    // Validate category
    if (!category || !["Apps", "Games"].includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Must be 'Apps' or 'Games'",
      });
    }

    const apps = await App.find({
      category,
      status: "approved",
    })
      .populate("developer", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: apps.length,
      category,
      apps,
    });
  } catch (error) {
    console.error("Error in getAppsByCategory:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Single App
export const getSingleApp = async (req, res) => {
  try {
    const app = await App.findOne({
      _id: req.params.id,
      status: "approved",
    }).populate("developer", "name email");

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found or not approved",
      });
    }

    return res.status(200).json({
      success: true,
      app,
    });
  } catch (error) {
    console.error("Error in getSingleApp:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Download App
export const downloadApp = async (req, res) => {
  try {
    const app = await App.findOne({
      _id: req.params.id,
      status: "approved",
    });

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found or not available",
      });
    }

    // Increment downloads count
    app.downloads += 1;
    await app.save();

    // Return the download URL 
    return res.status(200).json({
      success: true,
      message: "Download started",
      downloadUrl: app.appFile.url, 
      appName: app.appName,
      appIcon: app.appIcon.url, 
    });
  } catch (error) {
    console.error("Error in downloadApp:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get Featured Apps
export const getFeaturedApps = async (req, res) => {
  try {
    // Get top 10 most downloaded apps
    const featuredApps = await App.find({
      status: "approved",
    })
      .sort({ downloads: -1 })
      .limit(10)
      .populate("developer", "name email")
      .select("appName appDescription category appIcon.url downloads");

    return res.status(200).json({
      success: true,
      count: featuredApps.length,
      apps: featuredApps,
    });
  } catch (error) {
    console.error("Error in getFeaturedApps:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Search Apps (Public)
export const searchApps = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required",
      });
    }

    const apps = await App.find({
      status: "approved",
      $or: [
        { appName: { $regex: query, $options: "i" } },
        { appDescription: { $regex: query, $options: "i" } },
        { category: { $regex: query, $options: "i" } },
      ],
    })
      .populate("developer", "name email")
      .sort({ downloads: -1, createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: apps.length,
      query,
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

// Get App Statistics 
export const getPublicStats = async (req, res) => {
  try {
    const totalApps = await App.countDocuments({ status: "approved" });
    
    const categoryStats = await App.aggregate([
      {
        $match: { status: "approved" }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      }
    ]);

    const topDownloaded = await App.findOne({
      status: "approved"
    })
      .sort({ downloads: -1 })
      .select("appName downloads appIcon.url");

    return res.status(200).json({
      success: true,
      stats: {
        totalAvailableApps: totalApps,
        categoryDistribution: categoryStats,
        mostDownloadedApp: topDownloaded,
      },
    });
  } catch (error) {
    console.error("Error in getPublicStats:", error);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};