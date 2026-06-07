const mongoose = require("mongoose");

const PayrollSchema = new mongoose.Schema({
  employee_id: { type: String, required: true, index: true },
  payPeriod: { type: String, required: true }, // e.g., "June 2026", "May 2026"
  earnings: {
    baseSalary: { type: Number, required: true },
    allowances: { type: Number, default: 0 },
    bonuses: { type: Number, default: 0 }
  },
  deductions: {
    tax: { type: Number, default: 0 },
    providentFund: { type: Number, default: 0 },
    otherDeductions: { type: Number, default: 0 }
  },
  netPay: { type: Number, required: true }, // Auto-calculated value on creation
  transactionId: { type: String, required: true, unique: true },
  payoutDate: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model("Payroll", PayrollSchema);