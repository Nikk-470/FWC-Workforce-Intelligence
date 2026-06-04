import React from 'react';
import { DollarSign, Download, FileText, ArrowUpRight, ArrowDownRight, ShieldCheck } from 'lucide-react';

const PayrollLedger = ({ isDarkMode }) => {
  // Mock payroll data for the logged-in employee
  const payrollDetails = {
    currentCycle: "June 2026",
    payDate: "June 30, 2026",
    baseSalary: 6500,
    allowances: 1200,
    taxDeductions: 950,
    medicalInsurance: 150,
    history: [
      { id: "PAY-9021", month: "May 2026", netPay: 6600, status: "Deposited", date: "05/31/2026" },
      { id: "PAY-8843", month: "April 2026", netPay: 6600, status: "Deposited", date: "04/30/2026" },
      { id: "PAY-8712", month: "March 2026", netPay: 6450, status: "Deposited", date: "03/31/2026" },
    ]
  };

  const netEarnings = (payrollDetails.baseSalary + payrollDetails.allowances) - (payrollDetails.taxDeductions + payrollDetails.medicalInsurance);

  const handleDownload = (payId) => {
    alert(`Generating secure, encrypted PDF transaction receipt for Statement ID: ${payId}`);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      
      {/* SECTION 1: PAYROLL OVERVIEW METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Net Take-Home Card */}
        <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Net Take-Home Pay</span>
            <div className="p-1.5 rounded-lg bg-green-500/10 text-green-500"><ArrowUpRight size={14} /></div>
          </div>
          <p className="text-2xl font-black text-green-500">${netEarnings.toLocaleString()}.00</p>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Next payout: {payrollDetails.payDate}</span>
        </div>

        {/* Total Additions Card */}
        <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gross Earnings</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-bold">Base + Perks</span>
          </div>
          <p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
            ${(payrollDetails.baseSalary + payrollDetails.allowances).toLocaleString()}.00
          </p>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">${payrollDetails.baseSalary} base / ${payrollDetails.allowances} allowances</span>
        </div>

        {/* Total Deductions Card */}
        <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Deductions</span>
            <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400"><ArrowDownRight size={14} /></div>
          </div>
          <p className="text-2xl font-black text-red-400">
            -${(payrollDetails.taxDeductions + payrollDetails.medicalInsurance).toLocaleString()}.00
          </p>
          <span className="text-[10px] text-slate-400 font-medium block mt-1">Income tax & medical premium</span>
        </div>
      </div>

      {/* SECTION 2: BREAKDOWN & ARCHIVE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Itemized List */}
        <div className={`p-6 rounded-2xl border lg:col-span-1 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <DollarSign size={16} className="text-blue-500" /> Current Pay Items
          </h3>
          <div className="space-y-3.5 text-xs">
            <div className="flex justify-between border-b pb-2 dark:border-slate-900 border-slate-50">
              <span className="text-slate-400">Basic Salary</span>
              <span className="font-semibold">${payrollDetails.baseSalary.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between border-b pb-2 dark:border-slate-900 border-slate-50">
              <span className="text-slate-400">Allowances (HRA/Tech)</span>
              <span className="font-semibold text-green-500">+${payrollDetails.allowances.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between border-b pb-2 dark:border-slate-900 border-slate-50">
              <span className="text-slate-400">Income Tax Withholding</span>
              <span className="font-semibold text-red-400">-${payrollDetails.taxDeductions.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between pb-1">
              <span className="text-slate-400">Medical Insurance Plan</span>
              <span className="font-semibold text-red-400">-${payrollDetails.medicalInsurance.toLocaleString()}.00</span>
            </div>
            
            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border dark:border-slate-800/80 border-slate-100 flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-blue-500 flex-shrink-0" />
              <p className="text-[10px] text-slate-400 leading-normal">This payroll run configuration is strictly compliant with corporate audit guidelines.</p>
            </div>
          </div>
        </div>

        {/* Pay Stub Documents History */}
        <div className={`p-6 rounded-2xl border lg:col-span-2 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
            <FileText size={16} className="text-blue-500" /> Historical Payslips
          </h3>
          
          <div className="divide-y divide-slate-100 dark:divide-slate-900 overflow-hidden">
            {payrollDetails.history.map((pay) => (
              <div key={pay.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0 hover:bg-slate-50/40 dark:hover:bg-slate-900/10 px-1 rounded-xl transition-colors">
                <div>
                  <p className="text-xs font-bold">{pay.month}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">ID: <span className="font-mono">{pay.id}</span> • Paid on {pay.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-xs font-black text-green-500">${pay.netPay.toLocaleString()}.00</p>
                    <span className="text-[9px] uppercase tracking-wide font-extrabold bg-green-500/10 text-green-500 px-1.5 py-0.2 rounded mt-0.5 inline-block">{pay.status}</span>
                  </div>
                  <button 
                    onClick={() => handleDownload(pay.id)}
                    className={`p-2 rounded-xl border transition-all ${
                      isDarkMode ? 'border-slate-800 hover:border-slate-700 hover:bg-slate-900 text-slate-400 hover:text-white' : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PayrollLedger;