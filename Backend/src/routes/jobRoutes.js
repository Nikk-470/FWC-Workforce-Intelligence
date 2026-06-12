const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Candidate = require("../models/Candidate");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const cloudinary = require("cloudinary").v2;

// 🔒 ISOLATION LAYER: Define a dedicated subfolder just for Job Descriptions inside your src layout
const jobUploadDir = path.join(__dirname, "../upload/jds");

// Automatically ensure the 'jds' subdirectory exists so your server doesn't crash during initialization
if (!fs.existsSync(jobUploadDir)) {
  fs.mkdirSync(jobUploadDir, { recursive: true });
}

// ⚙️ Configure diskStorage to persist uploaded document streams safely onto the server storage track
const jobStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, jobUploadDir); // Save exclusively inside backend/src/upload/jds
  },
  filename: (req, file, cb) => {
    // Preserves uniqueness while keeping the safe file format suffix intact
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `jd-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

// Optional strict filter constraint to ensure file input validations match standard PDF formats
const jobFileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF documents are allowed for Job Descriptions!"), false);
  }
};

const upload = multer({ 
  storage: jobStorage,
  fileFilter: jobFileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB Upload Guard Threshold
});

// 1️⃣ POST: Create a new job opening (Updated to write path URLs and capture timestamps)
router.post("/", upload.single("jdPdf"), async (req, res) => {
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
      openingFrom, // 💾 Captures scheduling form date string
      openingTo    // 💾 Captures deadline form date string
    } = req.body;

    // Normalize experience level to match the strict database Schema Enum
    let cleanExperience = "Junior";
    if (experienceLevel) {
      if (experienceLevel.includes("Junior")) cleanExperience = "Junior";
      else if (experienceLevel.includes("Mid-level")) cleanExperience = "Mid-level";
      else if (experienceLevel.includes("Senior")) cleanExperience = "Senior";
      else if (experienceLevel.includes("Lead/Executive")) cleanExperience = "Lead/Executive";
    }

    // Capture the static server asset endpoint string if a document payload is attached
    let jdPdfUrl = null;



    const newJob = new Job({
      title,
      department,
      location,
      type,
      experienceLevel: cleanExperience,
      description,
      requirements: Array.isArray(requirements) 
        ? requirements 
        : requirements ? requirements.split(",").map(item => item.trim()) : [],
      salaryRange: {
        min: minSalary ? Number(minSalary) : 0,
        max: maxSalary ? Number(maxSalary) : 0,
        currency: currency || "USD"
      },
      // 💾 Map added date and path updates explicitly to your schema rules
      openingFrom: openingFrom ? new Date(openingFrom) : undefined,
      openingTo: openingTo ? new Date(openingTo) : undefined,
      jdPdfUrl: jdPdfUrl
    });

    const savedJob = await newJob.save();
    res.status(201).json(savedJob);
  } catch (error) {
    console.error("❌ Error creating job:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2️⃣ GET: Fetch all jobs (with real-time applicant counts calculated)
router.get("/", async (req, res) => {
  try {
    const jobs = await Job.find().sort({ createdAt: -1 });
    
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await Candidate.countDocuments({ jobId: job._id });
        
        if (job.applicationsCount !== count) {
          job.applicationsCount = count;
          await job.save();
        }
        
        return job;
      })
    );

    res.status(200).json(jobsWithCounts);
  } catch (error) {
    console.error("❌ Error fetching jobs:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3️⃣ GET: Fetch a single job's details along with its associated candidates
router.get("/:id", async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ error: "Job opening not found" });
    }

    const candidates = await Candidate.find({ jobId: job._id })
      .select("name email score recommendation status interviewScheduled")
      .sort({ score: -1 });

    res.status(200).json({ job, candidates });
  } catch (error) {
    console.error("❌ Error fetching job profile details:", error);
    res.status(500).json({ error: error.message });
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
    
    res.status(200).json(updatedJob);
  } catch (error) {
    console.error("❌ Error updating job details:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;