import App from "../models/app.model.js";
import { uploadToSupabase, deleteFromSupabase } from "../config/supabase.js";

// Upload App
export const uploadApp = async (req, res) => {
  try {
    console.log('Upload App Request Received');
    console.log('req.body:', req.body);
    console.log('req.files:', req.files ? Object.keys(req.files) : 'No files');
    console.log('req.developer:', req.developer);

    const {
      appName,
      appDescription,
      category,
    } = req.body;

    // Validation
    if (!appName || !appDescription || !category) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    // Check if files are uploaded
    if (!req.files || !req.files.appIcon || !req.files.appFile) {
      return res.status(400).json({
        success: false,
        message: "App icon and APK file are required",
      });
    }

    // Upload App Icon to Supabase
    const appIconResult = await uploadToSupabase(
      req.files.appIcon[0],
      `appstore/apps/${appName}/icon`,
      "image"
    );

    // Upload Screenshots 
    const screenshotData = [];
    if (req.files.appScreenshots && req.files.appScreenshots.length > 0) {
      for (const screenshot of req.files.appScreenshots) {
        const result = await uploadToSupabase(
          screenshot,
          `appstore/apps/${appName}/screenshots`,
          "image"
        );
        screenshotData.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    }

    // Upload APK to Supabase
    const apkResult = await uploadToSupabase(
      req.files.appFile[0],
      `appstore/apps/${appName}/apk`,
      "raw"
    );

    // Create app in database
    const app = await App.create({
      appName,
      appDescription,
      category,
      appIcon: {
        url: appIconResult.secure_url,
        publicId: appIconResult.public_id,
      },
      appScreenshots: screenshotData,
      appFile: {
        url: apkResult.secure_url,
        publicId: apkResult.public_id,
      },
      developer: req.developer,
    });

    console.log('App uploaded successfully:', app.appName);

    return res.status(201).json({
      success: true,
      message: "App uploaded successfully",
      app,
    });

  } catch (error) {
    console.error("Error in uploadApp:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Update App
export const updateApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    // Check ownership
    if (app.developer.toString() !== req.developer) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update this app",
      });
    }

    const {
      appName,
      appDescription,
      category,
    } = req.body;

    // Update text fields
    if (appName) app.appName = appName;
    if (appDescription) app.appDescription = appDescription;
    if (category) app.category = category;

    // Update App Icon if uploaded
    if (req.files && req.files.appIcon) {
      // Delete old icon from Supabase
      if (app.appIcon && app.appIcon.publicId) {
        await deleteFromSupabase(app.appIcon.publicId);
      }

      // Upload new icon
      const iconResult = await uploadToSupabase(
        req.files.appIcon[0],
        `appstore/apps/${app.appName || appName}/icon`,
        "image"
      );
      
      app.appIcon = {
        url: iconResult.secure_url,
        publicId: iconResult.public_id,
      };
    }

    // Update Screenshots if uploaded
    if (req.files && req.files.appScreenshots && req.files.appScreenshots.length > 0) {
      // Delete old screenshots from Supabase
      if (app.appScreenshots && app.appScreenshots.length > 0) {
        for (const screenshot of app.appScreenshots) {
          if (screenshot.publicId) {
            await deleteFromSupabase(screenshot.publicId);
          }
        }
      }

      // Upload new screenshots
      const newScreenshotData = [];
      for (const screenshot of req.files.appScreenshots) {
        const result = await uploadToSupabase(
          screenshot,
          `appstore/apps/${app.appName || appName}/screenshots`,
          "image"
        );
        newScreenshotData.push({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
      
      app.appScreenshots = newScreenshotData;
    }

    // Update APK if uploaded
    if (req.files && req.files.appFile) {
      // Delete old APK from Supabase
      if (app.appFile && app.appFile.publicId) {
        await deleteFromSupabase(app.appFile.publicId);
      }

      // Upload new APK
      const apkResult = await uploadToSupabase(
        req.files.appFile[0],
        `appstore/apps/${app.appName || appName}/apk`,
        "raw"
      );
      
      app.appFile = {
        url: apkResult.secure_url,
        publicId: apkResult.public_id,
      };
    }

    await app.save();

    return res.status(200).json({
      success: true,
      message: "App updated successfully",
      app,
    });

  } catch (error) {
    console.error("Error in updateApp:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Delete App
export const deleteApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    // Check ownership
    if (app.developer.toString() !== req.developer) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete this app",
      });
    }

    // Delete files from Supabase
    try {
      // Delete app icon
      if (app.appIcon && app.appIcon.publicId) {
        await deleteFromSupabase(app.appIcon.publicId);
        console.log('Deleted icon:', app.appIcon.publicId);
      }

      // Delete APK
      if (app.appFile && app.appFile.publicId) {
        await deleteFromSupabase(app.appFile.publicId);
        console.log('Deleted APK:', app.appFile.publicId);
      }

      // Delete screenshots
      if (app.appScreenshots && app.appScreenshots.length > 0) {
        for (const screenshot of app.appScreenshots) {
          if (screenshot.publicId) {
            await deleteFromSupabase(screenshot.publicId);
            console.log('Deleted screenshot:', screenshot.publicId);
          }
        }
      }

    } catch (supabaseError) {
      console.error("Error deleting from Supabase:", supabaseError);
      // Continue with app deletion even if Supabase fails
    }

    // Delete app from database
    await App.findByIdAndDelete(req.params.id);
    return res.status(200).json({
      success: true,
      message: "App deleted successfully",
    });

  } catch (error) {
    console.error("Error in deleteApp:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// My Apps
export const myApps = async (req, res) => {
  try {
    const apps = await App.find({
      developer: req.developer,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: apps.length,
      apps,
    });

  } catch (error) {
    console.error("Error in myApps:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

// Single App
export const getSingleApp = async (req, res) => {
  try {
    const app = await App.findById(req.params.id);

    if (!app) {
      return res.status(404).json({
        success: false,
        message: "App not found",
      });
    }

    if (app.developer.toString() !== req.developer) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    return res.status(200).json({
      success: true,
      app,
    });

  } catch (error) {
    console.error("Error in getSingleApp:", error);
    console.error("Error stack:", error.stack);

    return res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};