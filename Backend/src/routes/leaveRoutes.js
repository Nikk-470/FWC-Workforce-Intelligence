const express = require("express");
const router = express.Router();
const Leave = require("../models/Leave"); // We'll make this model next!

// 🚀 PATH A: Submit a new Leave Request (Dispatched from Employee Dashboard)
router.post("/request", async (req, res) => {
  try {
    const { employee_id, employee_name, leaveType, daysRequested, singleDate, startDate, endDate, reason } = req.body;
    
    const newLeave = new Leave({
      employee_id,
      employee_name,
      leaveType,
      daysRequested,
      singleDate,
      startDate,
      endDate,
      reason,
      status: "Pending" // Automatically placed in Triage queue
    });

    await newLeave.save();
    return res.status(201).json({ success: true, message: "Leave ticket routed into triage queue successfully.", data: newLeave });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to persist leave document node.", error: err.message });
  }
});

// 🚀 PATH B: Fetch individual employee history logs (Loaded by Employee Dashboard)
router.get("/history/:empId", async (req, res) => {
  try {
    const history = await Leave.find({ employee_id: req.params.empId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: history });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to retrieve records from history collection.", error: err.message });
  }
});

// 🚀 PATH C: Fetch global active queues (Loaded by Senior Manager Dashboard)
router.get("/admin/queue", async (req, res) => {
  try {
    const activeQueue = await Leave.find().sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: activeQueue });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Database lookup failure in triage collection.", error: err.message });
  }
});

// 🚀 PATH D: Process an approval step (Executed when Manager clicks Grant or Decline)
router.patch("/admin/triage/:id", async (req, res) => {
  try {
    const { action } = req.body; // Action value maps directly to: "Approved" or "Rejected"
    
    if (!["Approved", "Rejected"].includes(action)) {
      return res.status(400).json({ success: false, message: "Invalid triage status amendment target parameter." });
    }

    const updatedLeave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status: action },
      { new: true }
    );

    return res.status(200).json({ success: true, message: `Leave state mutation applied to element: ${action}`, data: updatedLeave });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to commit state change onto operational index target.", error: err.message });
  }
});

module.exports = router;