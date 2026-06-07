const User = require("../models/User");
const Employee = require("../models/Employee"); 
const jwt = require("jsonwebtoken"); 

// Generate JWT Token including the avatarUrl configuration within payloads
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatarUrl: user.avatarUrl || "" 
    }, 
    process.env.JWT_SECRET || "fallback_secret", 
    { expiresIn: "30d" }
  );
};

// 📝 1. REGISTER USER / PROVISION EMPLOYEE
const registerUser = async (req, res) => {
  try {
    const { employee_id, name, email, password, role, department, joiningDate, avatarUrl } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    if (employee_id) {
      const idExists = await User.findOne({ employee_id });
      if (idExists) {
        return res.status(400).json({ success: false, message: "This Employee ID is already assigned" });
      }
    }

    // ✅ FIXED: Removed manual bcrypt hashing block here.
    // Passing the password as clean, plain text allows your User.js model schema's 
    // .pre("save") hook to catch and hash it perfectly exactly once!
    const user = await User.create({ 
      employee_id, 
      name, 
      email: email.toLowerCase(), 
      password, // 👈 Clean raw string passed directly
      role, 
      department,
      joiningDate,
      avatarUrl: avatarUrl || ""
    });

    await Employee.create({
      employee_id,
      name,
      email: email.toLowerCase(),
      department,
      role,
      joiningDate,
      avatarUrl: avatarUrl || ""
    });

    res.status(201).json({
      success: true,
      _id: user._id,
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      joiningDate: user.joiningDate, 
      avatarUrl: user.avatarUrl || "",
      token: generateToken(user),
    });
  } catch (error) {
    console.error("Backend Registration Controller Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔑 2. LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📥 Login attempt for:", email);

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    // Hybrid password evaluator check loop logic integration block
    let isMatch = false;
    if (user.password.startsWith("$2a$") || user.password.startsWith("$2b$")) {
      isMatch = await user.matchPassword(password);
    } else {
      isMatch = (password === user.password);
    }

    if (isMatch) {
      res.json({
        success: true,
        token: generateToken(user),
        role: user.role,
        user: {
          _id: user._id,
          employee_id: user.employee_id,
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
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.error("Auth Controller Error Block:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { registerUser, loginUser };