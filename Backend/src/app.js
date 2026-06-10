// backend/src/app.js
const express = require("express");
const http = require("http"); // 💡 FIXED: Moved to the top to prevent temporal initialization crashes
const { Server } = require("socket.io"); // 💡 FIXED: Grouped clean with HTTP imports
const cors = require("cors");
const path = require("path"); 
require("dotenv").config();

// 🟢 Force model schema registration in database memory first
require("./models/Interview");

// Mounted Router Modules
const interviewRoutes = require("./routes/interviewRoutes"); 
const aiRoutes = require("./routes/aiRoutes");
const authRoutes = require("./routes/authRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const taskRoutes = require("./routes/taskRoutes.js"); 
const attendanceRoutes = require("./routes/attendanceRoutes");
const leaveRoutes = require("./routes/leaveRoutes");
const payrollRoutes = require("./routes/payrollRoutes");
const recruitmentRoutes = require("./routes/recruitmentRoutes");
const meetingRoutes = require("./routes/meetingRoutes");
const teamRoutes = require("./routes/teamRoutes");

const app = express();

// ==========================================================================
// 🛡️ GLOBAL MIDDLEWARES (💡 FIXED: Must run first before ANY api routes are matched!)
// ==========================================================================
const allowedOrigins = [
  "http://localhost:5173",
  "https://fwc-workforce-intelligence.vercel.app",
  "https://fwc-workforce-intelligence-abv6gzpq3-nikk-470s-projects.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      origin === "http://localhost:5173" ||
      origin.includes("vercel.app")
    ) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
}));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// ==========================================================================
// 📂 STATIC ASSET GATEWAYS
// ==========================================================================
app.use("/upload", express.static(path.join(__dirname, "upload")));
app.use('/upload/jds', express.static(path.join(__dirname, 'upload', 'jds'))); 
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads'))); 

// Base Engine Health Verification Connection Check
app.get("/", (req, res) => {
  res.send("FWC Backend Engine Running Smoothly");
});

// ==========================================================================
// 📡 CORE HTTP WRAPPER & SOCKET.IO ENGINE SETUP
// ==========================================================================
const server = http.createServer(app); // 💡 FIXED: Safely created after app and http are fully loaded

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"]
  }
});

// 📡 WebRTC Live Signaling Channel Matrix Broadcast Channel Grid Loop
io.on("connection", (socket) => {
  console.log(`⚡ Connection Node Registered: ${socket.id}`);

  // When a user enters a conference channel room code
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-connected", socket.id);
  });

  // Relay WebRTC Session Descriptors (Offers/Answers) directly between peers
  socket.on("video-offer", ({ roomId, sdp }) => {
    socket.to(roomId).emit("incoming-offer", sdp);
  });

  socket.on("video-answer", ({ roomId, sdp }) => {
    socket.to(roomId).emit("incoming-answer", sdp);
  });

  // Relay Interactive Connectivity Establishment network configurations
  socket.on("ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("incoming-ice-candidate", candidate);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Connection Node Dropped: ${socket.id}`);
  });
});

// ==========================================================================
// 🚀 MOUNTED API ROUTING TRACKS
// ==========================================================================
app.use("/api/auth", authRoutes);
app.use("/api/employees", employeeRoutes); 
app.use("/api/analytics", analyticsRoutes);
app.use("/api/resume", resumeRoutes);
app.use("/api/fwcai", aiRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/payroll", payrollRoutes);

/* ==========================================================================
    🔄 HYBRID RECRUITMENT GATEWAY CORE (RE-ORDERED TO PREVENT HIJACKING)
   ========================================================================== */
// Specific sub-routes MUST sit at the top
app.use("/api/candidates", candidateRoutes);
app.use("/api/interviews", interviewRoutes);
app.use("/api/jobs", resumeRoutes); // Points to integrated job/resume mapping logic
app.use("/api/meetings", meetingRoutes);

// Generic catch-all prefixes sit at the bottom
app.use("/api", recruitmentRoutes);

// ==========================================================================
// 🚨 THE GLOBAL EXPRESS TRAP (Catches and prints any silent server errors)
// ==========================================================================
app.use((err, req, res, next) => {
  console.error("🔥 GLOBAL EXPRESS CRASH CAUGHT:", err.message);
  console.error(err.stack); 
  return res.status(500).json({ 
    success: false, 
    message: "A hidden backend error occurred.",
    error: err.message 
  });
});

// 💡 FIXED: Export the wrapped server instance so server.js executes with WebSockets active!
module.exports = server;