  const express = require("express");
  const router = express.Router();
  const Job = require("../models/Job"); 
  const Candidate = require("../models/Candidate");
  const multer = require("multer");
  const path = require("path");
  const fs = require("fs");

  // ==========================================
  // 📂 DIRECTORY GENERATION & ISOLATION LAYER
  // ==========================================

  // 🏢 Path 1: Job Descriptions Directory (Inside src layout)
  const jobUploadDir = path.join(__dirname, "../upload/jds");
  if (!fs.existsSync(jobUploadDir)) {
    fs.mkdirSync(jobUploadDir, { recursive: true });
  }

  // 📄 Path 2: Candidate Resumes Directory (Points to root 'uploads' folder)
  const resumeUploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(resumeUploadDir)) {
    fs.mkdirSync(resumeUploadDir, { recursive: true });
  }

  // ==========================================
  // ⚙️ MULTER STORAGE TRACK CONFIGURATIONS
  // ==========================================

  // 1. Storage Configuration for Job Descriptions
  const jobStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, jobUploadDir); 
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `jd-${uniqueSuffix}${path.extname(file.originalname)}`);
    },
  });

  // 2. Storage Configuration for Candidate Resumes (FIXES THE 500 ERROR)
  const resumeStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, resumeUploadDir); 
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
      cb(null, `resume-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
  });

  // PDF Filter Constraint
  const pdfFileFilter = (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF documents are allowed!"), false);
    }
  };

  // Multer Handlers Initializations
  const uploadJobJd = multer({ 
    storage: jobStorage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } 
  });

  const uploadCandidateResume = multer({
    storage: resumeStorage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB Limit for Candidate Resumes
  });


  // ==========================================
  // 🚀 ENDPOINTS / ROUTE HANDLING
  // ==========================================

  // 🟢 NEW ADDITION: Candidates application ingress pipeline
  router.post("/apply", uploadCandidateResume.single("resume"), async (req, res) => {
    try {
      console.log("Incoming Applicant Profile:", req.body);
      
      const { name, email, jobId, phone } = req.body;

      if (!name || !email || !jobId) {
        return res.status(400).json({ success: false, error: "Missing required fields (name, email, or jobId)" });
      }

      if (!req.file) {
        return res.status(400).json({ success: false, error: "Please attach your resume PDF file." });
      }

      // Save candidate schema document to MongoDB database
      const newCandidate = new Candidate({
        name,
        email,
        phone: phone || "",
        jobId,
        resumeUrl: `/uploads/${req.file.filename}`, // Serves clean layout file paths
        status: "Applied",
        score: 0 // Waiting for AI grading microservice loop execution
      });

      const savedCandidate = await newCandidate.save();

      // Increment corresponding position counter tracking
      await Job.findByIdAndUpdate(jobId, { $inc: { applicationsCount: 1 } });

      return res.status(201).json({ success: true, message: "Application processed perfectly!", data: savedCandidate });
    } catch (error) {
      console.error("❌ Critical server error during candidate application ingestion:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // 1️⃣ POST: Create a new job opening
  router.post("/", uploadJobJd.single("jdPdf"), async (req, res) => {
    try {
      console.log("Incoming Post Payload Matrix:", req.body);

      const title = req.body.title || req.body.positionTitle || "Untitled Position";
      const department = req.body.department || req.body.departmentNode || "General Engineering";
      const location = req.body.location || req.body.geographicLocation || "Remote";
      const type = req.body.type || req.body.jobType || "Full-time";
      const experienceLevel = req.body.experienceLevel || "Mid-level (2-5 years)";
      const description = req.body.description || req.body.shortContextDescriptionSummary || "No context description assigned.";
      const requirements = req.body.requirements || req.body.keyRequirements || "";
      const currency = req.body.currency || "INR";

      const rawSalary = req.body.fixedSalaryAmount || req.body.minSalary || 0;
      const minSalary = req.body.minSalary || rawSalary;
      const maxSalary = req.body.maxSalary || rawSalary;

      let cleanExperience = "Junior (0-2 years)";
      if (experienceLevel) {
        if (experienceLevel.includes("Entry") || experienceLevel.includes("Junior")) cleanExperience = "Junior (0-2 years)";
        if (experienceLevel.includes("Mid")) cleanExperience = "Mid-level (2-5 years)";
        if (experienceLevel.includes("Senior")) cleanExperience = "Senior (5+ years)";
      }

      const jdPdfUrl = req.file ? `/upload/jds/${req.file.filename}` : null;

      const newJob = new Job({
        title,
        department,
        location,
        type,
        experienceLevel: cleanExperience,
        description,
        requirements: requirements,
        salaryType: req.body.salaryStructure || "Fixed Amount",
        minSalary: Number(minSalary) || 0,
        maxSalary: Number(maxSalary) || 0,
        currency: currency,
        openingFrom: req.body.openingFrom ? new Date(req.body.openingFrom) : undefined,
        openingTo: req.body.openingTo ? new Date(req.body.openingTo) : undefined,
        jdPdfUrl: jdPdfUrl
      });

      const savedJob = await newJob.save();
      return res.status(201).json({ success: true, data: savedJob });
    } catch (error) {
      console.error("❌ Error creating job:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // 2️⃣ GET: Fetch all jobs
  router.get("/", async (req, res) => {
    try {
      const jobs = await Job.find({}).sort({ createdAt: -1 });
      
      const jobsWithCounts = await Promise.all(
        jobs.map(async (job) => {
          let count = 0;
          try {
            if (Candidate && typeof Candidate.countDocuments === 'function') {
              count = await Candidate.countDocuments({ jobId: job._id });
            }
          } catch (err) {
            console.warn("Candidate model count pass skipped:", err.message);
          }
          
          if (job.applicationsCount !== count) {
            job.applicationsCount = count;
            await job.save();
          }
          
          return job;
        })
      );

      return res.status(200).json(jobsWithCounts);
    } catch (error) {
      console.error("❌ Error fetching jobs:", error);
      return res.status(500).json({ success: false, error: error.message });
    }
  });

  // 3️⃣ GET: Fetch a single job's details
  router.get("/:id", async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) {
        return res.status(404).json({ error: "Job opening not found" });
      }

      let candidates = [];
      try {
        if (Candidate && typeof Candidate.find === 'function') {
          candidates = await Candidate.find({ jobId: job._id })
            .select("name email score recommendation status interviewScheduled")
            .sort({ score: -1 });
        }
      } catch (err) {
        console.warn("Candidates list resolution skipped:", err.message);
      }

      return res.status(200).json({ job, candidates });
    } catch (error) {
      console.error("❌ Error fetching job profile details:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  // 4️⃣ PUT: Update status or details of a job posting
  router.put("/:id", async (req, res) => {
    try {
      const updatedJob = await Job.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      );
      
      if (!updatedJob) {
        return res.status(404).json({ error: "Job opening not found" });
      }
      
      return res.status(200).json(updatedJob);
    } catch (error) {
      console.error("❌ Error updating job details:", error);
      return res.status(500).json({ error: error.message });
    }
  });

  module.exports = router;