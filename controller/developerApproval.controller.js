import Developer from "../models/Developer.model.js";
import App from "../models/app.model.js"; 


// Get Pending Developers
export const pendingDevelopers = async (req, res) => {
  try {
    console.log('Fetching pending developers...');
    
    const developers = await Developer.find({
      isApproved: false,
    }).select("-password");
    
    console.log('Found developers:', developers.length);

    return res.status(200).json({
      success: true,
      developers,  
    });
  } catch (error) {
    console.error("Error in pendingDevelopers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Approve Developer
export const approveDeveloper = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Approving developer:', id);

    const developer = await Developer.findById(id);

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    if (developer.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Developer already approved",
      });
    }

    developer.isApproved = true;
    developer.status = "approved";
    developer.approvedAt = new Date();
    await developer.save();

    console.log('Developer approved:', developer.email);

    return res.status(200).json({
      success: true,
      message: "Developer approved successfully",
      developer,
    });
  } catch (error) {
    console.error("Error in approveDeveloper:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Reject Developer
export const rejectDeveloper = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Rejecting developer:', id);
    const developer = await Developer.findById(id);

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    if (developer.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Cannot reject an approved developer. Use Block instead.",
      });
    }

    await Developer.findByIdAndDelete(id);
    console.log('Developer rejected:', developer.email);

    return res.status(200).json({
      success: true,
      message: "Developer rejected successfully",
    });
  } catch (error) {
    console.error("Error in rejectDeveloper:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Get All Developers
export const getAllDevelopers = async (req, res) => {
  try {
    console.log('Fetching all developers...');
    
    const developers = await Developer.find()
      .select("-password")
      .sort({ createdAt: -1 });
    
    console.log('Found developers:', developers.length);

    return res.status(200).json({
      success: true,
      developers,
    });
  } catch (error) {
    console.error("Error in getAllDevelopers:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Block Developer Apps bhi block honge
export const blockDeveloper = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Blocking developer:', id);

    const developer = await Developer.findById(id);

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    if (!developer.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Developer is not approved yet",
      });
    }

    if (developer.status === "blocked") {
      return res.status(400).json({
        success: false,
        message: "Developer is already blocked",
      });
    }

    // Block Developer
    developer.isApproved = false;
    developer.status = "blocked";
    await developer.save();

    // Block ALL apps of this developer
    const appResult = await App.updateMany(
      { developer: id },
      { status: "blocked" }
    );

    console.log(`Developer blocked: ${developer.email}`);
    console.log(`${appResult.modifiedCount} apps blocked`);

    return res.status(200).json({
      success: true,
      message: `Developer blocked successfully. ${appResult.modifiedCount} apps blocked.`,
      developer: {
        id: developer._id,
        name: developer.name,
        email: developer.email,
        isApproved: developer.isApproved,
        status: developer.status,
      },
      appsBlocked: appResult.modifiedCount,
    });
  } catch (error) {
    console.error("❌ Error in blockDeveloper:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Unblock Developer Apps bhi unblock honge
export const unblockDeveloper = async (req, res) => {
  try {
    const { id } = req.params;

    console.log('Unblocking developer:', id);

    const developer = await Developer.findById(id);

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    if (developer.isApproved) {
      return res.status(400).json({
        success: false,
        message: "Developer is already approved",
      });
    }

    if (developer.status !== "blocked") {
      return res.status(400).json({
        success: false,
        message: "Developer is not blocked",
      });
    }

    // Unblock Developer
    developer.isApproved = true;
    developer.status = "approved";
    await developer.save();

    // Unblock ALL apps of this developer
    const appResult = await App.updateMany(
      { developer: id },
      { status: "approved" }
    );

    console.log(`Developer unblocked: ${developer.email}`);
    console.log(`${appResult.modifiedCount} apps unblocked`);

    return res.status(200).json({
      success: true,
      message: `Developer unblocked successfully. ${appResult.modifiedCount} apps unblocked.`,
      developer: {
        id: developer._id,
        name: developer.name,
        email: developer.email,
        isApproved: developer.isApproved,
        status: developer.status,
      },
      appsUnblocked: appResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error in unblockDeveloper:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

// Get Developer Stats
export const getDeveloperStats = async (req, res) => {
  try {
    const totalDevelopers = await Developer.countDocuments();
    const pendingDevelopers = await Developer.countDocuments({ 
      isApproved: false,
      status: "pending" 
    });
    const approvedDevelopers = await Developer.countDocuments({ 
      isApproved: true,
      status: "approved" 
    });
    const blockedDevelopers = await Developer.countDocuments({ 
      status: "blocked" 
    });

    return res.status(200).json({
      success: true,
      stats: {
        totalDevelopers,
        pendingDevelopers,
        approvedDevelopers,
        blockedDevelopers,
      },
    });
  } catch (error) {
    console.error("Error in getDeveloperStats:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};