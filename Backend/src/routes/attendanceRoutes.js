const express = require("express");
const router = express.Router();
const multer = require("multer");

// Import the controllers we created above
const { uploadCSV, punchAttendance, getEmployeeAttendance } = require("../controllers/attendanceController");

const upload = multer({ dest: "uploads/" });

// 📁 Admin uploads the daily snapshots csv
router.post("/upload-csv", upload.single("file"), uploadCSV);

// 🖱️ WFH Employee real-time buttons click punch
router.post("/punch", punchAttendance);

// 📡 Frontend visual grid map population hook
router.get("/employee/:empId", getEmployeeAttendance);

module.exports = router;