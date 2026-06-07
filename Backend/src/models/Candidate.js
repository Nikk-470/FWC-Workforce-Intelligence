// models/Candidate.js
const mongoose = require('mongoose');

const CandidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, default: '' },
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: false },
  jobTitle: { type: String, default: 'General Pooling' },
  resumeUrl: { type: String, default: '' },
  status: { 
    type: String, 
    // 🟢 Preserved your exact selection rules intact for downstream processes
    enum: ['Applied', 'Shortlisted', 'Interview Scheduled', 'Hired', 'Rejected'], 
    default: 'Applied' 
  },
  
  // 🟢 CHANGED: Set default to null to cleanly flag "Not Evaluated" in your frontend tables
  aiScore: { type: Number, default: null }, 

  // 🟢 ADDED: Structural text field to save the AI match reasoning and project analysis
  recommendation: { type: String, default: '' },

  interviewDetails: {
    mode: { type: String, enum: ['none', 'live', 'ai'], default: 'none' },
    date: { type: Date },
    type: { type: String, default: 'Technical Round' },
    link: { type: String, default: '' },
    // Container for the interactive 50-Point automated examination report
    aiFeedback: {
      overallScore: { type: Number, default: 0 }, // Out of 50 marks
      technicalProficiency: { type: Number, default: 0 }, // Out of 10
      communicationClarity: { type: Number, default: 0 }, // Out of 10
      problemSolving: { type: Number, default: 0 }, // Out of 10
      domainKnowledge: { type: Number, default: 0 }, // Out of 10
      culturalFit: { type: Number, default: 0 }, // Out of 10
      summaryAssessment: { type: String, default: '' },
      feedbackMatrix: {
        positives: [{ type: String }],
        negatives: [{ type: String }]
      },
      transcriptSummary: [{
        speaker: { type: String },
        text: { type: String }
      }]
    }
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Candidate', CandidateSchema);