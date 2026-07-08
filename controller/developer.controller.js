import Developer from "../models/developer.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper check if request is from mobile app
const isMobileRequest = (req) => req.headers["x-mobile-app"] === "true";


// Register Developer
export const registerDeveloper = async (req, res) => {
  try {
    const { name, email, password, company } = req.body;

    console.log("Register Attempt:", { name, email, company });

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const existingDeveloper = await Developer.findOne({ email });

    if (existingDeveloper) {
      return res.status(400).json({
        success: false,
        message: "Developer already exists with this email",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const developer = await Developer.create({
      name,
      email,
      password: hashedPassword,
      company: company || "",
      isApproved: false,
      status: "pending",
    });

    console.log("Developer Registered:", developer.email);

    return res.status(201).json({
      success: true,
      message: "Registration successful. Please wait for Admin approval before login.",
      developer: {
        id: developer._id,
        name: developer.name,
        email: developer.email,
        company: developer.company,
        isApproved: developer.isApproved,
        status: developer.status,
      },
    });
  } catch (error) {
    console.error("Error in registerDeveloper:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};


// Login Developer
export const loginDeveloper = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all the fields",
      });
    }

    const developer = await Developer.findOne({ email });

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer does not exist",
      });
    }

    const isMatch = await bcrypt.compare(password, developer.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if developer is approved
    if (!developer.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is waiting for Admin approval. Please try again later.",
      });
    }

    // Check if developer is blocked
    if (developer.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact admin.",
      });
    }

    const token = jwt.sign(
      {
        id: developer._id,
        email: developer.email,
        role: "developer",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    const developerData = {
      id: developer._id,
      name: developer.name,
      email: developer.email,
      company: developer.company,
      isApproved: developer.isApproved,
      status: developer.status,
    };

    if (isMobileRequest(req)) {
      return res.status(200).json({
        success: true,
        message: "Login successful",
        developer: developerData,
        token,
      });
    }

    res.cookie("developerToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      developer: developerData,
      token,
    });
  } catch (error) {
    console.error("Error in loginDeveloper:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Check Auth
export const checkDeveloperAuth = async (req, res) => {
  try {
    let developerId;

    if (isMobileRequest(req)) {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized",
        });
      }

      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        developerId = decoded.id;
      } catch {
        return res.status(401).json({
          success: false,
          message: "Invalid token",
        });
      }
    } else {
      developerId = req.developer;
    }

    const developer = await Developer.findById(developerId).select("-password");

    if (!developer) {
      return res.status(404).json({
        success: false,
        message: "Developer not found",
      });
    }

    // Check if developer is approved and not blocked
    if (!developer.isApproved) {
      return res.status(403).json({
        success: false,
        message: "Your account is not approved. Please contact admin.",
      });
    }

    if (developer.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your account has been blocked. Please contact admin.",
      });
    }

    return res.status(200).json({
      success: true,
      developer: {
        id: developer._id,
        name: developer.name,
        email: developer.email,
        company: developer.company,
        isApproved: developer.isApproved,
        status: developer.status,
      },
    });
  } catch (error) {
    console.error("Error in checkDeveloperAuth:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};


// Logout Developer 
export const logoutDeveloper = async (req, res) => {
  try {
    console.log("Developer logging out...");

    if (isMobileRequest(req)) {
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    }

    // Clear both possible cookie names
    res.clearCookie("developerToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      path: "/",
    });

    res.clearCookie("DeveloperToken", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      path: "/",
    });

    console.log("Developer logged out successfully");

    return res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error in logoutDeveloper:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};