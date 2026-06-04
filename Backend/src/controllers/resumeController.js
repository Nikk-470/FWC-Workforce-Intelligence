const fs = require("fs");
const pdf = require("pdf-parse");
const Candidate = require("../models/Candidate");
const mammoth = require("mammoth");
const { analyzeResume } = require("../services/aiService");

const uploadResume = async (req, res) => {
  try {
    // ➕ CHANGE 1: Grab the jobId sent from the frontend form
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({
        success: false,
        message: "Please select a job vacancy to link these resumes to.",
      });
    }

    // 🟢 CHECK: Check for req.files (array) instead of req.file
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    const savedCandidates = [];

    // 🟢 Loop through each file in the uploaded files array
    for (const file of req.files) {
      const filePath = file.path;
      let extractedText = "";

      // 1. Extract text based on file type
      if (file.mimetype === "application/pdf") {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(dataBuffer);
        extractedText = pdfData.text;
      } 
      else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ) {
        const result = await mammoth.extractRawText({
          path: filePath,
        });
        extractedText = result.value;
      }

      // Skip processing if no text could be extracted from this specific file
      if (!extractedText.trim()) {
        console.log(`Skipping empty or unreadable file: ${file.originalname}`);
        continue;
      }

      // 2. Analyze with AI Service
      const aiResponse = await analyzeResume(extractedText);

      const parsedResponse = JSON.parse(
        aiResponse
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim()
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, "") // Added a safe fallback line for cleaner JSON handling
      );
      
      console.log(`Successfully parsed: ${parsedResponse.name}`);

      // 3. Save to MongoDB Database
      const candidate = await Candidate.create({
        jobId: jobId, // ➕ CHANGE 2: Save the relationship connection right here!
        name: parsedResponse.name,
        email: parsedResponse.email,
        phone: parsedResponse.phone,
        skills: parsedResponse.skills,
        experience: parsedResponse.experience,
        education: parsedResponse.education,
        strengths: parsedResponse.strengths,
        weaknesses: parsedResponse.weaknesses,
        score: parsedResponse.score,
        recommendation: parsedResponse.recommendation,
        resumeText: extractedText,
      });

      savedCandidates.push(candidate);
    }

    // 🟢 Return all successfully saved candidates back to the client
    res.status(200).json({
      success: true,
      count: savedCandidates.length,
      candidates: savedCandidates, 
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  uploadResume,
};