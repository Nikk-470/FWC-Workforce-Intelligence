const mongoose = require("mongoose");

const MeetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["Instant", "Scheduled"], required: true },
    scopeType: { type: String, enum: ["Team", "Individual"], required: true },
    
    // Tracks specific team name string or individual employee string identity
    targetTeam: { type: String, default: "" },
    targetEmployeeId: { type: String, default: "" },
    targetEmployeeName: { type: String, default: "" },

    hostManagerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    managerName: { type: String, required: true },
    department: { type: String, required: true }, // For group isolation constraints

    status: { type: String, enum: ["Active", "Scheduled", "Completed"], default: "Active" },
    scheduledTime: { type: Date },
    roomId: { type: String, required: true, unique: true } // Unique code for WebRTC signaling
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", MeetingSchema);