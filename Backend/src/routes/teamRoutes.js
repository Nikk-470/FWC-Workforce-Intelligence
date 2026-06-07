const express = require("express");
const router = express.Router();
// Make sure you have created your Team model, or adjust the path below if needed
const Team = require("../models/Team"); 

// 📡 1. GET: Fetch isolated teams that belong ONLY to this logged-in manager
// Matches: GET http://localhost:5000/api/teams?managerId=...
// GET /api/teams
router.get("/", async (req, res) => {
    try {
      const { managerId } = req.query;
      
      let filter = {};
      if (managerId) {
        // 🔥 THE FIX: Map managerId from frontend to 'createdBy' in your MongoDB document schema
        filter = { createdBy: managerId };
      }
  
      const teams = await Team.find(filter);
      
      return res.status(200).json({ 
        success: true, 
        teams 
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  });

// 📡 2. POST: Create a team tied specifically to this manager
// Matches: POST http://localhost:5000/api/teams
router.post("/", async (req, res) => {
  try {
    const { name, managerId } = req.body;

    if (!name || !managerId) {
      return res.status(400).json({ success: false, message: "Missing team name or manager ID." });
    }

    const exists = await Team.findOne({ name: name.trim(), createdBy: managerId });
    if (exists) {
      return res.status(400).json({ success: false, message: "You already created a team with this name!" });
    }

    const newTeam = await Team.create({
      name: name.trim(),
      createdBy: managerId
    });

    return res.status(201).json({ success: true, teamName: newTeam.name });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;