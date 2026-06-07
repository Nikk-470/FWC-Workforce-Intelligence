const express = require("express");
const cors = require("cors");
const path = require("path"); 
require("dotenv").config();

const interviewRoutes = require("./routes/interviewRoutes");
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const taskRoutes = require("./routes/taskRoutes"); 
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const recruitmentRoutes = require("./routes/recruitmentRoutes");

const integratedJobAndResumeRoute = require("./routes/resumeRoutes"); 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Link team isolates router files
app.use("/api/teams", require("./routes/teamRoutes"));
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/interviews", interviewRoutes);

// ==========================================================================
// 📂 FIXED STATIC ASSET GATEWAYS (Based on app.js being inside src/)
// ==========================================================================
app.use("/upload", express.static(path.join(__dirname, "upload")));
app.use('/upload/jds', express.static(path.join(__dirname, 'upload', 'jds'))); 
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'))); 

app.use("/api/payroll", payrollRoutes);

// Base Health Check
app.get("/", (req, res) => {
  res.send("FWC Backend Running");
});

// Mounted API Routing Tracks
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes); 
app.use("/api/analytics", analyticsRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/fwcai", aiRoutes);
app.use("/api/tasks", taskRoutes);

/* ==========================================================================
   🔄 HYBRID RECRUITMENT GATEWAY CORE (RE-ORDERED TO PREVENT HIJACKING)
   ========================================================================== */
// 🟢 STEP 1: Specific sub-routes MUST sit at the top
app.use("/api/candidates", candidateRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/jobs", integratedJobAndResumeRoute);

// 🟢 STEP 2: Generic catch-all prefixes sit at the bottom
app.use("/api", recruitmentRoutes);

// ==========================================================================
// 🚨 THE GLOBAL EXPRESS TRAP (Catches and prints any silent server errors)
// ==========================================================================
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL EXPRESS CRASH CAUGHT:", err.message);
  console.error(err.stack); // This prints the exact file name and line number responsible
  return res.status(500).json({ 
    success: false, 
    message: "A hidden backend error occurred.",
    error: err.message 
  });
});

module.exports = app;