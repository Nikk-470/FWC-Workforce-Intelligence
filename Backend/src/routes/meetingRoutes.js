const express = require("express");
const router = express.Router();
const Meeting = require("../models/Meeting");
const Notification = require("../models/Notification");
const crypto = require("crypto");
const mongoose = require("mongoose");

// 📡 POST: Host / Schedule a native video meeting room
router.post("/create", async (req, res) => {
  try {
    const { title, type, scopeType, targetTeam, targetEmployeeId, hostManagerId, managerName, department, scheduledTime } = req.body;

    if (!title || !type || !scopeType || !hostManagerId) {
      return res.status(400).json({ success: false, message: "Missing required core parameters." });
    }

    if (!mongoose.Types.ObjectId.isValid(hostManagerId)) {
      return res.status(400).json({ success: false, message: "Invalid hostManagerId structure format." });
    }

    const uniqueRoomId = crypto.randomBytes(8).toString("hex"); 

    let empName = "";
    // 🟢 FIXED: Look inside the 'User' model registry instead of the blank Employee model
    const TargetUserModel = mongoose.models.User || mongoose.model("User");

    if (scopeType === "Individual" && targetEmployeeId) {
      const searchId = String(targetEmployeeId).trim();
      const isValidMongoId = mongoose.Types.ObjectId.isValid(searchId);
      const empQuery = isValidMongoId 
        ? { $or: [{ _id: searchId }, { employee_id: searchId }] } 
        : { employee_id: searchId };

      const emp = await TargetUserModel.findOne(empQuery);
      if (emp) empName = emp.name;
    }

    const meeting = await Meeting.create({
      title, type, scopeType, targetTeam, targetEmployeeId,
      targetEmployeeName: empName, hostManagerId, managerName, department,
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      roomId: uniqueRoomId,
      status: type === "Instant" ? "Active" : "Scheduled"
    });

    // 🔔 Real-time notification broadcast loop
    const messageAlert = type === "Instant"
      ? `🚨 Live Video Conference launched by ${managerName}: "${title}". Join room instantly.`
      : `📅 New Video Conference scheduled by ${managerName} for ${new Date(scheduledTime).toLocaleString()}`;

    if (scopeType === "Individual" && targetEmployeeId) {
      await Notification.create({ 
        recipientId: String(targetEmployeeId).trim(), 
        message: messageAlert,
        isRead: false
      });
    } else if (scopeType === "Team" && targetTeam) {
      // 🟢 FIXED: Grab team members from the main User collection matching task assignment logic
      const teamMembers = await TargetUserModel.find({ 
        team: { $regex: new RegExp("^" + targetTeam.trim() + "$", "i") } 
      });

      const notificationPromises = teamMembers.map(member => {
        const recipientIdentifier = member.employee_id || member._id;
        return Notification.create({
          recipientId: String(recipientIdentifier).trim(),
          message: `${messageAlert} [Cluster: ${targetTeam}]`,
          isRead: false
        });
      });
      await Promise.all(notificationPromises);
    }

    return res.status(201).json({ success: true, meeting });
  } catch (error) {
    console.error("🔥 Error caught in meeting deployment route:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 📡 GET: Fetch all active/scheduled rooms matching an employee profile context
router.get("/employee/:empId", async (req, res) => {
  try {
    const searchId = String(req.params.empId).trim();
    const mongoose = require("mongoose");
    
    // 🟢 FIXED: Pull profile parameters out of User schema matching your task filter algorithms
    const TargetUserModel = mongoose.models.User || mongoose.model("User");
    const isValidMongoId = mongoose.Types.ObjectId.isValid(searchId);
    
    const userQuery = isValidMongoId 
      ? { $or: [{ employee_id: searchId }, { _id: searchId }] } 
      : { employee_id: searchId };

    const userProfile = await TargetUserModel.findOne(userQuery);
    const userTeam = userProfile ? userProfile.team : null;

    // 🟢 FIXED: Structural alignment tracking criteria matching your task assignment records
    const queryCriteria = [
      { targetEmployeeId: searchId }
    ];

    if (userProfile) {
      queryCriteria.push({ targetEmployeeId: String(userProfile._id) });
      if (userProfile.employee_id) {
        queryCriteria.push({ targetEmployeeId: userProfile.employee_id });
      }
    }

    if (userTeam) {
      queryCriteria.push({ 
        targetTeam: { $regex: new RegExp("^" + String(userTeam).trim() + "$", "i") }, 
        scopeType: "Team" 
      });
    }

    const activeRooms = await Meeting.find({
      status: { $in: ["Active", "Scheduled"] },
      $or: queryCriteria
    }).sort({ createdAt: -1 });

    return res.status(200).json({ success: true, meetings: activeRooms });
  } catch (error) {
    console.error("🔥 Error catching employee dynamic rooms:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// 📡 GET: Fetch rooms created by a specific manager identity
router.get("/manager/:managerId", async (req, res) => {
  try {
    const managerId = String(req.params.managerId).trim();

    if (!mongoose.Types.ObjectId.isValid(managerId)) {
      return res.status(400).json({ success: false, message: "Invalid manager identifier format structure." });
    }

    const managerRooms = await Meeting.find({ hostManagerId: managerId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, meetings: managerRooms });
  } catch (error) {
    console.error("🔥 Error tracking manager rooms:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;