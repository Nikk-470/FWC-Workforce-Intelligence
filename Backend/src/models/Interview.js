const mongoose = require("mongoose");

const InterviewSchema = new mongoose.Schema({
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Candidate",
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ["AI", "Human"],
    default: "Human"
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job",
    default: null
  },
  status: {
    type: String,
    enum: ["Pending", "Scheduled", "Completed", "Cancelled"],
    default: "Pending"
  },
  interviewDetails: {
    date: {
      type: String, // Kept as String to align with your routing data flow safely
      required: true
    },
    type: {
      type: String,
      default: "Technical Round"
    },
    link: {
      type: String,
      required: true
    }
  }
}, { timestamps: true });

// 🟢 EXPORT THE COMPILED MODEL DIRECTLY
module.exports = mongoose.model("Interview", InterviewSchema);