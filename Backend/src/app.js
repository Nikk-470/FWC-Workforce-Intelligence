const express = require("express");
const cors = require("cors");
require("dotenv").config();


const interviewRoutes = require("./routes/interviewRoutes");
const jobRoutes = require("./routes/jobRoutes");



const aiRoutes = require("./routes/aiRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/interviews", interviewRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/auth", require("./routes/authRoutes"));

app.get("/", (req, res) => {
  res.send("FWC Backend Running");
});
const employeeRoutes = require(
  "./routes/employeeRoutes"
);
app.use(
  "/api/employees",
  employeeRoutes
);
const analyticsRoutes = require(
  "./routes/analyticsRoutes"
);
app.use(
  "/api/analytics",
  analyticsRoutes
);
const resumeRoutes =
require("./routes/resumeRoutes");
app.use(
  "/api/resume",
  resumeRoutes
);

app.use("/api/fwcai", aiRoutes);
const candidateRoutes =
require("./routes/candidateRoutes");
app.use(
  "/api/candidates",
  candidateRoutes
);

module.exports = app;