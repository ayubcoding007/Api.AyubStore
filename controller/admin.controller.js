import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const isMobileRequest = (req) => req.headers["x-mobile-app"] === "true";

export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
   
    if (
      password === process.env.ADMIN_PASSWORD &&
      email === process.env.ADMIN_EMAIL
    ) {
      const token = jwt.sign(
        { 
          email, 
          role: "admin",
          id: "admin_001"
        }, 
        process.env.JWT_SECRET, 
        {
          expiresIn: "7d",
        }
      );

      const adminData = {
        id: "admin_001",
        email,
        name: "Administrator",
        role: "admin",
      };

      if (isMobileRequest(req)) {
        return res.status(200).json({
          success: true,
          message: "Login successful",
          token,
          admin: adminData,
        });
      } else {
        res.cookie("adminToken", token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
          path: "/",
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        
        // Return token in response
        return res.status(200).json({
          success: true,
          message: "Login successful",
          token: token,  
          admin: adminData,
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }
  } catch (error) {
    console.error("Error in adminLogin:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const checkAuth = async (req, res) => {
  try {    
    // Check if admin is set in request (from middleware)
    if (req.admin) {
      return res.status(200).json({
        success: true,
        admin: req.admin,
      });
    }
    // Fallback: Check cookie
    const token = req.cookies.adminToken;
    if (!token) {
      console.log('No token in cookies');
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return res.status(200).json({
        success: true,
        admin: {
          id: decoded.id || "admin_001",
          email: decoded.email,
          role: "admin",
          name: "Administrator",
        },
      });
    } catch (error) {
     
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
  } catch (error) {
    console.error("Error in checkAuth:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const adminLogout = async (req, res) => {
  try {
    if (isMobileRequest(req)) {
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } else {
      res.clearCookie("adminToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
      });
      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    }
  } catch (error) {
    console.error("Error in adminLogout:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};