const Candidate = require("../models/Candidate");

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
    // 1. Destructure jobId alongside your other fields
    const { name, email, phone, jobId, ...otherFields } = req.body;

    // 2. Add a guard check to make sure a job is attached
    if (!jobId) {
      return res.status(400).json({ error: "A candidate must be assigned to a specific job opening." });
    }

    // 3. Inject it into the new document payload
    const newCandidate = new Candidate({
      name,
      email,
      phone,
      jobId, // 💼 Links them together in MongoDB!
      ...otherFields
    });

    const savedCandidate = await newCandidate.save();
    res.status(201).json(savedCandidate);
  } catch (error) {
    console.error("❌ Error in createCandidate:", error);
    res.status(500).json({ error: error.message });
  }
};

// Make sure both are exported cleanly together:
module.exports = {
  getCandidates,
  createCandidate
};