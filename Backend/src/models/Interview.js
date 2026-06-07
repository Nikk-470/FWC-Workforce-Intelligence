const mongoose = require("mongoose");

const InterviewSchema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Candidate",
      required: true,
      index: true, // 🟢 Indexed for ultra-fast lookup
    },
    // Supports both keys interchangeably for full data integration mapping
    candidateName: { type: String },
    candidateEmail: { type: String },
    name: { type: String },  // Catch-all mapping matching dashboard payload
    email: { type: String }, // Catch-all mapping matching dashboard payload
    
    // Traditional Human Scheduler Timeframe Properties
    date: { type: String }, // Format: YYYY-MM-DD
    time: { type: String }, // Format: HH:MM
    interviewer: { type: String },
    
    // Core Workflow Routing Identifiers
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job" },
    type: { type: String, enum: ["AI", "Human"], default: "AI" },
    
    status: {
      type: String,
      enum: ["Scheduled", "Pending", "Completed", "Cancelled", "Abandoned"],
      default: "Scheduled",
    },

    // Extended Assessment Data Matrix Blocks
    interviewDetails: {
      date: { type: String },
      type: { type: String }, // e.g. "Technical Round", "System Design Architecture"
      link: { type: String }, // Meet/Zoom/Sandbox Link
      aiParameters: {
        roleTier: { type: String },
        questionCount: { type: Number },
        strictProctoring: { type: Boolean }
      }
    },

    // 📊 AI Scorecard Telemetry Matrix & Report Analytics
    overallScore: { type: Number, default: 0 }, // Out of 50 total scale points
    categories: {
      technicalCore: { type: Number, default: 0 },
      systemArchitecture: { type: Number, default: 0 },
      behavioralCulture: { type: Number, default: 0 },
      communicationFluency: { type: Number, default: 0 }
    },
    
    // NLP Keyword / Compliance Extraction Nodes
    feedbackMatrix: {
      positives: [{ type: String }],
      negatives: [{ type: String }],
      coreSkillsIdentified: [{ type: String }]
    },

    // 🔒 Proctor Deflection Records
    proctorViolations: {
      tabSwitches: { type: Number, default: 0 },
      phoneDetections: { type: Number, default: 0 },
      multipleFaces: { type: Number, default: 0 }
    },

    // 📝 Session Sub-Transcript Array Map
    transcriptLog: [
      {
        speaker: { type: String }, // "AI (Ava)" or "Candidate"
        text: { type: String },
        timestamp: { type: Date, default: Date.now }
      }
    ]
  },
  { timestamps: true }
);

// Virtual getters to clean data fallback lookups seamlessly
InterviewSchema.pre("save", function (next) {
  if (this.name && !this.candidateName) this.candidateName = this.name;
  if (this.email && !this.candidateEmail) this.candidateEmail = this.email;
  if (!this.date && this.interviewDetails?.date) {
    // Extract separate date string cleanly if received as timestamp string
    this.date = this.interviewDetails.date.split("T")[0];
    this.time = this.interviewDetails.date.split("T")[1] || "12:00";
  }
  next();
});

module.exports = mongoose.models.Interview || mongoose.model("Interview", InterviewSchema);