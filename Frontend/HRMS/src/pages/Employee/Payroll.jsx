import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Download, Eye, Calendar, IndianRupee, ShieldCheck, Landmark, Receipt, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { jsPDF } from 'jspdf'; 

const PayrollLedger = ({ user, isDarkMode }) => {
  const [payrollHistory, setPayrollHistory] = useState([]);
  const [activeConfig, setActiveConfig] = useState(null); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedPayslip, setSelectedPayslip] = useState(null);

  useEffect(() => {
    const fetchPayrollAndConfigData = async () => {
      if (!user?.employee_id) return;
      try {
        setLoading(true);
        const token = localStorage.getItem("fwc_token");
        
        try {
          const configRes = await axios.get("http://localhost:5000/api/payroll/admin/directory", {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (configRes.data.success) {
            const currentMatch = configRes.data.data.find(node => node.memberInfo.employee_id === user.employee_id);
            if (currentMatch?.salaryConfig) {
              setActiveConfig(currentMatch.salaryConfig);
            }
          }
        } catch (cfgErr) {
          console.error("Failed pulling general active terms:", cfgErr);
        }

        const res = await axios.get(`http://localhost:5000/api/payroll/employee/${user.employee_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.data.success) {
          setPayrollHistory(res.data.data || []);
          if (res.data.data.length > 0) {
            setSelectedPayslip(res.data.data[0]); 
          }
        }
      } catch (err) {
        console.error(err);
        setError("Unable to retrieve complete payroll records from the accounting engine.");
      } finally {
        setLoading(false);
      }
    };

    fetchPayrollAndConfigData();
  }, [user]);

  const handleDownloadPDF = (slip) => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  
    doc.setFillColor(30, 41, 59); 
    doc.rect(0, 0, 210, 40, "F");
  
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("FWC ENTERPRISE NETWORKS", 14, 16);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(129, 140, 248); 
    doc.text("AUTOMATED PAYSLIP DISTRIBUTION STATEMENT RECORD", 14, 23);
  
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(slip.payPeriod.toUpperCase(), 196, 20, { align: "right" });
  
    doc.setTextColor(51, 65, 85); 
    doc.setFont("helvetica", "normal");
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("EMPLOYEE GENERAL METADATA PROFILE", 14, 52);
    doc.setLineWidth(0.3);
    doc.setDrawColor(226, 232, 240); 
    doc.line(14, 55, 196, 55);
  
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Employee ID reference node: ${user.employee_id || "Staff Session Model ID"}`, 14, 62);
    doc.text(`Full Account User Name: ${user.name}`, 14, 68);
    doc.text(`Cleared Settlement Transaction: ${slip.transactionId}`, 14, 74);
    doc.text(`Disbursal Date Stamp: ${slip.payoutDate || new Date().toLocaleDateString('en-IN')}`, 14, 80);
  
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("FINANCIAL SETTLE GRIDS MATRIX BREAKDOWN", 14, 95);
    doc.line(14, 98, 196, 98);
  
    doc.setFontSize(9);
    doc.text("COMPENSATORY DISBURSAL INCLUSIONS", 14, 106);
    doc.text("VALUATION STATUS (INR)", 110, 106);
    doc.line(14, 109, 125, 109);
  
    doc.setFont("helvetica", "normal");
    doc.text(`1. Configured Monthly Base Salary Component:`, 14, 116);
    doc.text(`INR ${slip.earnings?.baseSalary?.toLocaleString('en-IN') || 0}.00`, 110, 116);
    doc.text(`2. Shared Corporate Incentives / Bonuses:`, 14, 122);
    doc.text(`INR ${slip.earnings?.bonuses?.toLocaleString('en-IN') || 0}.00`, 110, 122);
    doc.text(`3. Relocation Allowance Provision Terms:`, 14, 128);
    doc.text(`INR ${slip.earnings?.allowances?.toLocaleString('en-IN') || 0}.00`, 110, 128);
  
    doc.setFont("helvetica", "bold");
    doc.text("SYSTEM EXCLUSIONS / ABSENCE DEDUCTIONS", 14, 142);
    doc.text("VALUATION STATUS (INR)", 110, 142);
    doc.line(14, 145, 125, 145);
  
    doc.setFont("helvetica", "normal");
    doc.text(`1. Automated Non-Paid Absence Day Deductions (3% per event run):`, 14, 152);
    doc.setTextColor(225, 29, 72); 
    doc.text(`- INR ${slip.deductions?.otherDeductions?.toLocaleString('en-IN') || 0}.00`, 110, 152);
  
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.5);
    doc.line(14, 170, 196, 170);
  
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("TOTAL NET DISBURSED QUANTITY GRADE:", 14, 179);
    doc.setTextColor(37, 99, 235); 
    doc.text(`INR ${slip.netPay?.toLocaleString('en-IN') || 0}.00`, 130, 179);
  
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); 
    doc.setFont("helvetica", "italic");
    doc.text("This document is an automatically compiled transaction file generated via your corporate server dashboard node session data and requires no hand signatures.", 105, 210, { align: "center" });
  
    doc.save(`Payslip_${slip.payPeriod.replace(" ", "_")}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <span className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
        <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Syncing Financial Ledger Engine...</span>
      </div>
    );
  }

  return (
    <div className="space-y-7 p-2 text-left font-sans transition-all duration-300">
      
      {/* HEADER CONTROL BLOCK */}
      <div className="border-b border-slate-100 dark:border-slate-900 pb-5">
        <h2 className={`text-xl font-black tracking-tight ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
          Compensation & Payroll Ledger
        </h2>
        <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-1">
          Review your salary summary statements, active package metrics, and download official monthly statements.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-bold rounded-2xl flex items-center gap-2.5">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {/* 🚀 COMPENSATION MATRIX GRID (ALWAYS VISIBLE UPFRONT) */}
      <div className={`p-6 rounded-3xl border transition-all ${
        isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200/70 shadow-xs'
      }`}>
        <div className="flex items-center gap-2 mb-4">
          <div className={`p-1.5 rounded-lg ${isDarkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
            <ShieldCheck size={15} />
          </div>
          <h3 className="text-[11px] font-black uppercase tracking-widest text-indigo-500">
            Approved Active Compensation Framework
          </h3>
        </div>

        {activeConfig ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-slate-50/60 border-slate-100'}`}>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Total CTC Package</p>
              <p className={`text-base font-black mt-1.5 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                ₹ {Number(activeConfig.ctc || 0).toLocaleString('en-IN')}<span className="text-[10px] font-medium text-slate-400 ml-0.5">/pa</span>
              </p>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-slate-50/60 border-slate-100'}`}>
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Fixed Salary Base</p>
              <p className={`text-base font-black mt-1.5 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                ₹ {Number(activeConfig.fixedSalary || 0).toLocaleString('en-IN')}
              </p>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-indigo-600/5 border-indigo-500/10' : 'bg-indigo-50/40 border-indigo-100/50'}`}>
              <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Calculated Monthly Base</p>
              <p className="text-base font-black text-indigo-600 dark:text-indigo-400 mt-1.5">
                ₹ {Number(activeConfig.monthlyBase || 0).toLocaleString('en-IN')}<span className="text-[10px] font-medium text-indigo-400/70 ml-0.5">/pm</span>
              </p>
            </div>
            <div className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-emerald-600/5 border-emerald-500/10' : 'bg-emerald-50/40 border-emerald-100/50'}`}>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Allowances / Bonuses</p>
              <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
                ₹ {(Number(activeConfig.bonus || 0) + Number(activeConfig.relocationAllowance || 0)).toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        ) : (
          <div className="text-xs font-medium text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-900/20 p-5 rounded-2xl text-center border border-dashed border-slate-200 dark:border-slate-900">
            Active employment compensation structures are currently pending configuration parameters by administration.
          </div>
        )}
      </div>

      {/* LOWER HISTORICAL PAYSLIPS PANEL SECTION */}
      <div className="space-y-3.5">
        <div className="flex items-center gap-2 px-1">
          <Receipt size={14} className="text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Issued Monthly Distribution Records</h3>
        </div>
        
        {payrollHistory.length === 0 ? (
          <div className={`p-16 text-center border-2 border-dashed rounded-3xl transition-all ${
            isDarkMode ? 'border-slate-900 text-slate-600' : 'border-slate-200 text-slate-400 bg-white'
          }`}>
            No issued monthly salary sheets or statement records located. Processing compiles run automatically on the 28th.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* IN-DEPTH SELECTION VIEW DISPLAYER */}
            {selectedPayslip && (
              <div className={`lg:col-span-2 p-6 rounded-3xl border text-left transition-all ${
                isDarkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-slate-200/70 shadow-sm'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-900 pb-5 mb-5 gap-4">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-md tracking-wider">
                      {selectedPayslip.payPeriod} Summary
                    </span>
                    <h3 className={`text-base font-black tracking-tight mt-1 ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      Salary Distribution Sheet
                    </h3>
                  </div>
                  <button 
                    onClick={() => handleDownloadPDF(selectedPayslip)} 
                    className="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-2 text-xs font-bold cursor-pointer"
                  >
                    <Download size={13} /> Payslip PDF
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-slate-50/60 border-slate-100'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Gross Earnings</p>
                    <p className={`text-sm font-black mt-1 ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                      ₹{(selectedPayslip.earnings?.baseSalary + selectedPayslip.earnings?.allowances + selectedPayslip.earnings?.bonuses)?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-900' : 'bg-slate-50/60 border-slate-100'}`}>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Deductions</p>
                    <p className="text-sm font-black text-rose-500 mt-1">
                      ₹{(selectedPayslip.deductions?.tax + selectedPayslip.deductions?.providentFund + selectedPayslip.deductions?.otherDeductions)?.toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-indigo-600/10 border-indigo-500/20' : 'bg-indigo-50/60 border-indigo-100'}`}>
                    <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Net Disbursed</p>
                    <p className="text-sm font-black text-indigo-600 dark:text-indigo-400 mt-1">
                      ₹{selectedPayslip.netPay?.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 border-b border-slate-100 dark:border-slate-900 pb-1.5">
                      Inclusions / Earnings
                    </h4>
                    <div className="flex justify-between text-xs py-0.5 font-medium">
                      <span className="text-slate-400">Base Salary Grade</span>
                      <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>₹{selectedPayslip.earnings?.baseSalary?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 font-medium">
                      <span className="text-slate-400">HRA & Allowances</span>
                      <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>₹{selectedPayslip.earnings?.allowances?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 font-medium">
                      <span className="text-slate-400">Performance Bonuses</span>
                      <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>₹{selectedPayslip.earnings?.bonuses?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-500 border-b border-slate-100 dark:border-slate-900 pb-1.5">
                      Exclusions / Deductions
                    </h4>
                    <div className="flex justify-between text-xs py-0.5 font-medium">
                      <span className="text-slate-400">Income Tax (Withheld)</span>
                      <span className="font-semibold text-rose-500">₹{selectedPayslip.deductions?.tax?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 font-medium">
                      <span className="text-slate-400">Provident Fund Pool</span>
                      <span className="font-semibold text-rose-500">₹{selectedPayslip.deductions?.providentFund?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs py-0.5 font-medium">
                      <span className="text-slate-400">Leave Absences Deduction</span>
                      <span className="font-semibold text-rose-500">₹{selectedPayslip.deductions?.otherDeductions?.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 pt-4 border-t border-slate-100 dark:border-slate-900 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 dark:bg-slate-900/20 p-3.5 rounded-2xl gap-3">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    Disbursed Transaction ID: <span className="font-mono ml-1">{selectedPayslip.transactionId}</span>
                  </span>
                  <span className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[9px] font-black px-2.5 py-0.5 rounded-md uppercase tracking-wider shrink-0">
                    Cleared Settlement
                  </span>
                </div>
              </div>
            )}

            {/* HISTORICAL INDEX LIST GENERATOR */}
            <div className="space-y-3 text-left">
              <div className="flex items-center gap-1.5 px-1 text-slate-400 dark:text-slate-500">
                <Calendar size={13} />
                <h4 className="text-[10px] font-black uppercase tracking-widest">History Log Matrix</h4>
              </div>
              <div className="space-y-2.5 max-h-[440px] overflow-y-auto pr-1">
                {payrollHistory.map((slip) => (
                  <div 
                    key={slip._id}
                    onClick={() => setSelectedPayslip(slip)}
                    className={`p-4 border rounded-2xl cursor-pointer transition-all flex items-center justify-between group ${
                      selectedPayslip?._id === slip._id 
                        ? 'bg-indigo-600/5 border-indigo-500 text-indigo-600 dark:text-indigo-400 shadow-xs' 
                        : isDarkMode ? 'bg-slate-950 border-slate-900 hover:border-slate-800' : 'bg-white border-slate-200/70 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className={`text-xs font-black tracking-wide ${selectedPayslip?._id === slip._id ? 'text-indigo-500 dark:text-indigo-400' : isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{slip.payPeriod}</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Net Received: <span className="font-bold text-slate-500 dark:text-slate-400">₹{slip.netPay?.toLocaleString('en-IN')}</span></p>
                    </div>
                    <div className={`p-2 rounded-xl transition-all ${
                      selectedPayslip?._id === slip._id 
                        ? 'bg-indigo-500/10 text-indigo-500' 
                        : 'bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:text-indigo-500'
                    }`}>
                      <Eye size={13} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};

export default PayrollLedger;