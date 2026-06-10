import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Calendar as CalendarIcon, LogIn, LogOut, CheckCircle } from 'lucide-react';

const AttendanceHub = ({ user, isDarkMode }) => {
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(true);
  const [buttonLoading, setButtonLoading] = useState(false);

  // 📅 Shifted to July 2026 to align with your generated historical CSV files
  const currentMonthName = "July 2026";
  const totalDaysInMonth = 31;

  // Helper utility to identify today's key string format matching the DB entries
  const getTodayKey = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("fwc_token");
      
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/attendance/employee/${user.employee_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        setAttendanceRecords(res.data.records);
      }
    } catch (err) {
      console.error("Error fetching live attendance data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.employee_id) {
      fetchAttendance();
    }
  }, [user]);

  // Handle live interactive Clock-In / Clock-Out requests
  const handlePunchAction = async () => {
    try {
      setButtonLoading(true);
      const token = localStorage.getItem("fwc_token");
      
      const res = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/attendance/punch`, {
        employee_id: user.employee_id,
        employee_name: user.name
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.data.success) {
        await fetchAttendance();
      }
    } catch (err) {
      console.error("Punch session execution error:", err);
    } finally {
      setButtonLoading(false);
    }
  };

  // 1. Generate July 2026 grid coordinates FIRST
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateString = `2026-07-${dayNum < 10 ? '0' : ''}${dayNum}`;
    return {
      dayNum,
      dateString,
      record: attendanceRecords[dateString] || null
    };
  });

  // 2. NOW calculate stats scoped STRICTLY to the visible grid array
  const currentMonthRecords = daysArray.map(d => d.record).filter(Boolean);
  
  const totalPresent = currentMonthRecords.filter(r => r.status === "Present").length;
  const totalAbsent = currentMonthRecords.filter(r => r.status === "Absent").length;
  const totalLeave = currentMonthRecords.filter(r => r.status === "On Leave").length;

  // Calculate Button Render State for Today
  const todayKey = getTodayKey();
  const todaysRecord = attendanceRecords[todayKey];

  let punchButtonElement = null;
  if (!todaysRecord) {
    punchButtonElement = (
      <button 
        onClick={handlePunchAction} 
        disabled={buttonLoading} 
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
      >
        <LogIn size={14} /> {buttonLoading ? "Processing..." : "Clock In Session"}
      </button>
    );
  } else if (todaysRecord && todaysRecord.clockOut === "--") {
    punchButtonElement = (
      <button 
        onClick={handlePunchAction} 
        disabled={buttonLoading} 
        className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-sm disabled:opacity-50"
      >
        <LogOut size={14} /> {buttonLoading ? "Processing..." : "Clock Out Shift"}
      </button>
    );
  } else {
    punchButtonElement = (
      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-emerald-100">
        <CheckCircle size={14} className="text-emerald-600" /> Shift Logged Complete
      </div>
    );
  }

  if (loading) return <div className="p-8 text-center text-sm text-slate-400">Syncing biometric logs...</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      
      {/* 🖱️ LIVE TRACKER INTERACTION BANNER */}
      <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`}>
        <div>
          <h3 className={`text-sm font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Operational Real-Time Tracker</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Log your active shift constraints instantaneously into your workspace data hub node.</p>
        </div>
        {punchButtonElement}
      </div>

      {/* 📊 STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Total Days Present</span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-green-500">{totalPresent}</span>
            <span className="text-xs text-slate-400 font-medium">/ {totalDaysInMonth} Days</span>
          </div>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Unexcused Absences</span>
          <p className="text-2xl font-black text-red-500">{totalAbsent}</p>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Approved Leave Days</span>
          <p className="text-2xl font-black text-amber-500">{totalLeave}</p>
        </div>

        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Attendance Ratio</span>
          <p className="text-2xl font-black text-blue-500">
            {totalDaysInMonth > 0 ? Math.round((totalPresent / totalDaysInMonth) * 100) : 0}%
          </p>
        </div>
      </div>

      {/* 📅 INTERACTIVE VIEW GRID */}
      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon size={16} className="text-blue-500" /> Biometric Sync Ledger
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Visual processing calendar view for {currentMonthName}</p>
          </div>
          
          <div className="flex gap-3 text-[10px] font-bold">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/20 border border-green-500/30 block"></span> Present</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/30 block"></span> Absent</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-slate-100 border border-slate-200 block"></span> Weekend</div>
          </div>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
          <div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div><div>Mon</div><div>Tue</div>
        </div>

        {/* Calendar Matrix Mapping */}
        <div className="grid grid-cols-7 gap-2">
          {daysArray.map((day) => {
            const dayOfWeek = (day.dayNum + 2) % 7; 
            const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;

            let bgStyle = isDarkMode 
              ? "bg-slate-900/40 border-slate-800 text-slate-400" 
              : "bg-white border-slate-200 text-slate-700";

            if (isWeekend && !day.record) {
              bgStyle = isDarkMode 
                ? "bg-slate-900 border-slate-800/60 text-slate-600 opacity-60" 
                : "bg-slate-50 text-slate-400 border-slate-100";
            }

            if (day.record?.status === "Present") {
              bgStyle = "bg-green-500/10 border-green-500/30 text-green-600 font-bold shadow-xs";
            } else if (day.record?.status === "Absent") {
              bgStyle = "bg-red-500/10 border-red-500/30 text-red-500 font-bold";
            } else if (day.record?.status === "On Leave") {
              bgStyle = "bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold";
            }

            return (
              <div 
                key={day.dayNum} 
                className={`p-3 min-h-[64px] rounded-xl border flex flex-col justify-between transition-all text-xs relative ${bgStyle}`}
              >
                <span className="text-[11px] font-mono">{day.dayNum}</span>
                
                {day.record && (
                  <div className="text-[9px] mt-1 font-medium tracking-tight truncate max-w-full">
                    {day.record.status === "Present" ? (
                      <span className="opacity-90 block font-bold">{day.record.clockIn} - {day.record.clockOut}</span>
                    ) : (
                      <span className="opacity-70 block uppercase font-bold text-[8px]">{day.record.status}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AttendanceHub;