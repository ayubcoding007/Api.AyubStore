import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Helper: check if request is from mobile app
const isMobileRequest = (req) => req.headers["x-mobile-app"] === "true";

const authDeveloper = async (req, res, next) => {
  try {
    let token = null;

    // FIRST check Authorization header (Frontend sends this)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // If no token in header, check cookies (for web)
    if (!token) {
      const cookieToken = req.cookies?.developerToken || req.cookies?.DeveloperToken;
      if (cookieToken) {
        token = cookieToken;
      }
    }

    // If still no token, check mobile header
    if (!token && isMobileRequest(req)) {
      const mobileAuthHeader = req.headers.authorization;
      if (mobileAuthHeader) {
        token = mobileAuthHeader.split(" ")[1];
      }
    }

    // If no token found
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - No token provided",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check if developer
      if (decoded.role === "developer") {
        req.developer = decoded.id;
        next();
      } else {
        return res.status(403).json({
          success: false,
          message: "Forbidden - Developer access required",
        });
      }
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export default authDeveloper;