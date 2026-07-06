import Developer from "../models/Developer.model.js";

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
        message: "Cannot reject an approved developer",
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