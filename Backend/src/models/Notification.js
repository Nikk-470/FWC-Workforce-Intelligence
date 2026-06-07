const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    // Must be String type to match custom keys like "ENG002" safely
    recipientId: { type: String, required: true }, 
    message: { type: String, required: true },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", NotificationSchema);