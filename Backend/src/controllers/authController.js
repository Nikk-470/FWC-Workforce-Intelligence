const User = require("../models/User");
const jwt = require("jsonwebtoken"); // Ensure your JWT library is imported here

// 🪙 HELPER: Generate JWT Token (Adjust secret/expires if yours looks different)
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: "30d",
  });
};

// 📝 1. REGISTER USER / PROVISION EMPLOYEE
const registerUser = async (req, res) => {
  try {
    const { employee_id, name, email, password, role, department } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    if (employee_id) {
      const idExists = await User.findOne({ employee_id });
      if (idExists) {
        return res.status(400).json({ success: false, message: "This Employee ID is already assigned" });
      }
    }

    const user = await User.create({ 
      employee_id, 
      name, 
      email, 
      password, 
      role, 
      department 
    });

    res.status(201).json({
      success: true,
      _id: user._id,
      employee_id: user.employee_id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 🔑 2. LOGIN USER
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📥 Login attempt for:", email);

    const user = await User.findOne({ email });
    if (user && (await user.matchPassword(password))) {
      res.json({
        success: true,
        _id: user._id,
        employee_id: user.employee_id,
        name: user.name,
        email: user.email,
        role: user.role, 
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 📦 Export both so authRoutes.js can pick them up safely!
module.exports = { registerUser, loginUser };