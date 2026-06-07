const Candidate = require("../models/Candidate");
const Job = require("../models/Job");
const { analyzeResume } = require("../services/aiService"); // ⚡ Import your Groq AI Service
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse"); // ⚠️ Ensure you have run: npm install pdf-parse

// 📋 FETCH ALL CANDIDATES
const getCandidates = async (req, res) => {
  try {
    const candidates = await Candidate.find({}).populate("jobId");
    res.status(200).json(candidates);
  } catch (error) {
    console.error("❌ Error in getCandidates:", error);
    res.status(500).json({ error: error.message });
  }
};

// ➕ CREATE A NEW CANDIDATE
const createCandidate = async (req, res) => {
  try {
    const { name, email, phone, jobId, ...otherFields } = req.body;

    if (!jobId) {
      return res.status(400).json({ error: "A candidate must be assigned to a specific job opening." });
    }

    const newCandidate = new Candidate({
      name,
      email,
      phone,
      jobId, 
      ...otherFields
    });

    const savedCandidate = await newCandidate.save();
    res.status(201).json(savedCandidate);
  } catch (error) {
    console.error("❌ Error in createCandidate:", error);
    res.status(500).json({ error: error.message });
  }
};

// ⚡ EVALUATE AND GRADE MATCH PIPELINE VIA AI
const evaluateMatch = async (req, res) => {
  try {
    const candidateId = req.params.id;

    // 1. Fetch Candidate profile
    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ success: false, error: "Candidate profile record not found." });
    }

    // 2. Fetch Job requirements if available to provide baseline to the AI
    let jobRequirementsText = "General Profile Application Match Assessment.";
    if (candidate.jobId) {
      const job = await Job.findById(candidate.jobId);
      if (job) {
        jobRequirementsText = `
          Position Title: ${job.title}
          Department: ${job.department}
          Target Core Requirements: ${job.requirements || ''}
          Role Context Description: ${job.description || ''}
        `;
      }
    }

    // 3. Construct absolute storage location path for the uploaded PDF resume asset
    // Strips out route prefixes and targets your absolute server root 'uploads' directory
    const cleanFileName = candidate.resumeUrl.replace('/uploads/', '');
    const absoluteResumePath = path.join(__dirname, "../../uploads", cleanFileName);

    if (!fs.existsSync(absoluteResumePath)) {
      return res.status(404).json({ success: false, error: `Physical file asset missing on server storage disk.` });
    }

    // 4. Parse binary PDF contents into layout text rows
    const dataBuffer = fs.readFileSync(absoluteResumePath);
    const parsedPdfData = await pdfParse(dataBuffer);
    const extractedResumeText = parsedPdfData.text;

    if (!extractedResumeText || extractedResumeText.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Unable to parse textual characters out of the target resume PDF file structure." });
    }

    // 5. Fire request payload to Groq Llama-3.3 engine passing BOTH the resume and requirements
    const rawAiResponse = await analyzeResume(extractedResumeText, jobRequirementsText);
    
    // Safety check to clear any unneeded markdown formatting tags returned by the model
    const cleanJsonResponse = rawAiResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    const aiResult = JSON.parse(cleanJsonResponse);

    // 6. Map the calculated response fields directly back to your Candidate DB schema fields
    candidate.aiScore = Number(aiResult.score) || 0;
    candidate.recommendation = aiResult.recommendation || 'Consider';
    
    // Auto shift pipeline tags smoothly depending on recommendations
    if (aiResult.recommendation) {
      candidate.status = aiResult.recommendation === 'Reject' ? 'Rejected' : 
                         aiResult.recommendation === 'Shortlist' ? 'Shortlisted' : 'Applied';
    }
    
    await candidate.save();

    // 7. Return score values to live-update your reactive frontend tables instantly
    return res.status(200).json({
      success: true,
      message: "AI analysis pipeline executed cleanly.",
      score: candidate.aiScore,
      candidate: candidate
    });

  } catch (error) {
    console.error("❌ Error inside evaluateMatch pipeline:", error);
    return res.status(500).json({ success: false, error: "Internal AI grading service routine failure." });
  }
};

// Make sure ALL are exported together at the bottom:
module.exports = {
  getCandidates,
  createCandidate,
  evaluateMatch // 🟢 Added to export layer
};  