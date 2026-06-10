const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Candidate = require("../models/Candidate");
const nodemailer = require("nodemailer");
const Interview = require("../models/Interview"); 
const { OpenAI } = require("openai"); // 🟢 Added for Groq Live Chat connection

// 🟢 Decoupled Configuration Import
const aiInterviewRules = require("../config/aiInterviewRules");

// 🟢 Initialize OpenAI Proxy Client targeting Groq APIs
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1"
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// =========================================================
// ⚡ NEW ENDPOINT: POST /api/interviews/chat
// Handles real-time Groq low-latency dialogue logic
// =========================================================
router.post("/chat", async (req, res) => {
  try {
    const { chatHistory, candidateName } = req.body;

    // 1. Inject the prompt text from your decoupled config file
    const systemPrompt = {
      role: "system",
      content: `${aiInterviewRules.systemInstructionPersona} (The current candidate's name is ${candidateName})`
    };

    // 2. Convert the frontend chat logs into standard OpenAI client role structures
    const formattedMessages = chatHistory.map(msg => ({
      role: msg.speaker.includes("Candidate") ? "user" : "assistant",
      content: msg.text
    }));

    // Seed an initial greeting trigger if this is a new session handshake
    if (formattedMessages.length === 0) {
      formattedMessages.push({
        role: "user",
        content: "Hello, I have passed the hardware check and am ready to begin my evaluation."
      });
    }

    // 3. Request low-latency completion stream directly from Groq
    const completion = await openai.chat.completions.create({
      messages: [systemPrompt, ...formattedMessages],
      model: aiInterviewRules.modelTarget, 
      temperature: aiInterviewRules.temperature,
      max_completion_tokens: aiInterviewRules.maxTokens,
    });

    const aiReply = completion.choices[0].message.content;
    
    // 4. Verify if the system context hit its hard closure rule phrase
    const isComplete = aiReply.toLowerCase().includes("gathered all necessary parameters");

    res.json({
      reply: aiReply,
      isComplete: isComplete
    });

  } catch (error) {
    console.error("🔥 GROQ CORE CHAT ROUTER ERROR:", error);
    res.status(500).json({ error: "Failed to process live dialogue metrics." });
  }
});

// =========================================================
// ⚡ ORIGINAL ENDPOINT: POST /api/interviews/schedule
// =========================================================
router.post("/schedule", async (req, res) => {
  try {
    const { candidateId, name, email, interviewDetails, mode, time, difficulty, duration, focusSkills, jobId } = req.body;
    const { date, type, link } = interviewDetails || {};

    if (!email) {
      return res.status(400).json({ success: false, message: "Candidate email string is required." });
    }
    if (!candidateId) {
      return res.status(400).json({ success: false, message: "Missing candidateId tracker token." });
    }
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ success: false, message: "Invalid hex string candidateId structure format." });
    }

    const existingInterview = await Interview.findOne({ candidateId });

    let finalMeetingLink = link;
    if (!finalMeetingLink || finalMeetingLink.trim() === "") {
      finalMeetingLink = existingInterview 
        ? existingInterview.interviewDetails?.link 
        : (mode === "ai" ? `http://localhost:5173/interview/session/${candidateId}` : "https://meet.google.com/mock-id");
    }

    let dateIsoString = new Date().toISOString();
    if (date) {
      const rawDateStr = date.includes("T") ? date.split("T")[0] : date;
      const rawTimeStr = time || (date.includes("T") ? date.split("T")[1] : "10:00");
      dateIsoString = new Date(`${rawDateStr}T${rawTimeStr}`).toISOString();
    } else if (existingInterview) {
      dateIsoString = existingInterview.interviewDetails?.date || new Date().toISOString();
    }

    const targetSummary = mode === "ai"
      ? `Awaiting automated AI screening session. [Track: ${difficulty || "Mid-Level"} | Duration: ${duration || "15 Mins"}]`
      : "N/A - Live Selection Track";

    let interviewDoc;
    if (existingInterview) {
      existingInterview.name = name || existingInterview.name;
      existingInterview.email = email || existingInterview.email;
      existingInterview.type = mode === "ai" ? "AI" : "Human";
      existingInterview.jobId = jobId || existingInterview.jobId;
      existingInterview.status = "Scheduled";
      
      if (!existingInterview.interviewDetails) {
        existingInterview.interviewDetails = {};
      }
      existingInterview.interviewDetails.date = dateIsoString;
      existingInterview.interviewDetails.type = type || "Technical Round";
      existingInterview.interviewDetails.link = finalMeetingLink;
      
      interviewDoc = await existingInterview.save();
    } else {
      interviewDoc = new Interview({
        candidateId,
        name,
        email,
        type: mode === "ai" ? "AI" : "Human",
        jobId: jobId || null,
        status: "Scheduled",
        interviewDetails: {
          date: dateIsoString,
          type: type || "Technical Round",
          link: finalMeetingLink
        }
      });
      await interviewDoc.save();
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          status: "Interview Scheduled",
          "interviewDetails.mode": mode || "live",
          "interviewDetails.date": new Date(dateIsoString),
          "interviewDetails.type": type || "Technical Round",
          "interviewDetails.link": finalMeetingLink,
          "interviewDetails.aiFeedback.summaryAssessment": targetSummary
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ success: false, message: "Target candidate profile record not found." });
    }

    console.log(`✅ Interview committed successfully for candidate: ${updatedCandidate.name}`);

    const rawDate = new Date(dateIsoString);
    const formattedDate = rawDate.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    const formattedTime = rawDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const htmlEmailTemplate = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <h2 style="color: #4f46e5; margin-bottom: 4px;">Hello ${name || updatedCandidate.name},</h2>
        <p style="color: #475569; font-size: 14px; margin-bottom: 24px;">Your upcoming interview schedule has been updated.</p>
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 20px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr style="height: 32px;"><td style="width: 120px; font-weight: bold; color: #1e293b;">Round Type:</td><td>${type || "Technical Round"}</td></tr>
            <tr style="height: 32px;"><td style="font-weight: bold; color: #1e293b;">Date & Time:</td><td>${formattedDate} at ${formattedTime}</td></tr>
            <tr style="height: 32px;"><td style="font-weight: bold; color: #1e293b;">Format:</td><td>Online Video Conference</td></tr>
          </table>
        </div>
        <div style="text-align: center; margin-bottom: 32px;">
          <a href="${finalMeetingLink}" target="_blank" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: bold; padding: 12px 32px; border-radius: 12px; display: inline-block;">
            Join Video Interview
          </a>
        </div>
        <p style="color: #94a3b8; font-size: 12px;">Best regards,<br />FWC Workforce Intelligence HR Team</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"FWC Workforce Intelligence" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: existingInterview ? "UPDATED: Interview Schedule Confirmation" : "Interview Schedule Confirmation",
      html: htmlEmailTemplate,
    });

    return res.status(200).json({ 
      success: true, 
      message: "Database synchronization completed cleanly.",
      candidate: updatedCandidate,
      interview: interviewDoc
    });

  } catch (error) {
    console.error("🔥 SCHEDULER DISPATCH PIPELINE ERROR CAUGHT:", error);
    return res.status(500).json({ success: false, message: "Failed to process interview pipeline scheduling parameters.", error: error.message });
  }
});

// =========================================================
// ⚡ ORIGINAL ENDPOINT: POST /api/interviews/evaluate
// =========================================================
router.post("/evaluate", async (req, res) => {
  try {
    const { candidateId, aiFeedback } = req.body;

    if (!candidateId) {
      return res.status(400).json({ success: false, message: "Missing candidateId tracking token." });
    }
    if (!mongoose.Types.ObjectId.isValid(candidateId)) {
      return res.status(400).json({ success: false, message: "Invalid hex string candidateId structure format." });
    }
    if (!aiFeedback) {
      return res.status(400).json({ success: false, message: "Missing evaluation metrics payload data." });
    }

    const updatedInterview = await Interview.findOneAndUpdate(
      { candidateId },
      {
        $set: {
          status: "Completed",
          aiFeedback: {
            overallScore: aiFeedback.overallScore,
            technicalProficiency: aiFeedback.technicalProficiency,
            communicationClarity: aiFeedback.communicationClarity,
            problemSolving: aiFeedback.problemSolving,
            domainKnowledge: aiFeedback.domainKnowledge,
            culturalFit: aiFeedback.culturalFit,
            summaryAssessment: aiFeedback.summaryAssessment,
            feedbackMatrix: {
              positives: aiFeedback.feedbackMatrix?.positives || [],
              negatives: aiFeedback.feedbackMatrix?.negatives || []
            },
            transcriptSummary: aiFeedback.transcriptSummary || []
          }
        }
      },
      { new: true }
    );

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      candidateId,
      {
        $set: {
          status: "Interview Completed",
          "interviewDetails.aiFeedback.summaryAssessment": aiFeedback.summaryAssessment
        }
      },
      { new: true, runValidators: false }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ success: false, message: "Target candidate profile record not found during data sync." });
    }

    console.log(`📊 AI Assessment indexed successfully for candidate: ${updatedCandidate.name}`);

    return res.status(200).json({
      success: true,
      message: "AI metrics pipeline logs processed and synchronization completed cleanly.",
      interview: updatedInterview,
      candidate: updatedCandidate
    });

  } catch (error) {
    console.error("🚨 CRITICAL EVALUATION PROCESSING PIPE BREAKDOWN:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Internal evaluation pipeline routing failure.", 
      error: error.message 
    });
  }
});

module.exports = router;