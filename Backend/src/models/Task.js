const mongoose = require("mongoose");

const TaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priority: { type: String, enum: ["High", "Medium", "Low"], default: "Medium" },
    status: { type: String, enum: ["Todo", "In Progress", "Completed"], default: "Todo" },
    assignmentType: { type: String, enum: ["Team", "Individual"], required: true },
    status: { 
        type: String, 
        enum: ["Todo", "In Progress", "Completed", "0-25%", "25-50%", "50-75%", "75-100%"], 
        default: "0-25%" 
      },
      
    
    // 📊 PERFORMANCE TRACKER EXTENSIONS
    // Tracks progress calculations for manager auditing lines
    completionPercentage: { type: Number, min: 0, max: 100, default: 0 },
    // Simplifies grouping on the dashboard calendar view (e.g., "2026-06-06")
    assignedDateString: { type: String, default: "" },
    

    // 🎯 If assignmentType is "Team", this is populated
    targetTeam: { type: String, default: "" },
    
    // 🎯 UPDATED: Changed from ObjectId to String to safely accept custom string IDs like "EMP-2026-0894" without crashing
    targetEmployeeId: { type: String, default: "" },
    targetEmployeeName: { type: String, default: "" },
    
    // Keeps connection safely to creator context IDs or uses string fallbacks if managers use clean IDs
    assignedBy: { type: mongoose.Schema.Types.Mixed, required: true },
    managerName: { type: String, required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Task", TaskSchema);