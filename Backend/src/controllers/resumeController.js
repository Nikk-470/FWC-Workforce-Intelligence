const fs = require("fs");
const pdf = require("pdf-parse");
const Candidate = require("../models/Candidate");
const mammoth = require("mammoth");
const { analyzeResume } = require("../services/aiService");

const uploadResume = async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Please select a job vacancy to link these resumes to.",
      });
    }

    // ==========================================
    // 🟢 HYBRID LAYER: Normalize Single vs. Multiple Files
    // ==========================================
    let filesToProcess = [];

    if (req.files && req.files.length > 0) {
      // Admin dashboard bulk-upload tracks
      filesToProcess = req.files;
    } else if (req.file) {
      // Careers page single candidate submissions
      filesToProcess = [req.file];
    }

    if (filesToProcess.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Transmission error: No file assets detected in the payload.",
      });
    }

    const savedCandidates = [];

    // Loop through our normalized array cleanly
    for (const file of filesToProcess) {
      const filePath = file.path;
      let extractedText = "";

      // 1. Text Extraction
      if (file.mimetype === "application/pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        extractedText = pdfData.text;
      } 
      else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      }

      if (!extractedText.trim()) {
        console.log(`Skipping empty file: ${file.originalname}`);
        continue;
      }

      // 2. AI Processing
      const aiResponse = await analyzeResume(extractedText);

      const parsedResponse = JSON.parse(
        aiResponse
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "")
      );
      
      console.log(`Successfully parsed candidate profile: ${parsedResponse.name}`);

      // 3. Save to MongoDB Database
      const candidate = await Candidate.create({
        jobId: jobId, 
        name: parsedResponse.name || req.body.name || "Unknown Applicant", // Fallbacks if AI omits it
        email: parsedResponse.email || req.body.email || "",
        phone: parsedResponse.phone || req.body.phone || "",
        skills: parsedResponse.skills || [],
        experience: parsedResponse.experience || "",
        education: parsedResponse.education || "",
        strengths: parsedResponse.strengths || [],
        weaknesses: parsedResponse.weaknesses || [],
        score: parsedResponse.score || 0,
        recommendation: parsedResponse.recommendation || "",
        resumeText: extractedText,
      });

      savedCandidates.push(candidate);
    }

    // 🟢 Success Response Return Track
    return res.status(200).json({
      success: true,
      count: savedCandidates.length,
      candidates: savedCandidates, 
    });

  } catch (error) {
    console.error("❌ Critical Controller Breakdown:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadResume,
};