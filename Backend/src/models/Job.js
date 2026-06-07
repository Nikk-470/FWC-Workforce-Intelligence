const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  // --- Core Fields ---
  title: { type: String, required: true, default: "Untitled Position" },
  department: { type: String, required: true, default: "General Engineering" },
  location: { type: String, required: true, default: "Remote" },
  type: { type: String, required: true, default: "Full-time" },
  experienceLevel: { type: String, default: "Junior" },
  description: { type: String, required: true, default: "No description provided." },
  
  // Support both String format and Array format safely
  requirements: { type: mongoose.Schema.Types.Mixed, default: "" }, 

  // --- 🟢 Backward Compatibility Layout Fields (For older postings) ---
  salaryType: { type: String, default: "Fixed Amount" },
  minSalary: { type: Number, default: 0 },
  maxSalary: { type: Number, default: 0 },
  currency: { type: String, default: "India (INR)" },
  applicationsCount: { type: Number, default: 0 },

  // --- 🟢 New Interactive Fields (Fixes the 500 Form Crash) ---
  salaryRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 },
    currency: { type: String, default: "INR" }
  },
  openingFrom: { type: Date },
  openingTo: { type: Date },
  jdPdfUrl: { type: String, default: null }

}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);