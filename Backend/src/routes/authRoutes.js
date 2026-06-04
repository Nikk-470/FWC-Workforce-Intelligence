const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/authController");

// 🔑 LOGIN ROUTE -> POST http://localhost:5000/api/auth/login
router.post("/login", loginUser);

// 📝 REGISTER ROUTE -> POST http://localhost:5000/api/auth/register
router.post("/register", registerUser);

module.exports = router;