const fs = require("fs");
const csv = require("csv-parser");
const Attendance = require("../models/Attendance");

// -------------------------------------------------------------------------
// 📁 PIPELINE A: ADMIN SNAPSHOT CSV PARSER UPLOADER (Mappings for final.csv)
// -------------------------------------------------------------------------
exports.uploadCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No CSV file provided." });
    }

    const results = [];

    // Stream and parse incoming hardware log file
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on("data", (row) => {
        // Extract column keys matching final.csv parameters exactly
        const empId = row.employee_id?.trim();
        const rawDate = row.date?.trim();
        const cIn = row.clock_in?.trim();
        const cOut = row.clock_out?.trim();

        // Calculate if the employee was Present or Absent based on your "N/A" strings
        let calculatedStatus = "Present";
        if (!cIn || cIn === "N/A" || !cOut || cOut === "N/A") {
          calculatedStatus = "Absent";
        }

        if (empId && rawDate) {
          results.push({
            employee_id: empId,
            dateString: rawDate, // Formatted clean text string: "2026-07-08"
            status: calculatedStatus,
            clockIn: calculatedStatus === "Absent" ? "--" : cIn,
            clockOut: calculatedStatus === "Absent" ? "--" : cOut
          });
        }
      })
      .on("end", async () => {
        let processedCount = 0;
        
        for (const record of results) {
          if (!record.employee_id || !record.dateString) continue;

          // Compound upsert criteria ensures rows are updated or newly registered cleanly
          await Attendance.updateOne(
            { employee_id: record.employee_id, dateString: record.dateString },
            { $set: record },
            { upsert: true }
          );
          processedCount++;
        }
        
        // Clean up transient garbage logs from server memory storage folder
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        
        return res.status(200).json({ 
          success: true, 
          message: `Successfully synced ${processedCount} biometric rows from final.csv.` 
        });
      });
  } catch (error) {
    // Structural safety fallback to ensure temporary upload files are unlinked
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------------------
// 🖱️ PIPELINE B: WFH REAL-TIME CLICK PUNCH SYSTEM
// -------------------------------------------------------------------------
exports.punchAttendance = async (req, res) => {
  try {
    const { employee_id, employee_name } = req.body;
    
    // Generate clean ISO layout date string keys and standard readable timestamps
    const todayStr = new Date().toISOString().split('T')[0]; // "2026-07-08"
    const timeStr = new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

    let log = await Attendance.findOne({ employee_id, dateString: todayStr });

    if (!log) {
      // First click of the work day handles the Session Clock-In Event
      log = new Attendance({ 
        employee_id, 
        employee_name, 
        dateString: todayStr, 
        status: "Present", 
        clockIn: timeStr 
      });
      await log.save();
      return res.status(200).json({ success: true, type: "IN", record: log });
    } else {
      // Second click of the work day records the Session Clock-Out termination stamp
      log.clockOut = timeStr;
      await log.save();
      return res.status(200).json({ success: true, type: "OUT", record: log });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// -------------------------------------------------------------------------
// 📡 PIPELINE C: FETCH LEDGER FOR FRONTIER GRAPH MATRIX ENGINE
// -------------------------------------------------------------------------
exports.getEmployeeAttendance = async (req, res) => {
  try {
    const logs = await Attendance.find({ employee_id: String(req.params.empId).trim() });
    const recordMap = {};
    
    // Reduces database documents down to a performance-oriented key map payload
    logs.forEach(l => {
      recordMap[l.dateString] = { 
        status: l.status, 
        clockIn: l.clockIn, 
        clockOut: l.clockOut 
      };
    });
    
    return res.status(200).json({ success: true, records: recordMap });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};