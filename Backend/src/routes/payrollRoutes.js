const express = require("express");
const router = express.Router();
const Payroll = require("../models/Payroll");

const SalaryConfig = require("../models/SalaryConfig");
const User = require("../models/User");

// 💳 Query payroll receipts by Employee Identification string
router.get("/employee/:empId", async (req, res) => {
  try {
    const records = await Payroll.find({ employee_id: req.params.empId }).sort({ createdAt: -1 });
    return res.status(200).json({ success: true, data: records });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Accounting ledger reading fault.", error: err.message });
  }
});

// 🛠️ Admin Generation Tool (To push new payout logs to an employee profile)
router.post("/generate", async (req, res) => {
  try {
    const { employee_id, payPeriod, baseSalary, allowances, bonuses, tax, providentFund, otherDeductions, payoutDate } = req.body;
    
    const gross = Number(baseSalary) + Number(allowances) + Number(bonuses);
    const totalDeductions = Number(tax) + Number(providentFund) + Number(otherDeductions);
    const netPay = gross - totalDeductions;

    const txId = "TXN-" + Math.random().toString(36).substring(2, 11).toUpperCase();

    const statement = new Payroll({
      employee_id,
      payPeriod,
      earnings: { baseSalary, allowances, bonuses },
      deductions: { tax, providentFund, otherDeductions },
      netPay,
      transactionId: txId,
      payoutDate
    });

    await statement.save();
    return res.status(201).json({ success: true, data: statement });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Statement instantiation failed.", error: err.message });
  }
});

router.get("/admin/directory", async (req, res) => {
    try {
      // Queries all staff profiles
      const corporateStaff = await User.find({ role: { $ne: "Admin" } }).select("employee_id name department email");
      const operationalConfigs = await SalaryConfig.find({});
  
      // Map profiles alongside compensation metadata configurations
      const populatedMatrix = corporateStaff.map(member => {
        const configurationMatch = operationalConfigs.find(c => c.employee_id === member.employee_id);
        return {
          memberInfo: member,
          salaryConfig: configurationMatch || { ctc: 0, fixedSalary: 0, bonus: 0, monthlyBase: 0, relocationAllowance: 0 }
        };
      });
  
      return res.status(200).json({ success: true, data: populatedMatrix });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });
  
  // B. Upsert (Save or update) compensation matrix records
  router.post("/admin/config/save", async (req, res) => {
    try {
      const { employee_id, employee_name, department, ctc, fixedSalary, bonus, monthlyBase, relocationAllowance } = req.body;
  
      const modifiedSheet = await SalaryConfig.findOneAndUpdate(
        { employee_id },
        {
          employee_name,
          department,
          ctc: Number(ctc),
          fixedSalary: Number(fixedSalary),
          bonus: Number(bonus),
          monthlyBase: Number(monthlyBase),
          relocationAllowance: Number(relocationAllowance)
        },
        { new: true, upsert: true } // Creates record automatically if missing
      );
  
      return res.status(200).json({ success: true, data: modifiedSheet });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  });


module.exports = router;