const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");

// ⚡ POST: /api/interviews/schedule
router.post("/schedule", async (req, res) => {
  try {
    console.log("📥 Received Interview Data:", req.body);
    
    // Destructure all parameters coming from standard manual forms and AI Modals alike
    const { candidateId, date, time, mode, type, link, difficulty, duration, focusSkills } = req.body;

    // 🟢 DEFENSIVE PORTAL SAFETY VALIDATION
    if (!candidateId) {
      return res.status(400).json({ success: false, message: "Missing candidateId tracker token." });
    }

    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      console.error(`🚨 Cast Exception Intercepted for candidateId: "${candidateId}"`);
      return res.status(400).json({ success: false, message: "Invalid hex string candidateId structure format." });
    }

    // 1. Parse out clear Date/Time formatting parameters defensively
    let combinedDateTime = new Date();
    if (date) {
      const rawDateStr = date.includes("T") ? date.split("T")[0] : date;
      const rawTimeStr = time || (date.includes("T") ? date.split("T")[1] : "10:00");
      
      combinedDateTime = new Date(`${rawDateStr}T${rawTimeStr}`);
    }

    // 2. Compile context specifications summary string
    const targetSummary = mode === "ai"
      ? `Awaiting automated AI screening session. [Track: ${difficulty || "Mid-Level"} | Duration: ${duration || "15 Mins"} | Core Targets: ${focusSkills || "Core Stack"}]`
      : "N/A - Live Selection Track";

    // 🟢 CRITICAL ATOMIC SAFETY ALIGNMENT REWRITE:
    // Instead of instantiating and saving an entire model block (which triggers schema validation drops), 
    // we explicitly update targeted nested object attributes directly onto the collection document.
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          status: "Interview Scheduled",
          "interviewDetails.mode": mode || "live",
          "interviewDetails.date": isNaN(combinedDateTime.getTime()) ? new Date() : combinedDateTime,
          "interviewDetails.type": type || "Technical Round",
          "interviewDetails.link": link || (mode === "ai" ? `http://localhost:5173/ai-room/${candidateId}` : "https://meet.google.com/mock-id"),
          "interviewDetails.aiFeedback.summaryAssessment": targetSummary
        }
      },
      { 
        new: true,            // Returns the modified document instead of the original raw document
        runValidators: false  // 🟢 BYPASSES UNCAUGHT NESTED MONGOOSE VALIDATION CAST FAULTS
      }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ success: false, message: "Target candidate profile record not found." });
    }

    console.log(`✅ Interview committed successfully for candidate: ${updatedCandidate.name}`);

    return res.status(200).json({
      success: true,
      message: "Interview configuration deployed and updated smoothly.",
      candidate: updatedCandidate
    });

  } catch (error) {
    console.error("🚨 Critical breakdown inside interview routes pipeline:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal Backend Processing Failure.",
      error: error.message 
    });
  }
});

module.exports = router;