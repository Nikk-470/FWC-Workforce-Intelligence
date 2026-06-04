const mongoose = require("mongoose");

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  score: { type: Number },
  recommendation: { type: String },
  education: { type: String },
  experience: { type: String },
  skills: [{ type: String }],
  strengths: [{ type: String }],
  weaknesses: [{ type: String }],
  
  // 📅 ADD THESE TWO FIELDS TO YOUR EXISTING SCHEMA:
  interviewScheduled: { 
    type: Boolean, 
    default: false 
  },
  interviewDetails: {
    date: { type: String },
    type: { type: String },
    link: { type: String }
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Job", // Maps directly to the 'Job' collection model we just created
    required: [true, "A candidate must be assigned to a specific job opening"],
  }
  
}, { timestamps: true });

module.exports = mongoose.model("Candidate", CandidateSchema);