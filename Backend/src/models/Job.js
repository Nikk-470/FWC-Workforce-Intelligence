const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Job title is required"],
      trim: true,
    },
    department: {
      type: String,
      required: [true, "Department is required"],
      trim: true,
    },
    location: {
      type: String,
      required: [true, "Location is required"], // e.g., "Remote", "New York, NY"
      trim: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Full-time", "Part-time", "Contract", "Internship"],
      default: "Full-time",
    },
    experienceLevel: {
      type: String,
      required: true,
      enum: ["Junior", "Mid-level", "Senior", "Lead/Executive"],
    },
    description: {
      type: String,
      required: [true, "Job description is required"],
    },
    requirements: [
      {
        type: String, // Array of key skills/requirements for AI screening matching
      },
    ],
    salaryRange: {
      min: { type: Number, default: 0 },
      max: { type: Number, default: 0 },
      currency: { type: String, default: "USD" },
    },
    status: {
      type: String,
      enum: ["Draft", "Active", "Closed", "Archived"],
      default: "Active",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Ties the job to the recruiter/manager who posted it
      required: false, // Set to true later if you have active auth middleware
    },
    applicationsCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("Job", jobSchema);