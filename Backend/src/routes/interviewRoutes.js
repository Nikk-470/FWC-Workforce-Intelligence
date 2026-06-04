const express = require("express");
const nodemailer = require("nodemailer");
const Candidate = require("../models/Candidate");

const router = express.Router();

// ⚙️ CONFIGURATION: Put your real email details here
const SENDER_EMAIL = "your-real-email@gmail.com"; // 👈 Your company or personal Gmail
const SENDER_PASSWORD = "abcd efgh ijkl mnop";    // 👈 Your 16-character Google App Password

// ✉️ Set up the real email transporter using Gmail
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS ,
  },
});

// Helper function to send the email to the candidate
const sendInterviewEmail = async (candidateEmail, candidateName, date, type, link, isReschedule = false) => {
  try {
    const formattedDate = new Date(date).toLocaleString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const mailOptions = {
      from: `"FWC Recruitment Team" <${SENDER_EMAIL}>`, // Shows your team name + your real email address
      to: candidateEmail,                            // Send directly to the candidate's real email
      subject: isReschedule 
        ? `🔄 UPDATED: Interview Rescheduled - ${type}`
        : `📅 Invitation to Interview: ${type} Round`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 16px;">
          <h2 style="color: #4f46e5;">Hello ${candidateName},</h2>
          <p>${isReschedule ? 'Your upcoming interview schedule has been updated.' : 'We are pleased to invite you for an interview sequence regarding your recent application.'}</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 12px; margin: 20px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px 0;"><strong>Round Type:</strong> ${type}</p>
            <p style="margin: 0 0 8px 0;"><strong>Date & Time:</strong> ${formattedDate}</p>
            <p style="margin: 0;"><strong>Format:</strong> Online Video Conference</p>
          </div>
          
          <p>Please click the button below to join the video channel punctually at your scheduled time:</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${link}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 10px; font-weight: 600; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
              Join Video Interview
            </a>
          </div>
          
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Best regards,<br/>Talent Acquisition Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`🚀 Real email sent successfully to ${candidateEmail} from ${SENDER_EMAIL}!`);
    return true;
  } catch (error) {
    console.error("❌ Failed to send real email via Nodemailer:", error);
    return false;
  }
};

// 1️⃣ POST: Schedule New Interview
router.post("/", async (req, res) => {
  try {
    const { candidateId, candidateName, candidateEmail, date, type, link } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        interviewScheduled: true,
        interviewDetails: { date, type, link }
      },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ error: "Candidate record not found" });
    }

    // Send the real email
    await sendInterviewEmail(candidateEmail, candidateName, date, type, link, false);

    res.status(201).json({ message: "Interview scheduled and real email dispatched!" });
  } catch (error) {
    console.error("Error scheduling:", error);
    res.status(500).json({ error: error.message });
  }
});

// 2️⃣ PUT: Reschedule / Update Existing Interview
router.put("/reschedule", async (req, res) => {
  try {
    const { candidateId, candidateName, candidateEmail, date, type, link } = req.body;

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        interviewScheduled: true,
        interviewDetails: { date, type, link }
      },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ error: "Candidate record not found" });
    }

    // Send the real update email
    await sendInterviewEmail(candidateEmail, candidateName, date, type, link, true);

    res.status(200).json({ message: "Interview rescheduled and update notice emailed!" });
  } catch (error) {
    console.error("Error rescheduling:", error);
    res.status(500).json({ error: error.message });
  }
});

// 3️⃣ GET: Fetch all scheduled interviews for the central page
router.get("/scheduled", async (req, res) => {
    try {
      // Find all candidates where interviewScheduled is true
      const scheduledCandidates = await Candidate.find({ interviewScheduled: true })
        .select("name email phone interviewDetails recommendation score")
        .sort({ "interviewDetails.date": 1 }); // Sort by closest date first
  
      res.status(200).json(scheduledCandidates);
    } catch (error) {
      console.error("Error fetching scheduled interviews:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // 4️⃣ PATCH: Update only the status of an interview
router.patch("/status/:id", async (req, res) => {
    try {
      const { status } = req.body; // Expecting "Scheduled", "Completed", or "Cancelled"
      
      if (!["Scheduled", "Completed", "Cancelled"].includes(status)) {
        return res.status(400).json({ error: "Invalid status value" });
      }
  
      const updatedCandidate = await Candidate.findByIdAndUpdate(
        req.params.id,
        { $set: { "interviewDetails.status": status } },
        { new: true }
      );
  
      if (!updatedCandidate) {
        return res.status(404).json({ error: "Candidate session not found" });
      }
  
      res.status(200).json({ message: `Status updated to ${status}!`, updatedCandidate });
    } catch (error) {
      console.error("Error updating status:", error);
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;