import multer from "multer";

// Store files in memory
const storage = multer.memoryStorage();

// File Filter
const fileFilter = (req, file, cb) => {
  // Images
  if (file.fieldname === "appIcon") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("App icon must be an image"), false);
  }
  if (file.fieldname === "appScreenshots") {
    if (file.mimetype.startsWith("image/")) {
      return cb(null, true);
    }
    return cb(new Error("Screenshots must be images"), false);
  }
  // APK
  if (file.fieldname === "appFile") {
    if (
      file.mimetype === "application/vnd.android.package-archive" ||
      file.originalname.endsWith(".apk")
    ) {
      return cb(null, true);
    }
    return cb(new Error("Only APK files are allowed"), false);
  }
  cb(new Error("Invalid file field"), false);
};

const upload = multer({
  storage,

  fileFilter,

  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

export default upload;