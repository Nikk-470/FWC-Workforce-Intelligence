const mongoose = require("mongoose");

const LeaveSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, index: true },
  employee_name: { type: String, required: true },
  leaveType: { type: String, required: true },
  daysRequested: { type: Number, required: true },
  singleDate: { type: String, default: null }, // Used if daysRequested === 1
  startDate: { type: String, default: null },  // Used if daysRequested > 1
  endDate: { type: String, default: null },    // Used if daysRequested > 1
  reason: { type: String, required: true },
  status: { 
    type: String, 
    enum: ["Pending", "Approved", "Rejected"], 
    default: "Pending" 
  }
}, { timestamps: true });

module.exports = mongoose.model("Leave", LeaveSchema);