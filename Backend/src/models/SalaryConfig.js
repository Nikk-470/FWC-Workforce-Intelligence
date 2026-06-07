const mongoose = require("mongoose");

const SalaryConfigSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, unique: true, index: true },
  employee_name: { type: String, required: true },
  department: { type: String, required: true, index: true },
  ctc: { type: Number, default: 0 },
  fixedSalary: { type: Number, default: 0 },
  bonus: { type: Number, default: 0 },
  monthlyBase: { type: Number, default: 0 },
  relocationAllowance: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("SalaryConfig", SalaryConfigSchema);