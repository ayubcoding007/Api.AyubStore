import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

// Helper: check if request is from mobile app
const isMobileRequest = (req) => req.headers["x-mobile-app"] === "true";

export const authAdmin = async (req, res, next) => {
  try {
    let token = null;

    // First check Authorization header (Frontend sends this)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }

    // If no token in header, check cookies (for web)
    if (!token) {
      const cookieToken = req.cookies?.adminToken || req.cookies?.AdminToken;
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

      // Check if admin (check both role and email)
      const isAdmin = decoded.role === "admin" || 
                      decoded.email === process.env.ADMIN_EMAIL || 
                      decoded.email === process.env.Admin_EMAIL;

      if (isAdmin) {
        req.admin = {
          id: decoded.id || "admin_001",
          email: decoded.email,
          role: "admin",
        };
        return next();
      } else {
        console.log('Not an admin - role:', decoded.role);
        return res.status(403).json({
          success: false,
          message: "Forbidden - Admin access required",
        });
      }
    } catch (error) {
      console.log('Invalid Token:', error.message);
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }
  } catch (error) {
    console.error("Error in authAdmin middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};