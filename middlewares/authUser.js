import jwt from "jsonwebtoken";

// Helper: check if request is from mobile app
const isMobileRequest = (req) => req.headers["x-mobile-app"] === "true";

const authUser = async (req, res, next) => {
  try {
    if (isMobileRequest(req)) {
      // Mobile -> token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader)
        return res.status(401).json({ message: "Unauthorized", success: false });

      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;
        next();
      } catch {
        return res.status(401).json({ message: "Invalid token", success: false });
      }
    } else {
      // Web -> cookie based (unchanged)
      const { token } = req.cookies;
      if (!token) {
        return res.status(401).json({ message: "Unauthorized", success: false });
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.id;
        next();
      } catch (error) {
        console.error("Error in authUser middleware:", error);
        return res.status(401).json({ message: "Invalid token", success: false });
      }
    }
  } catch (error) {
    console.error("Error in authUser middleware:", error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }
};

export default authUser;