const mongoose = require("mongoose");

const employeeSchema = new mongoose.Schema({
  // 1. Your original employee tracking fields
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true
  },

  // 👥 2. Added: Tracks which custom team this employee belongs to
  team: { 
    type: String, 
    default: "" // Starts empty until you click "Add Member" on the dashboard
  },
  
  // 🔒 3. Added: Safe multi-manager isolation field
  managerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", // Links this employee to the specific manager account currently logged in
    required: true 
  }
});

module.exports = mongoose.model("Employee", employeeSchema);