const Leave = require("../models/Leave");

exports.requestLeave = async (req, res) => {
  try {
    const { employee_id, employee_name, leaveType, startDate, endDate, reason } = req.body;

    if (!employee_id || !startDate || !endDate || !reason.trim()) {
      return res.status(400).json({ success: false, message: "Missing required operational parameters." });
    }

    const newLeave = new Leave({
      employee_id,
      employee_name,
      leaveType,
      startDate,
      endDate,
      reason
    });

    await newLeave.save();

    return res.status(201).json({ 
      success: true, 
      message: "Leave submission successfully logged into the database queue!",
      leave: newLeave 
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};