const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParse = require('pdf-parse');
const OpenAI = require("openai"); 
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');


// 🟢 Explicitly import your database models
const Job = require('../models/Job');
const Candidate = require('../models/Candidate');
const Interview = require('../models/Interview');
const screeningRules = require('../config/aiScreeningRules');
// 🔒 ISOLATION LAYER: Set up a dedicated local directory pathway for Job Descriptions
const jobUploadDir = path.join(__dirname, "../upload/jds");


// Automatically ensure the directory exists so your application server doesn't crash
if (!fs.existsSync(jobUploadDir)) {
  fs.mkdirSync(jobUploadDir, { recursive: true });
}

// ⚙️ Configure diskStorage to safely persist uploaded document streams onto server storage
const jobStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, jobUploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `jd-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const uploadJobFile = multer({ 
  storage: jobStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Limit
});

// Configure upload engine parameters for Candidate Memory Streams (Resume Parsing)
const uploadMemoryStorage = multer.memoryStorage();
const uploadHandler = multer({ storage: uploadMemoryStorage });

// Initialize connection details for your Groq configuration instance
const client = new OpenAI({
    apiKey: process.env.GROQ_API_KEY,
    baseURL: "https://api.groq.com/openai/v1",
});

const emailTransporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SYSTEM_SMTP_EMAIL,
    pass: process.env.SYSTEM_SMTP_PASSWORD
  }
});

/* ==========================================================================
   ENDPOINT 1: PUBLISH & MANAGE CAREER ROSTER PACKETS
   ========================================================================== */
router.post('/jobs', uploadJobFile.single("jdPdf"), async (req, res) => {
  try {
    const { 
      title, 
      department, 
      location, 
      type, 
      experienceLevel, 
      description, 
      requirements,
      minSalary,
      maxSalary,
      currency,
      openingFrom, 
      openingTo    
    } = req.body;

    // Normalize experience level to match the strict database Schema Enum
    let cleanExperience = "Junior";
    if (experienceLevel) {
      if (experienceLevel.includes("Junior")) cleanExperience = "Junior";
      else if (experienceLevel.includes("Mid-level")) cleanExperience = "Mid-level";
      else if (experienceLevel.includes("Senior")) cleanExperience = "Senior";
      else if (experienceLevel.includes("Lead/Executive")) cleanExperience = "Lead/Executive";
    }

    const jdPdfUrl = req.file ? `/upload/jds/${req.file.filename}` : null;

    const freshJob = new Job({
      title: title || "Untitled Position",
      department: department || "General Engineering",
      location: location || "Remote",
      type: type || "Full-time",
      experienceLevel: cleanExperience,
      description: description || "No description provided.",
      requirements: Array.isArray(requirements) 
        ? requirements 
        : requirements ? requirements.split(",").map(item => item.trim()) : [],
      // Maps to old layout root level structure paths for legacy safety fallback support
      minSalary: minSalary ? Number(minSalary) : 0,
      maxSalary: maxSalary ? Number(maxSalary) : 0,
      currency: currency || "India (INR)",
      // Also updates the new nested schema block for modern careers frontend mapping views
      salaryRange: {
        min: minSalary ? Number(minSalary) : 0,
        max: maxSalary ? Number(maxSalary) : 0,
        currency: currency || "India (INR)"
      },
      openingFrom: openingFrom ? new Date(openingFrom) : undefined,
  openingTo: openingTo ? new Date(openingTo) : undefined,
  
  openingFromDate: openingFrom ? new Date(openingFrom) : undefined, // Legacy fallback
  openingToDate: openingTo ? new Date(openingTo) : undefined,
      jdPdfUrl: jdPdfUrl
    });

    await freshJob.save();
    return res.status(201).json({ success: true, job: freshJob });
  } catch (err) {
    console.error("❌ Error creating job inside recruitmentRoutes:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET: Fetch all job openings catalog items
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await Job.find({}).sort({ createdAt: -1 });
    return res.status(200).json(jobs || []);
  } catch (error) {
    console.error("❌ Error fetching jobs from MongoDB:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Internal Server Error loading job database catalog", 
      details: error.message 
    });
  }
});

/* ==========================================================================
   ENDPOINT 2: EXTERNAL PUBLIC CAREERS PAGE SUBMISSION APPLICATION
   ========================================================================== */
router.post('/candidates/apply-public', async (req, res) => {
  try {
    const { name, email, phone, jobId, jobTitle } = req.body;
    
    const applicant = new Candidate({
      name,
      email,
      phone,
      jobId,
      jobTitle,
      status: 'Applied',
      aiScore: 65 
    });

    await applicant.save();
    return res.status(201).json({ success: true, candidate: applicant });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   ENDPOINT 3: RECRUITER DIRECT UPLOAD DROPZONE (GROQ AI AUTOMATION PARSE)
   ========================================================================== */
// backend/src/routes/recruitmentRoutes.js (or recruitemnetroute.js)

// 📡 POST: BULK INTERNAL RESUME SCREENING & EXTRACTION ENGINE
// 📡 POST: BULK INTERNAL RESUME SCREENING & EXTRACTION ENGINE
router.post('/candidates/upload-direct', uploadHandler.array('resumes', 20), async (req, res) => {
  try {
    const { jobId } = req.body;
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No document files detected." });
    }

    let targetJobTitle = "General Pooling";
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) {
      const activeJob = await Job.findById(jobId);
      if (activeJob) targetJobTitle = activeJob.title;
    }

    // 🟢 HELPER: Creates a clean sleep interval delay
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const processedCandidates = [];
    const executionErrors = [];

    for (const file of req.files) {
      try {
        // 🟢 FIXED: Give the Groq API a 1.5-second breather before firing the next file request
        if (processedCandidates.length > 0) {
          await sleep(1500); 
        }

        const parsedPdfResult = await pdfParse(file.buffer);
        const rawResumeText = parsedPdfResult.text;

        const aiModelCompletion = await client.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [
            {
              role: "system",
              content: "You are an expert recruitment parser system tool. Your job is to extract applicant structural specifications from raw resume strings. You MUST return data strictly as a single, valid JSON object with keys: 'name', 'email', 'phone', and 'matchScoreOutof100'."
            },
            { role: "user", content: `Extract values from this text data block:\n\n${rawResumeText}` }
          ],
          response_format: { type: "json_object" }
        });

        let cleanJsonString = aiModelCompletion.choices[0].message.content.trim();
        if (cleanJsonString.startsWith("```")) {
          cleanJsonString = cleanJsonString.replace(/^```json/, "").replace(/```$/, "").trim();
        }

        const extractedData = JSON.parse(cleanJsonString);

        const automatedCandidate = new Candidate({
          name: extractedData.name || file.originalname.replace(".pdf", ""),
          email: extractedData.email || "unresolved_email@company.com",
          phone: extractedData.phone || "",
          jobId: jobId || null,
          jobTitle: targetJobTitle,
          status: 'Shortlisted', 
          aiScore: extractedData.matchScoreOutof100 ? (extractedData.matchScoreOutof100 / 10) : 7.5
});
      

        await automatedCandidate.save();
        processedCandidates.push(automatedCandidate);
      } catch (fileErr) {
        console.error(`Failed parsing individual asset file node ${file.originalname}:`, fileErr);
        executionErrors.push({ file: file.originalname, message: fileErr.message });
      }
    }

    return res.status(201).json({ 
      success: true, 
      count: processedCandidates.length,
      candidates: processedCandidates,
      errors: executionErrors 
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Internal server extraction processing breakdown." });
  }
});

/* ==========================================================================
   ENDPOINT 4: CANDIDATE STATUS MATRIX UPDATE & TELEMETRY AGGREGATION
   ========================================================================== */
router.put('/candidates/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const candidate = await Candidate.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!candidate) {
      return res.status(404).json({ success: false, message: "Applicant footprint missing." });
    }
    return res.json({ success: true, candidate });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/candidates/analytics', async (req, res) => {
  try {
    const totalCandidates = await Candidate.countDocuments();
    const allCandidates = await Candidate.find({}, "status");
    
    const statusDistribution = allCandidates.reduce((acc, curr) => {
      const st = curr.status || "Applied";
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      totalCandidates,
      statusDistribution
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   ENDPOINT 5: DYNAMIC ASSESSMENT COMMUNICATIONS & SCHEDULING SYSTEM
   ========================================================================== */
router.post('/interviews/schedule', async (req, res) => {
  try {
    const { candidateId, name, email, jobId, type, interviewDetails } = req.body;

    const resolvedName = name || req.body.candidateName;
    const resolvedEmail = email || req.body.candidateEmail;
    
    const executionMode = req.body.mode || (type === "Human" ? "live" : "ai");
    const targetDateStamp = interviewDetails?.date || req.body.date || new Date();

    const applicantProfile = await Candidate.findById(candidateId);
    if (!applicantProfile) {
      return res.status(404).json({ success: false, message: "Applicant profile match failed." });
    }

    applicantProfile.status = executionMode === 'ai' ? "Screening" : "Interviewing";
    if (!applicantProfile.interviewDetails) {
      applicantProfile.interviewDetails = {};
    }
    applicantProfile.interviewDetails.mode = executionMode;
    applicantProfile.interviewDetails.date = new Date(targetDateStamp);
    applicantProfile.interviewDetails.type = interviewDetails?.type || type || "General Evaluation";

    const parts = String(targetDateStamp).split("T");
    const interviewDate = parts[0];
    const interviewTime = parts[1] ? parts[1].slice(0, 5) : "12:00";

    const newInterview = new Interview({
      candidateId,
      candidateName: resolvedName || applicantProfile.name,
      candidateEmail: resolvedEmail || applicantProfile.email,
      name: resolvedName || applicantProfile.name,
      email: resolvedEmail || applicantProfile.email,
      jobId: jobId || applicantProfile.jobId || null,
      type: executionMode === 'ai' ? "AI" : "Human",
      status: "Scheduled",
      date: interviewDate,
      time: interviewTime,
      interviewer: executionMode === 'ai' ? "Ava (AI Node)" : "Technical Panel",
      interviewDetails: {
        date: String(targetDateStamp),
        type: interviewDetails?.type || type || "Technical Round",
        link: interviewDetails?.link || req.body.link || "",
        aiParameters: interviewDetails?.aiParameters || {
          roleTier: "Mid-Level",
          questionCount: 5,
          strictProctoring: true
        }
      }
    });

    await newInterview.save();

    const evaluationUrl = executionMode === 'ai' 
      ? `http://localhost:3000/interview/session/${newInterview._id}` 
      : (interviewDetails?.link || req.body.link || "https://meet.google.com");

    applicantProfile.interviewDetails.link = evaluationUrl;
    await applicantProfile.save();

    const messagingPayload = {
      from: process.env.SYSTEM_SMTP_EMAIL,
      to: applicantProfile.email,
      subject: `Interview Slot Reserved: ${interviewDetails?.type || type || 'Technical'} - Workforce Hub Operations`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #334155;">
          <h2 style="color: #4f46e5;">Hello ${applicantProfile.name},</h2>
          <p>Your assessment evaluation phase configurations have updated successfully for the <strong>${applicantProfile.jobTitle}</strong> opening.</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 12px; margin: 20px 0;">
            <p style="margin: 0 0 8px 0;"><strong>Assessment Track Type:</strong> ${executionMode === 'ai' ? '🤖 Automated AI Voice Assessment Screening' : '👥 Human Live Video Call'}</p>
            <p style="margin: 0 0 8px 0;"><strong>Evaluation Phase:</strong> ${interviewDetails?.type || type || 'Core Assessment'}</p>
            <p style="margin: 0;"><strong>Slot Time Window:</strong> ${new Date(targetDateStamp).toLocaleString()}</p>
          </div>
          <p>Please launch and interact with your specified gateway environment using the configuration link below:</p>
          <a href="${evaluationUrl}" style="display: inline-block; padding: 12px 24px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 10px;">Launch Evaluation Session</a>
          <p style="font-size: 11px; color: #94a3b8; margin-top: 30px;">This file transmission pipeline confirmation was automatically dispatched via your platform portal network nodes.</p>
        </div>
      `
    };

    await emailTransporter.sendMail(messagingPayload);
    return res.status(200).json({ success: true, candidate: applicantProfile, interview: newInterview });

  } catch (error) {
    console.error("Communication channel engine breakdown:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/interviews/scheduled', async (req, res) => {
  try {
    const records = await Interview.find().sort({ createdAt: -1 });
    return res.status(200).json(records);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

/* ==========================================================================
   🤖 ENDPOINT: ADVANCED MATCH EVALUATION WITH INTEGRATED RULES MATRIX
   ========================================================================== */
   router.post('/candidates/:candidateId/evaluate-match', async (req, res) => {
    try {
      const { candidateId } = req.params;
  
      // 1. Fetch Candidate Profile Metadata
      const candidate = await Candidate.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({ success: false, message: "Candidate record not found." });
      }
  
      // 2. Fetch Associated Job Metadata
      const job = await Job.findById(candidate.jobId);
      if (!job) {
        return res.status(404).json({ success: false, message: "Associated job vacancy not found." });
      }
  
      // 3. Construct the Job Description evaluation string
      let jobDescriptionContent = `Job Title: ${job.title}\nDepartment: ${job.department}\nDescription: ${job.description}\nRequirements: ${
        Array.isArray(job.requirements) ? job.requirements.join(', ') : job.requirements
      }`;
  
      // If a JD PDF document path exists on your server, append its text layer as well
      if (job.jdPdfUrl) {
        // Adjusted path parsing mapping to safely locate files saved inside src/upload/jds
        const fullJdPath = path.join(__dirname, '..', job.jdPdfUrl);
        if (fs.existsSync(fullJdPath)) {
          const jdFileBuffer = fs.readFileSync(fullJdPath);
          const parsedJdPdf = await pdfParse(jdFileBuffer);
          jobDescriptionContent += `\n\n[Full JD Document Layer Content]:\n${parsedJdPdf.text}`;
        }
      }
  
      // 4. Extract Text Layer from Candidate Resume PDF
      let candidateResumeContent = "";
      if (candidate.resumeUrl) {
        const fullResumePath = path.join(__dirname, '..', candidate.resumeUrl);
        if (fs.existsSync(fullResumePath)) {
          const resumeFileBuffer = fs.readFileSync(fullResumePath);
          const parsedResumePdf = await pdfParse(resumeFileBuffer);
          candidateResumeContent = parsedResumePdf.text;
        } else {
          return res.status(400).json({ success: false, message: "Resume file buffer could not be resolved on storage disk." });
        }
      } else {
        return res.status(400).json({ success: false, message: "No resume document link bound to this candidate profile." });
      }
  
      // 5. Trigger the Groq AI Completion using instructions from your training file
      const aiCompletion = await client.chat.completions.create({
        model: "llama3-8b-8192",
        messages: [
          {
            role: "system",
            content: screeningRules.systemInstructionPersona // 🟢 Driven purely by your separate config file
          },
          {
            role: "user",
            content: `[TARGET EVALUATION JD SPECIFICATIONS]:\n${jobDescriptionContent}\n\n[APPLICANT RESUME TEXT STREAM]:\n${candidateResumeContent}`
          }
        ],
        response_format: { type: "json_object" }
      });
  
      // Parse Response
      const evaluationResults = JSON.parse(aiCompletion.choices[0].message.content);
  
      // 6. Persist the matching metrics and shortlisting decisions back onto your Candidate schema fields
      candidate.aiScore = evaluationResults.decimalScore; 
      
      // Automatically flag candidate status based on the AI shortlist evaluation parameters
      candidate.status = evaluationResults.shortlisted ? 'Shortlisted' : 'Rejected';
      
      // Fallback notes integration mapping
      candidate.recommendation = `${evaluationResults.projectAnalysis} Reason: ${evaluationResults.reasoning}`;
      
      await candidate.save();
  
      return res.status(200).json({
        success: true,
        score: evaluationResults.decimalScore,
        shortlisted: evaluationResults.shortlisted,
        projectAnalysis: evaluationResults.projectAnalysis,
        reasoning: evaluationResults.reasoning,
        status: candidate.status
      });
  
    } catch (err) {
      console.error("❌ Deep AI Evaluation operation failure:", err);
      return res.status(500).json({ success: false, message: err.message });
    }
  });

module.exports = router;