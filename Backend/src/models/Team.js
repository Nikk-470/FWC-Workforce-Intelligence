const mongoose = require("mongoose");

const TeamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    // 🔑 The Ownership Link: Stores the unique database ID of the manager who made it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// This line ensures a single manager cannot create two teams with the exact same name
TeamSchema.index({ name: 1, createdBy: 1 }, { unique: true });

module.exports = mongoose.model("Team", TeamSchema);