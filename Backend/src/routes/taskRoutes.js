const express = require("express");
const router = express.Router();
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const Employee = require("../models/Employee"); 

// 📡 GET: Fetch dynamic assignments for the active user dashboard interface
router.get("/my-tasks", async (req, res) => {
  try {
    let workerId = null;

    if (req.user && (req.user._id || req.user.id)) {
      workerId = req.user._id || req.user.id;
    } else if (req.query.empId) {
      workerId = req.query.empId;
    }

    if (!workerId) {
      return res.status(400).json({ success: false, message: "No employee identity parameter provided." });
    }

    const searchId = String(workerId).trim();
    const isCustomFormat = searchId.includes("-") || /[A-Za-z]/.test(searchId);
    let emp = null;

    if (isCustomFormat) {
      emp = await Employee.findOne({ employee_id: searchId });
    } else {
      try {
        emp = await Employee.findOne({
          $or: [{ _id: searchId }, { employee_id: searchId }]
        });
      } catch (err) {
        emp = await Employee.findOne({ employee_id: searchId });
      }
    }

    const activeTeam = emp ? emp.team : "Engineering";

    const dashboardTasks = await Task.find({
      $or: [
        { targetEmployeeId: searchId },
        { targetTeam: activeTeam, assignmentType: "Team" }
      ]
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, tasks: dashboardTasks });
  } catch (error) {
    console.error("Task Query Process Break: ", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 📡 POST: Assign New Task
router.post("/assign", async (req, res) => {
  try {
    const { title, description, priority, assignmentType, targetTeam, targetEmployeeId, managerId, managerName } = req.body;

    if (!title || !assignmentType || !managerId) {
      return res.status(400).json({ success: false, message: "Missing required core parameters." });
    }

    if (assignmentType === "Individual") {
        const searchId = String(targetEmployeeId).trim();
        const isCustomFormat = searchId.includes("-") || /[A-Za-z]/.test(searchId);
  
        let emp = null;
        if (isCustomFormat) {
          emp = await Employee.findOne({ employee_id: searchId });
        } else {
          emp = await Employee.findOne({ $or: [{ _id: searchId }, { employee_id: searchId }] });
        }
        
        if (!emp) return res.status(404).json({ success: false, message: "Target employee record not found." });
        
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        
        const task = await Task.create({
          title,
          description: description || "",
          priority: priority || "Medium",
          assignmentType,
          targetEmployeeId: searchId,
          targetEmployeeName: emp.name,
          assignedBy: managerId,
          managerName,
          assignedDateString: formattedDate,
          completionPercentage: 0
        });
  
      await Notification.create({
        recipientId: String(searchId).trim(),
        message: `New individual task assigned by ${managerName || "Management"}: "${title}"`,
        isRead: false
      });

      return res.status(201).json({ success: true, task });

    } else if (assignmentType === "Team") {
        if (!targetTeam) return res.status(400).json({ success: false, message: "Target team field is required." });
  
        const teamTask = await Task.create({
          title,
          description: description || "",
          priority: priority || "Medium",
          assignmentType,
          targetTeam,
          assignedBy: managerId,
          managerName
        });
  
        const mongoose = require("mongoose");
        const TargetUserModel = mongoose.models.User || mongoose.model("User");
        
        const teamMembers = await TargetUserModel.find({ 
          team: { $regex: new RegExp("^" + targetTeam.trim() + "$", "i") } 
        });
  
        console.log(`Backend tracking log: Found ${teamMembers.length} members for team: ${targetTeam}`);
  
        const notificationPromises = teamMembers.map(member => {
          const recipientIdentifier = member.employee_id || member._id;
          
          console.log(`Writing notification row to MongoDB targeting identity: ${recipientIdentifier}`);
  
          return Notification.create({
            recipientId: String(recipientIdentifier).trim(),
            message: `New team task assigned to [${targetTeam}] by ${managerName || "Management"}: "${title}"`,
            isRead: false
          });
        });
        
        await Promise.all(notificationPromises);
  
        return res.status(201).json({ success: true, task: teamTask });
      }
  } catch (error) {
    console.error("Task Assignment Pipeline Exception:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 📡 GET: Fetch all individual AND team tasks matching an employee profile context
// 📡 GET: Fetch all individual AND team tasks matching an employee profile context
// 📡 GET: Fetch all tasks for an employee (Matches Notification Logic Exactly)
// 📡 GET: Fetch all tasks for an employee
router.get("/employee/:empId", async (req, res) => {
    try {
      const searchId = String(req.params.empId).trim();
      
      const mongoose = require("mongoose");
      const TargetUserModel = mongoose.models.User || mongoose.model("User");
      
      // 1. THE FIX: Safely check if the searchId is a valid MongoDB ObjectId
      const isValidMongoId = mongoose.Types.ObjectId.isValid(searchId);
      
      // If it's a valid ID format, check both. Otherwise, ONLY check employee_id to prevent crashes.
      const userQuery = isValidMongoId 
        ? { $or: [{ employee_id: searchId }, { _id: searchId }] } 
        : { employee_id: searchId };
  
      const userProfile = await TargetUserModel.findOne(userQuery);
  
      // 2. Get their exact team from the database
      const userTeam = userProfile ? userProfile.team : null;
  
      // 3. Find tasks where the ID matches OR the Team matches
      const queryCriteria = [{ targetEmployeeId: searchId }];
      
      if (userTeam) {
        queryCriteria.push({ 
          targetTeam: { $regex: new RegExp("^" + String(userTeam).trim() + "$", "i") }, 
          assignmentType: "Team" 
        });
      }
  
      const dashboardTasks = await Task.find({ $or: queryCriteria }).sort({ createdAt: -1 });
  
      return res.status(200).json({ success: true, tasks: dashboardTasks });
    } catch (error) {
      console.error("Task Query Error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });
// 📡 PUT: Update task workflow progression status
router.put("/update-status/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id },
      { status: status },
      { new: true }
    );

    if (!updatedTask) return res.status(404).json({ success: false, message: "Task entry row was not found." });
    return res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 📡 PUT: Update completion percentage
router.put("/update-progress/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { percentage } = req.body;
    
    const numericProgress = Math.min(Math.max(parseInt(percentage) || 0, 0), 100);
    const calculatedStatus = numericProgress === 100 ? "Completed" : "In Progress";

    const updatedTask = await Task.findOneAndUpdate(
      { _id: id },
      { 
        completionPercentage: numericProgress,
        status: calculatedStatus
      },
      { returnDocument: 'after' } 
    );

    if (!updatedTask) return res.status(404).json({ success: false, message: "Task entry row was not found." });
    return res.status(200).json({ success: true, task: updatedTask });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 📡 GET: Fetch unread inbox alerts for employee bells
router.get("/notifications/:empId", async (req, res) => {
  try {
    const searchId = String(req.params.empId).trim();
    
    const mongoose = require("mongoose");
    const TargetUserModel = mongoose.models.User || mongoose.model("User");

    let fallbackId = searchId;
    if (mongoose.Types.ObjectId.isValid(searchId)) {
      const userProfile = await TargetUserModel.findById(searchId);
      if (userProfile && userProfile.employee_id) {
        fallbackId = userProfile.employee_id; 
      }
    }

    const unreadAlerts = await Notification.find({ 
      recipientId: { $in: [searchId, fallbackId] }, 
      isRead: { $ne: true } 
    }).sort({ createdAt: -1 });
    
    return res.status(200).json({ success: true, notifications: unreadAlerts });
  } catch (error) {
    console.error("Notification API Exception:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
// 🔄 PATCH: Update task progress status instantly from the employee portal
// 🔄 PATCH: Update task progress status and numerical percentage in MongoDB
router.patch("/:id/status", async (req, res) => {
    try {
      const taskId = req.params.id;
      const { status } = req.body; // Expects "0-25%", "25-50%", "50-75%", or "75-100%"
  
      // 1. Safety check to ensure the incoming data matches our options
      const validStatuses = ["0-25%", "25-50%", "50-75%", "75-100%"];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status range format." });
      }
  
      // 2. Map the text selection to a clear mathematical average for completionPercentage
      let numericPercent = 0;
      if (status === "25-50%") numericPercent = 35;
      if (status === "50-75%") numericPercent = 65;
      if (status === "75-100%") numericPercent = 100;
  
      // 3. Save everything directly to MongoDB
      const updatedTask = await Task.findByIdAndUpdate(
        taskId,
        { 
          status: status,                       // Saves the exact string ("25-50%")
          completionPercentage: numericPercent  // Saves the actual number (35)
        },
        { new: true, runValidators: true }      // returns updated doc & checks against schema
      );
  
      if (!updatedTask) {
        return res.status(404).json({ success: false, message: "Task not found." });
      }
  
      console.log(`MongoDB Saved -> Task [${taskId}] is now status: ${status} (${numericPercent}%)`);
      return res.status(200).json({ success: true, task: updatedTask });
    } catch (error) {
      console.error("Error saving task progress to MongoDB:", error);
      return res.status(500).json({ success: false, message: error.message });
    }
  });

module.exports = router;