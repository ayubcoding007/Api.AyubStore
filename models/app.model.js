import mongoose from "mongoose";

const appSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      required: true,
      trim: true,
    },

    appDescription: {
      type: String,
      required: true,
      trim: true,
    },

    category: {
      type: String,
      enum: ["Apps", "Games"],
      required: true,
    },

    // App Icon
    appIcon: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },

    // Screenshots
    appScreenshots: [
      {
        url: {
          type: String,
          required: true,
        },
        publicId: {
          type: String,
          required: true,
        },
      },
    ],

    // APK File
    appFile: {
      url: {
        type: String,
        required: true,
      },
      publicId: {
        type: String,
        required: true,
      },
    },

    developer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Developer",
      required: true,
    },

    status: {
      type: String,
      enum: ["approved", "blocked"],
      default: "approved",
    },

    downloads: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("App", appSchema);