const express = require("express");
const router = express.Router();
const User = require("../models/User"); // 🔄 Reads from your main populated user database collection
const cloudinary = require("cloudinary").v2; // ☁️ Cloudinary SDK integration

// =========================================================
// ⚙️ CLOUDINARY CONFIGURATION DETECTORS
// =========================================================
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// =========================================================
// 📡 1. READ OPERATION: Fetch everyone to view on Roster & Dashboard boards
// Catches: GET /api/employees
// =========================================================
router.get("/", async (req, res) => {
  try {
    const corporateRoster = await User.find({ role: { $ne: "Admin" } }).select("-password");
    return res.status(200).json(corporateRoster);
  } catch (error) {
    console.error("Error pulling employee directory data:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================
// 📡 2. UPDATE OPERATION: Modify Team values safely on the User profile
// Catches: PUT /api/employees/:id
// =========================================================
router.put("/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    const { team } = req.body;

    let updatedRecord = null;

    if (targetId.match(/^[0-9a-fA-F]{24}$/)) {
      updatedRecord = await User.findByIdAndUpdate(
        targetId,
        { team: team },
        { new: true }
      );
    }

    if (!updatedRecord) {
      updatedRecord = await User.findOneAndUpdate(
        { employee_id: targetId },
        { team: team },
        { new: true }
      );
    }

    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: "No matching record located to assign to a cluster group." });
    }

    return res.status(200).json(updatedRecord);
  } catch (error) {
    console.error("Error writing cluster team value:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================
// 📡 3. DELETE OPERATION: Remove an employee record from the workspace roster
// Catches: DELETE /api/employees/:id
// =========================================================
router.delete("/:id", async (req, res) => {
  try {
    const targetId = req.params.id;
    let deletedRecord = null;

    if (targetId.match(/^[0-9a-fA-F]{24}$/)) {
      deletedRecord = await User.findByIdAndDelete(targetId);
    }

    if (!deletedRecord) {
      deletedRecord = await User.findOneAndDelete({ employee_id: targetId });
    }

    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: "No employee found with that identity criteria profile." });
    }

    return res.status(200).json({ success: true, message: "Employee profile removed successfully." });
  } catch (error) {
    console.error("Error purging roster asset record:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

// =========================================================
// 📡 4. CREATE OPERATION: Onboard New Employee with Profile Picture
// Catches: POST /api/employees/onboard
// =========================================================
router.post("/onboard", async (req, res) => {
  try {
    const { name, email, role, department, joiningDate, phone, address, avatarUrl, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "An infrastructure node with this email already exists." });
    }

    let secureImageUrl = "";
    if (avatarUrl) {
      const uploadResponse = await cloudinary.uploader.upload(avatarUrl, {
        folder: "employee_profiles",
      });
      secureImageUrl = uploadResponse.secure_url;
    }

    // Determine target password to save (clean cleartext format string)
    const passwordToProcess = password || Math.random().toString(36).slice(-8);

    // Dynamic sequential identity prefix generation logic
    let deptPrefix = "EMP";
    if (department) {
      const parsedDept = department.trim().toLowerCase();
      if (parsedDept.includes("engineer")) deptPrefix = "ENG";
      else if (parsedDept.includes("product")) deptPrefix = "PROD";
      else if (parsedDept.includes("sales") || parsedDept.includes("market")) deptPrefix = "SALE";
      else if (parsedDept.includes("hr") || parsedDept.includes("recruit")) deptPrefix = "HR";
    }
    const currentDeptCount = await User.countDocuments({ department });
    const sequenceString = String(currentDeptCount + 1).padStart(3, "0");
    const calculatedId = `${deptPrefix}${sequenceString}`;

    // ✅ FIXED: Passing plain text directly here allows User.js model schema's 
    // .pre("save") hook to hash this string perfectly exactly once!
    const newEmployee = new User({
      name,
      email: email.toLowerCase(),
      role,
      department,
      joiningDate,
      phone: phone || "",
      address: address || "",
      employee_id: calculatedId,
      password: passwordToProcess, 
      avatarUrl: secureImageUrl
    });

    await newEmployee.save();

    return res.status(201).json({
      success: true,
      employee: {
        _id: newEmployee._id,
        employee_id: newEmployee.employee_id,
        name: newEmployee.name,
        email: newEmployee.email,
        role: newEmployee.role,
        department: newEmployee.department,
        joiningDate: newEmployee.joiningDate,
        avatarUrl: newEmployee.avatarUrl
      },
      temporaryPassword: passwordToProcess // Returns clear plaintext password to look at inside front-end cards
    });

  } catch (error) {
    console.error("Error during backend onboarding cloud upload:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;