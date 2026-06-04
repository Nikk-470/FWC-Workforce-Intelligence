const express = require("express");
const router = express.Router();
const User = require("../models/User");

// 📡 READ OPERATION: Fetch all employees from MongoDB
router.get("/", async (req, res) => {
  try {
    // 🔓 WIDE OPEN: Pull every single user account to check what's inside
    const users = await User.find({}).select("-password");
    
    // 🖥️ THIS IS CRITICAL: Look at your Node terminal window when you load the page!
    console.log("👉 DATABASE CURRENT ENTRIES:", JSON.stringify(users, null, 2));
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;