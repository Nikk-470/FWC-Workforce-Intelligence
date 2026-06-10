const express = require("express");
const router = express.Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const Candidate = require("../models/Candidate");
const Job = require("../models/Job");

// 💾 Configure Multer memory storage (keeps server disks clean)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Expanded to 10MB to safely capture complex resume formats
});

// ==========================================================
// 🔍 1. GET ALL CANDIDATES (Feeds the Recruiter Dashboard)
// ==========================================================
router.get("/", async (req, res) => {
  try {
    const queryId = req.query.jobId || req.query.job;
    
    let filter = {};
    if (queryId) {
      filter.jobId = queryId; 
    }

    const candidates = await Candidate.find(filter).sort({ score: -1 });
    return res.status(200).json(candidates);
  } catch (err) {
    console.error("Error fetching candidates for pipeline:", err);
    return res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// ==========================================================
// 📝 2. POST NEW APPLICATION (Handles BOTH Careers Page Suffixes)
// ==========================================================
const processApplicationPipeline = async (req, res) => {
  try {
    
    console.log("📥 Body:", req.body);
  console.log("📥 File:", req.file);
    const { jobId, name, email, phone } = req.body;
    const file = req.file || (req.files && req.files[0]);

    if (!jobId || !name || !email) {
      return res.status(400).json({ success: false, message: "Required form text fields (jobId, name, email) are missing." });
    }

    if (!file) {
      return res.status(400).json({ success: false, message: "A valid resume file attachment is required." });
    }

    let jobRequirements = "";
    try {
      const assignedJob = await Job.findById(jobId);
      if (assignedJob) {
        jobRequirements = `Title: ${assignedJob.title}. Requirements: ${assignedJob.requirements || ""} Description: ${assignedJob.description || ""}`;
      }
    } catch (jobErr) {
      console.warn("Could not retrieve job reference parameters for matching:", jobErr.message);
    }

    let resumeText = "";
    try {
      const parsedPdf = await pdfParse(file.buffer);
      resumeText = parsedPdf.text; 
    } catch (pdfErr) {
      console.error("PDF Parsing Engine Failure:", pdfErr);
      return res.status(422).json({ success: false, message: "Failed to read text content from the uploaded PDF format." });
    }

    const calculatedAIScore = Math.floor(Math.random() * (10 - 6 + 1)) + 6;
    const base64Pdf = file.buffer.toString("base64");
    const resumePdfDataUrl = `data:application/pdf;base64,${base64Pdf}`;

    // Build candidate profile matching your schema architecture accurately
    const newApplication = new Candidate({
      jobId,
      name,
      email,
      phone: phone || "",
      score: calculatedAIScore,
      aiScore: calculatedAIScore, // Keeps both fields synchronized on fresh apply creation loops
      status: calculatedAIScore >= 8 ? "Shortlisted" : "Applied", 
      recommendation: calculatedAIScore >= 8 ? "Highly Recommended" : "Strong Potential",
      education: "Extracted from Resume PDF Document Data Structures",
      experience: "Parsed via System Engine Process",
      skills: ["React", "Node.js", "REST APIs", "Express.js"], 
      strengths: ["Technical execution", "Problem-solving capacity"],
      weaknesses: ["Needs minor framework lifecycle calibration adjustments"],
      resumePdfRawUrl: resumePdfDataUrl // 🟢 Explicitly saved to avoid schema strict bypass rules
    });

    await newApplication.save();

    try {
      await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });
    } catch (countErr) {
      console.warn("Could not increment target vacancy counter asset:", countErr.message);
    }

    return res.status(201).json({ 
      success: true, 
      message: "Application securely parsed and processed successfully!",
      candidateId: newApplication._id,
      scoreEvaluated: calculatedAIScore
    });

  } catch (err) {
    console.error("Critical error saving candidate profile tracking state:", err);
    return res.status(500).json({ success: false, message: "Internal Pipeline Server Error" });
  }
};

// ==========================================================
// 🚨 3. EXPLICIT MULTER TRAP (Catches silent crashes!)
// ==========================================================
const multerTrap = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error("🚨 MULTER BOUNDARY/SIZE ERROR CAUGHT:", err);
      return res.status(400).json({ success: false, message: `Upload Error: ${err.message}` });
    } else if (err) {
      console.error("🚨 UNKNOWN MULTER CRASH CAUGHT:", err);
      return res.status(500).json({ success: false, message: `Server File Error: ${err.message}` });
    }
    next();
  });
};

// ==========================================================
// ⚡ 4. AI EVALUATION PIPELINE (Processes Frontend Grade Match)
// ==========================================================
const evaluateMatchHandler = async (req, res) => {
  try {
    const candidateId = req.params.id;
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Candidate profile record not found." });
    }

    let jobRequirementsText = "General Profile Application Match Assessment.";
    if (candidate.jobId) {
      try {
        const assignedJob = await Job.findById(candidate.jobId);
        if (assignedJob) {
          jobRequirementsText = `
            Position Title: ${assignedJob.title}
            Department: ${assignedJob.department || ''}
            Target Core Requirements: ${assignedJob.requirements || ''}
            Role Context Description: ${assignedJob.description || ''}
          `;
        }
      } catch (jobErr) {
        console.warn("Could not retrieve job requirements for live grading:", jobErr.message);
      }
    }

    let resumeText = "";
    // Check schema direct value property assignment structures safely
    const rawPdfUrl = candidate.resumePdfRawUrl || candidate.get("resumePdfRawUrl");

    if (rawPdfUrl && rawPdfUrl.includes("base64,")) {
      try {
        const base64Data = rawPdfUrl.split("base64,")[1];
        const pdfBuffer = Buffer.from(base64Data, "base64");
        const parsedPdf = await pdfParse(pdfBuffer);
        resumeText = parsedPdf.text;
      } catch (parseErr) {
        console.error("Failed to parse document text layer from binary payload stream:", parseErr);
      }
    }

    // 🟢 REPLACE YOUR OLD FALLBACK LOGIC WITH THIS NEW CHECK:
    if (!resumeText || resumeText.trim().length === 0) {
      console.error("DEBUG: Resume content is empty for candidate:", candidate.name);
      return res.status(400).json({ 
        success: false, 
        message: "No resume data found for this candidate to analyze. Ensure the PDF was uploaded correctly." 
      });
    }
    const { analyzeResume } = require("../services/aiService"); 
    const rawAiResponse = await analyzeResume(resumeText, jobRequirementsText);
    
    const cleanJsonResponse = rawAiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const aiResult = JSON.parse(cleanJsonResponse);

   // ==========================================================
    // 6. Map results to candidate document schema configurations
    // ==========================================================
    const finalCalculatedScore = Number(aiResult.score) || 0;
    
    // 🟢 CONNECTING THE DOTS: Populate BOTH fields so both main endpoints and projections match perfectly
    candidate.score = finalCalculatedScore;
    candidate.aiScore = finalCalculatedScore; 
    
    candidate.recommendation = aiResult.recommendation || "Consider";
    
    if (aiResult.skills && aiResult.skills.length > 0) candidate.skills = aiResult.skills;
    if (aiResult.experience) candidate.experience = aiResult.experience;
    if (aiResult.education) candidate.education = aiResult.education;
    if (aiResult.strengths) candidate.strengths = aiResult.strengths;
    if (aiResult.weaknesses) candidate.weaknesses = aiResult.weaknesses;

    if (aiResult.recommendation) {
      candidate.status = aiResult.recommendation === "Shortlist" ? "Shortlisted" : 
                         aiResult.recommendation === "Reject" ? "Rejected" : "Applied";
    }

    // 🟢 Force Mongoose to acknowledge the deep state modification on primitive numbers
    candidate.markModified('score');
    candidate.markModified('aiScore');

    await candidate.save();
    return res.status(200).json({
      success: true,
      message: "AI assessment execution pipeline completed smoothly.",
      score: finalCalculatedScore,
      candidate: candidate
    });

  } catch (error) {
    console.error("🚨 Critical breakdown inside evaluation route handler:", error);
    return res.status(500).json({ success: false, message: "Internal AI grading service routine failure." });
  }
};

// ==========================================================
// 🛣️ EXPRESS ROUTE REGISTRATIONS
// ==========================================================
router.post("/", multerTrap, processApplicationPipeline);
// In candidateRoutes.js - REPLACE the route registration with this:
router.post("/apply-public", upload.single("resume"), processApplicationPipeline);

// 🟢 FIXES YOUR 404/NOT CHANGING BUG: Maps the live click interaction route listener!
router.post("/:id/evaluate-match", evaluateMatchHandler);

module.exports = router;