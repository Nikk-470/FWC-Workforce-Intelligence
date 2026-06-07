const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken"); 
const User = require("../models/User"); 
const bcrypt = require("bcryptjs"); // Used to handle encryption securely

// =========================================================
// 📡 1. POST OPERATION: Onboard/Register a new user & auto-assign ID
// Catches: POST /api/auth/register
// =========================================================
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, department, joiningDate } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: "A user profile with this email already exists." });
    }

    let deptPrefix = "EMP"; 
    if (department) {
      const parsedDept = department.trim().toLowerCase();
      if (parsedDept.includes("engineer")) {
        deptPrefix = "ENG";
      } else if (parsedDept.includes("product")) {
        deptPrefix = "PROD";
      } else if (parsedDept.includes("sales") || parsedDept.includes("market")) {
        deptPrefix = "SALE";
      } else if (parsedDept.includes("hr") || parsedDept.includes("recruit")) {
        deptPrefix = "HR";
      } else {
        deptPrefix = department.substring(0, 3).toUpperCase();
      }
    }

    const currentDeptCount = await User.countDocuments({ department });
    const sequenceString = String(currentDeptCount + 1).padStart(3, "0");
    const calculatedId = `${deptPrefix}${sequenceString}`;

    // Hash the password text string before committing to MongoDB!
    const salt = await bcrypt.genSalt(10);
    const securedPasswordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ 
      employee_id: calculatedId, 
      name, 
      email: email.toLowerCase(), 
      password: securedPasswordHash, 
      role, 
      department,
      joiningDate 
    });

    const token = jwt.sign(
      { 
        id: user._id, 
        _id: user._id,
        employee_id: user.employee_id, 
        role: user.role, 
        department: user.department,
        avatarUrl: user.avatarUrl || "" 
      },
      process.env.JWT_SECRET || "fallback_secret_key_123",
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      success: true,
      message: "Credentials generated and sequential workspace ID provisioned successfully!",
      token,
      user: {
        id: user._id,
        _id: user._id,
        employee_id: user.employee_id, // ✅ FIX: Added to registration tracking pipeline
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        joiningDate: user.joiningDate,
        avatarUrl: user.avatarUrl || ""
      }
    });

  } catch (error) {
    console.error("Backend Register Pipeline Engine Failure:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================
// 📡 2. POST OPERATION: Securely log in a corporate user (Dual-Validation Mode)
// Catches: POST /api/auth/login
// =========================================================
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Please provide both email and password parameters." });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password combination." });
    }

    // ⚙️ HYBRID DUAL-MODE PASSWORD CHECKING LOOP
    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await user.matchPassword(password);
    } else {
      isMatch = (password === user.password);
    }

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password combination." });
    }

    const token = jwt.sign(
      { 
        id: user._id, 
        _id: user._id,
        employee_id: user.employee_id, 
        name: user.name, 
        email: user.email,
        role: user.role,                          
        role_lowercase: user.role.toLowerCase(), 
        department: user.department,
        avatarUrl: user.avatarUrl || "" 
      },
      process.env.JWT_SECRET || "fallback_secret_key_123", 
      { expiresIn: "1d" } 
    );

    return res.status(200).json({
      success: true, 
      token,
      role: user.role, 
      user: {
        id: user._id,
        _id: user._id,
        employee_id: user.employee_id, // ✅ CRITICAL FIX: Explicitly passing down custom corporate identity string
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        team: user.team || "",
        phone: user.phone || "",          
        address: user.address || "",      
        avatarUrl: user.avatarUrl || "" 
      }
    });

  } catch (error) {
    console.error("Authentication engine compilation failure:", error);
    return res.status(500).json({ message: "Internal server error during login operation." });
  }
});

// =========================================================
// 📡 3. PUT OPERATION: Update individual employee profile details permanently in MongoDB
// Catches: PUT /api/auth/profile/update
// =========================================================
router.put("/profile/update", async (req, res) => {
  try {
    const { email, name, phone, address, avatarUrl } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: "User identity tracking email parameter is required." });
    }

    const updatedUser = await User.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { 
        $set: { 
          name, 
          phone, 
          address, 
          avatarUrl 
        } 
      },
      { returnDocument: 'after' }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User profile record not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Database entry updated successfully!",
      user: {
        _id: updatedUser._id,
        employee_id: updatedUser.employee_id, // ✅ FIX: Ensured stability across profile re-writes
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        department: updatedUser.department,
        team: updatedUser.team || "",
        phone: updatedUser.phone || "",
        address: updatedUser.address || "",
        avatarUrl: updatedUser.avatarUrl || ""
      }
    });

  } catch (error) {
    console.error("Database Profile Write Connection Failure:", error);
    return res.status(500).json({ success: false, message: "Internal Server Error during profile save." });
  }
});

module.exports = router;