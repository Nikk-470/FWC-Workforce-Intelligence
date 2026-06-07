    const mongoose = require("mongoose");

    const AttendanceSchema = new mongoose.Schema({
    employee_id: { type: String, required: true, index: true },
    employee_name: { type: String },
    dateString: { type: String, required: true }, // Format: "2026-07-08"
    status: { type: String, enum: ["Present", "Absent", "On Leave"], required: true },
    clockIn: { type: String, default: "--" },    // e.g., "08:58 AM"
    clockOut: { type: String, default: "--" }   // e.g., "05:45 PM"
    }, { timestamps: true });

    // Crucial: Ensures an employee can only have ONE row per day (prevents duplicate data bugs)
    AttendanceSchema.index({ employee_id: 1, dateString: 1 }, { unique: true });

    module.exports = mongoose.model("Attendance", AttendanceSchema);