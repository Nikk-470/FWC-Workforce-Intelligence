const cron = require("node-cron");
const SalaryConfig = require("../models/SalaryConfig");
const Leave = require("../models/Leave");
const Payroll = require("../models/Payroll");

// ⚡ Dynamic Payroll calculation & compilation function context engine
const executeMonthlyPayrollGeneration = async () => {
  try {
    console.log("Initializing Automated Monthly Payroll Generation Loop...");
    
    const currentMonth = new Date().toLocaleString('default', { month: 'long' });
    const currentYear = new Date().getFullYear();
    const payPeriodString = `${currentMonth} ${currentYear}`;

    // 1. Fetch all salary configurations
    const salaryConfigs = await SalaryConfig.find({});
    
    for (const config of salaryConfigs) {
      // 2. Aggregate structural counts of unexcused/unpaid leaves taken this month
      // Filter out leaves that match the current month and are NOT approved as "Paid Leave"
      const currentMonthIndex = new Date().getMonth();
      const leavesThisMonth = await Leave.find({
        employee_id: config.employee_id,
        status: "Approved",
        leaveType: { $ne: "Paid Leave" } // Unpaid leaves (Casual, Medical, etc.)
      });

      let totalUnpaidLeaveDays = 0;
      leavesThisMonth.forEach(leave => {
        const leaveDate = new Date(leave.startDate || leave.singleDate);
        if (leaveDate.getMonth() === currentMonthIndex && leaveDate.getFullYear() === currentYear) {
          totalUnpaidLeaveDays += Number(leave.daysRequested);
        }
      });

      // 3. Dynamic Calculation Matrix (3% deduction per day off base monthly salary)
      const baseMonthly = config.monthlyBase;
      const deductionRatePerDay = 0.03; 
      const totalDeductionsAmount = Math.round(baseMonthly * deductionRatePerDay * totalUnpaidLeaveDays);
      
      // Calculate final Net Pay distribution
      const grossEarnings = baseMonthly + config.bonus + config.relocationAllowance;
      const netPayFinal = Math.max(0, grossEarnings - totalDeductionsAmount);
      const transactionIdString = "TXN-AUTO-" + Math.random().toString(36).substring(2, 11).toUpperCase();

      // 4. Persist data record inside the database ledger collection
      const payrollEntry = new Payroll({
        employee_id: config.employee_id,
        payPeriod: payPeriodString,
        earnings: {
          baseSalary: baseMonthly,
          allowances: config.relocationAllowance,
          bonuses: config.bonus
        },
        deductions: {
          tax: 0, // Extendable for progressive tax matrix brackets later
          providentFund: 0,
          otherDeductions: totalDeductionsAmount // Holds the 3% leave cuts dynamic calculation
        },
        netPay: netPayFinal,
        transactionId: transactionIdString,
        payoutDate: new Date().toLocaleDateString('en-IN')
      });

      await payrollEntry.save();
      console.log(`Successfully compiled automatic ledger entry nodes for: ${config.employee_name}`);
    }
    console.log("Automated payroll compilation sequence processed complete.");
  } catch (error) {
    console.error("Critical error inside payroll batch cron iteration:", error);
  }
};

// ⏰ AUTOMATION CRON: Fires precisely at 00:00 on the 28th day of every month
cron.schedule("0 0 28 * *", () => {
  executeMonthlyPayrollGeneration();
});

module.exports = { executeMonthlyPayrollGeneration };