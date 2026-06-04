const express = require("express");
const router = express.Router();
const Job = require("../models/Job");
const Candidate = require("../models/Candidate");

// 1️⃣ POST: Create a new job opening
router.post("/", async (req, res) => {
  try {
    const { title, department, location, type, experienceLevel, description, requirements, salaryRange } = req.body;

    const newJob = new Job({
      title,
      department,
      location,
      type,
      experienceLevel,
      description,
      requirements: Array.isArray(requirements) ? requirements : requirements.split(",").map(req => req.trim()),
      salaryRange
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
    
    // Dynamically fetch accurate candidate application numbers for each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const count = await Candidate.countDocuments({ jobId: job._id });
        
        // Update the cached count in the document if it changed
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

    // Find all candidates assigned specifically to this role
    const candidates = await Candidate.find({ jobId: job._id })
      .select("name email score recommendation status interviewScheduled")
      .sort({ score: -1 }); // Sort by highest AI score first

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