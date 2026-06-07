import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar, FileText, Send, CheckCircle2, AlertTriangle, Clock, XCircle } from 'lucide-react';

const LeaveRequestPortal = ({ user, isDarkMode }) => {
  const [daySelectionType, setDaySelectionType] = useState('select'); // 'select' or 'type'
  const [selectedDays, setSelectedDays] = useState('1');
  const [formData, setFormData] = useState({
    singleDate: '',
    startDate: '',
    endDate: '',
    leaveType: 'Casual Leave',
    reason: ''
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  const [leaveHistory, setLeaveHistory] = useState([]);
  const [isFrozen, setIsFrozen] = useState(false);
  const [monthlyDaysTaken, setMonthlyDaysTaken] = useState(0);

  // Fetch past leave requests and run validation rule constraints
  const fetchLeaveAnalytics = async () => {
    if (!user?.employee_id) return;
    try {
      const token = localStorage.getItem("fwc_token");
      const res = await axios.get(`http://localhost:5000/api/leaves/history/${user.employee_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (res.data.success) {
        const history = res.data.data || [];
        setLeaveHistory(history);

        // Calculate total days approved or pending in the current month
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const totalDaysThisMonth = history.reduce((acc, leave) => {
          const leaveDate = new Date(leave.startDate || leave.singleDate);
          if (
            leaveDate.getMonth() === currentMonth && 
            leaveDate.getFullYear() === currentYear &&
            leave.status !== 'Rejected'
          ) {
            return acc + Number(leave.daysRequested);
          }
          return acc;
        }, 0);

        setMonthlyDaysTaken(totalDaysThisMonth);
        if (totalDaysThisMonth >= 7) {
          setIsFrozen(true);
        }
      }
    } catch (err) {
      console.error("Failed fetching structural leave data queues:", err);
    }
  };

  useEffect(() => {
    fetchLeaveAnalytics();
  }, [user]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDaysChange = (e) => {
    const val = e.target.value;
    setSelectedDays(val);
    if (val === 'more') {
      setDaySelectionType('type');
      setSelectedDays('11'); // Default fallback above dropdown scope
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isFrozen) {
      setStatus({ type: 'error', msg: 'Operational limit reached: Monthly request pool frozen (>7 days).' });
      return;
    }

    const totalDays = Number(selectedDays);
    if (totalDays <= 0) {
      setStatus({ type: 'error', msg: 'Please specify a constructive quantity of days.' });
      return;
    }

    // Dynamic field gathering conditional logic
    const payload = {
      employee_id: user?.employee_id,
      employee_name: user?.name || "Staff Member",
      leaveType: formData.leaveType,
      reason: formData.reason,
      daysRequested: totalDays,
      singleDate: totalDays === 1 ? formData.singleDate : null,
      startDate: totalDays > 1 ? formData.startDate : null,
      endDate: totalDays > 1 ? formData.endDate : null
    };

    if (totalDays === 1 && !formData.singleDate) {
      setStatus({ type: 'error', msg: 'Please provide your specific single-day date target.' });
      return;
    }
    if (totalDays > 1 && (!formData.startDate || !formData.endDate)) {
      setStatus({ type: 'error', msg: 'Please configure both start and end boundary paths.' });
      return;
    }
    if (!formData.reason.trim()) {
      setStatus({ type: 'error', msg: 'Please provide structural justification contexts.' });
      return;
    }

    try {
      setLoading(true);
      setStatus({ type: '', msg: '' });
      const token = localStorage.getItem("fwc_token");

      const res = await axios.post('http://localhost:5000/api/leaves/request', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setStatus({ type: 'success', msg: 'Leave request dispatched to manager triage logs!' });
        setFormData({ singleDate: '', startDate: '', endDate: '', leaveType: 'Casual Leave', reason: '' });
        setDaySelectionType('select');
        setSelectedDays('1');
        fetchLeaveAnalytics(); // Live reload analytics counters
      }
    } catch (err) {
      setStatus({ type: 'error', msg: err.response?.data?.message || 'Server pipeline processing failure.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-1">
      {/* 📊 RUNTIME COMPLIANCE MONITOR CARD */}
      <div className={`p-4 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-xs'}`}>
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Usage Compliance Tracker</h4>
          <p className="text-xs font-semibold mt-1">
            Days logged this month: <span className={monthlyDaysTaken > 5 ? "text-amber-500" : "text-blue-500 font-extrabold"}>{monthlyDaysTaken} / 7 Days Cap</span>
          </p>
        </div>
        {isFrozen && (
          <span className="bg-red-500/10 text-red-500 px-3 py-1 text-[10px] uppercase font-bold tracking-widest rounded-full border border-red-500/20 animate-pulse">
            ❌ Dashboard Panel Frozen
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORM DRAWER ROW */}
        <div className={`p-6 rounded-2xl border h-fit ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} ${isFrozen ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="mb-4">
            <h3 className="text-sm font-bold flex items-center gap-2"><FileText size={16} className="text-blue-600" /> Draft Absence Ticket</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Configure your parameters below to initialize routing.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Leave Type Metric Choice */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Leave Classification</label>
              <select name="leaveType" value={formData.leaveType} onChange={handleInputChange} className={`w-full p-2 rounded-xl border text-xs font-medium outline-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                <option value="Casual Leave">Casual Leave</option>
                <option value="Medical Leave">Medical Leave</option>
                <option value="Paid Leave">Paid Leave</option>
              </select>
            </div>

            {/* 🔢 ABSENCE DURATION CHOOSER CONTROL */}
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Duration (Days)</label>
              {daySelectionType === 'select' ? (
                <select value={selectedDays} onChange={handleDaysChange} className={`w-full p-2 rounded-xl border text-xs font-medium outline-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                  {[...Array(10)].map((_, i) => (
                    <option key={i+1} value={i+1}>{i+1} {i===0 ? 'Day' : 'Days'}</option>
                  ))}
                  <option value="more">More than 10 days...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input type="number" min="11" value={selectedDays} onChange={(e) => setSelectedDays(e.target.value)} className={`w-full p-2 rounded-xl border text-xs font-medium outline-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                  <button type="button" onClick={() => { setDaySelectionType('select'); setSelectedDays('1'); }} className="text-[10px] font-bold px-2 text-blue-500 hover:underline">Reset</button>
                </div>
              )}
            </div>

            {/* 📅 CONDITIONALLY RENDERED INPUT RANGES */}
            {Number(selectedDays) === 1 ? (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Absence Date</label>
                <input type="date" name="singleDate" value={formData.singleDate} onChange={handleInputChange} className={`w-full p-2 rounded-xl border text-xs focus:ring-1 focus:ring-blue-500 outline-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">From</label>
                  <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={`w-full p-2 rounded-xl border text-xs focus:ring-1 focus:ring-blue-500 outline-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">To</label>
                  <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className={`w-full p-2 rounded-xl border text-xs focus:ring-1 focus:ring-blue-500 outline-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`} />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Reason / Justification</label>
              <textarea name="reason" rows="3" value={formData.reason} onChange={handleInputChange} placeholder="State reasons for management evaluation..." className={`w-full p-2.5 rounded-xl border text-xs focus:ring-1 focus:ring-blue-500 outline-hidden resize-none ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}></textarea>
            </div>

            {status.msg && (
              <div className={`p-3 rounded-xl border flex items-center gap-2 text-[11px] font-semibold ${status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                {status.type === 'success' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                <span>{status.msg}</span>
              </div>
            )}

            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-50">
              {loading ? "Transmitting Fields..." : <>Deploy Leave Petition <Send size={12} /></>}
            </button>
          </form>
        </div>

        {/* 📜 HISTORICAL PIPELINE AUDIT ROW */}
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Clock size={14} /> Leave Pipeline Architecture Log</h3>
          {leaveHistory.length === 0 ? (
            <div className={`p-8 text-center border border-dashed rounded-2xl ${isDarkMode ? 'border-slate-800 text-slate-500' : 'border-slate-200 text-slate-400'}`}>
              No historical leave documents mapped to this profile session asset.
            </div>
          ) : (
            leaveHistory.map((leave) => (
              <div key={leave._id} className={`p-4 rounded-xl border flex items-center justify-between transition-all ${isDarkMode ? 'bg-slate-950/40 border-slate-800/80' : 'bg-white border-slate-200/60 shadow-xs'}`}>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider ${isDarkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>{leave.leaveType}</span>
                    <span className="text-xs font-black text-slate-400">({leave.daysRequested} {leave.daysRequested === 1 ? 'Day' : 'Days'})</span>
                  </div>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    {leave.singleDate ? `Target: ${leave.singleDate}` : `Span: ${leave.startDate} ➔ ${leave.endDate}`}
                  </p>
                  <p className="text-[11px] text-slate-400 italic">" {leave.reason} "</p>
                </div>

                {/* DYNAMIC CARD STATUS VISUALIZERS */}
                <div>
                  {leave.status === 'Approved' && (
                    <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <CheckCircle2 size={12} /> Grant Verified
                    </span>
                  )}
                  {leave.status === 'Rejected' && (
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      <XCircle size={12} /> Request Declined
                    </span>
                  )}
                  {leave.status === 'Pending' && (
                    <span className="bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider animate-pulse">
                      ◷ In Triage Queue
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default LeaveRequestPortal;