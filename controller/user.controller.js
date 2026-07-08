import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Helper check if request is from mobile app
const isMobileRequest = (req) => req.headers["x-mobile-app"] === "true";

// register user
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all the fields", success: false });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User already exists", success: false });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashedPassword,
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // Always return token for both mobile and web
    if (isMobileRequest(req)) {
      res.status(201).json({
        message: "User registered successfully (mobile)",
        success: true,
        user: { name: user.name, email: user.email },
        token,
      });
    } else {
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.status(201).json({
        message: "User registered successfully",
        success: true,
        user: { name: user.name, email: user.email },
        token, 
      });
    }
  } catch (error) {
    console.error("Error in registerUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// login user 
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please fill all the fields", success: false });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: "User does not exist", success: false });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid credentials", success: false });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
    };

    // Always return token for both mobile and web
    if (isMobileRequest(req)) {
      return res.status(200).json({
        message: "Logged in successfully",
        success: true,
        user: userData,
        token, 
      });
    } else {
      // Web set cookie
      res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      
      // Token return 
      return res.status(200).json({
        message: "Logged in successfully",
        success: true,
        user: userData,
        token, 
      });
    }
  } catch (error) {
    console.error("Error in loginUser:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// check auth 
export const checkAuth = async (req, res) => {
  try {
    let userId;

    if (isMobileRequest(req)) {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ 
          message: "Unauthorized", 
          success: false 
        });
      }
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        return res.status(401).json({ 
          message: "Invalid token", 
          success: false 
        });
      }
    } else {
      userId = req.user;
    }

    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found", success: false });
    }
    res.status(200).json({ 
      success: true, 
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
  } catch (error) {
    console.error("Error in checkAuth:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// logout user
export const logout = async (req, res) => {
  try {
    if (isMobileRequest(req)) {
      return res.status(200).json({
        message: "Logged out successfully",
        success: true,
      });
    } else {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        path: "/",
      });
      return res.status(200).json({
        message: "Logged out successfully",
        success: true,
      });
    }
  } catch (error) {
    console.error("Error in logout:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};