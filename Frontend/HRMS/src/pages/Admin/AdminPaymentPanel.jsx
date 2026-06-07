import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShieldCheck, IndianRupee, Briefcase, ChevronRight, Save, UserCheck, Percent } from 'lucide-react';

export default function AdminPaymentPanel() {
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [alertStatus, setAlertStatus] = useState({ type: '', msg: '' });
  
  // Local input parameters allocation
  const [inputs, setInputs] = useState({ ctc: '', fixedSalary: '', bonus: '', monthlyBase: '', relocationAllowance: '' });

  const syncCorporateDirectory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("fwc_token");
      const res = await axios.get("http://localhost:5000/api/payroll/admin/directory", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) setDirectory(res.data.data || []);
    } catch (err) {
      console.error("Failed syncing tracking sheets:", err);
    } finally { setLoading(false); }
  };

  useEffect(() => { syncCorporateDirectory(); }, []);

  const handleSelectStaff = (node) => {
    setSelectedStaff(node);
    
    // 🚀 Added optional chaining (?.) to prevent crashing on unconfigured profiles
    setInputs({
      ctc: node?.salaryConfig?.ctc || '',
      fixedSalary: node?.salaryConfig?.fixedSalary || '',
      bonus: node?.salaryConfig?.bonus || '',
      monthlyBase: node?.salaryConfig?.monthlyBase || '',
      relocationAllowance: node?.salaryConfig?.relocationAllowance || ''
    });
  };

  const handleCommitConfig = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("fwc_token");
      const payload = {
        employee_id: selectedStaff.memberInfo.employee_id,
        employee_name: selectedStaff.memberInfo.name,
        department: selectedStaff.memberInfo.department || "Operations",
        ...inputs
      };

      const res = await axios.post("http://localhost:5000/api/payroll/admin/config/save", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setAlertStatus({ type: 'success', msg: `Compensation terms configured for ${selectedStaff.memberInfo.name} in INR.` });
        syncCorporateDirectory(); // Refresh dashboard arrays
      }
    } catch (err) {
      setAlertStatus({ type: 'error', msg: 'Failed to update administrative compensation terms.' });
    }
  };

  // Group directory elements dynamically by Department strings
  const departmentsMap = directory.reduce((acc, current) => {
    const dept = current.memberInfo.department || "Unassigned Operations";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(current);
    return acc;
  }, {});

  if (loading) return <div className="text-center py-12 text-xs font-bold text-indigo-500 animate-pulse">Syncing Corporate General Payroll Ledger Matrix...</div>;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><IndianRupee className="text-indigo-600" /> Enterprise Payroll & Compensation Dashboard</h1>
        <p className="text-xs text-slate-400 mt-1">
  Configure compensation profiles in INR (₹). Unpaid absences dynamically apply a 3% deduction run on the 28th automatic generation run.
</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 🏢 LEFT PANEL: DEPARTMENTAL ACCORDION MAP LIST */}
        <div className="space-y-4 bg-white p-5 border border-slate-100 rounded-3xl shadow-xs max-h-[600px] overflow-y-auto">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Corporate Department Tree</h3>
          {Object.keys(departmentsMap).map((dept) => (
            <div key={dept} className="space-y-1.5">
              <div className="bg-slate-100/60 px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                <Briefcase size={12} /> {dept}
              </div>
              <div className="pl-2 space-y-1">
                {departmentsMap[dept].map((node) => (
                  <button
                    key={node.memberInfo.employee_id}
                    onClick={() => handleSelectStaff(node)}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                      selectedStaff?.memberInfo.employee_id === node.memberInfo.employee_id 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span>{node.memberInfo.name}</span>
                    <ChevronRight size={12} className="opacity-40" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 🛠️ RIGHT PANEL: COMPENSATION INPUT CONFIGURATION WORKBENCH */}
        <div className="lg:col-span-2">
          {selectedStaff ? (
            <div className="bg-white p-6 border border-slate-100 rounded-3xl shadow-sm space-y-6">
              <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600"><UserCheck size={18} /></div>
                <div>
                  <h3 className="text-base font-black text-slate-800">{selectedStaff.memberInfo.name}</h3>
                  <p className="text-[11px] text-slate-400 font-medium">Employee Identifier Node: {selectedStaff.memberInfo.employee_id} • {selectedStaff.memberInfo.email}</p>
                </div>
              </div>

              <form onSubmit={handleCommitConfig} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Total CTC (INR / Annum)</label>
                  <input type="number" required value={inputs.ctc} onChange={(e) => setInputs({...inputs, ctc: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-hidden" placeholder="₹ Enter base annual metrics" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Fixed Component Base (INR)</label>
                  <input type="number" required value={inputs.fixedSalary} onChange={(e) => setInputs({...inputs, fixedSalary: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-hidden" placeholder="₹ Fixed retention scale" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Target Incentive Performance Bonus (INR)</label>
                  <input type="number" required value={inputs.bonus} onChange={(e) => setInputs({...inputs, bonus: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-hidden" placeholder="₹ Allocation pools" />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Calculated Monthly Base Disbursal (INR)</label>
                  <input type="number" required value={inputs.monthlyBase} onChange={(e) => setInputs({...inputs, monthlyBase: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-indigo-600 focus:ring-1 focus:ring-indigo-500 outline-hidden" placeholder="₹ Monthly operational breakdown" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Relocation / One-Time Signing Grant Allowance (INR)</label>
                  <input type="number" required value={inputs.relocationAllowance} onChange={(e) => setInputs({...inputs, relocationAllowance: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:ring-1 focus:ring-indigo-500 outline-hidden" placeholder="₹ One-time structural allocation component" />
                </div>

                {/* COMPLIANCE WARNING ADVISORY BLOCK */}
                <div className="md:col-span-2 p-3.5 bg-amber-50/60 border border-amber-200/60 rounded-xl text-[11px] text-amber-700 font-medium flex items-start gap-2">
                  <Percent size={14} className="mt-0.5 shrink-0" />
                  <span><strong>Automated Compliance Notification:</strong> Saving profile parameters schedules an automated payroll generation cycle for the 28th. Non-Paid absence events logged within this monthly rotation path automatically trigger a <strong>3% structural deduction deduction metric run</strong> against the evaluated monthly base configuration.</span>
                </div>

                {alertStatus.msg && (
                  <div className={`md:col-span-2 p-3 text-xs font-bold rounded-xl ${alertStatus.type === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'}`}>
                    {alertStatus.msg}
                  </div>
                )}

                <div className="md:col-span-2 pt-2">
                  <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                    <Save size={14} /> Commit Changes to Database Architecture
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="h-full min-h-[300px] border border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-slate-50/50">
              <ShieldCheck size={36} className="text-slate-300 mb-2" />
              <p className="text-xs text-slate-400 font-medium">Select an active staff asset node from the departmental matrix directory sidebar map to configure compensation conditions.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}