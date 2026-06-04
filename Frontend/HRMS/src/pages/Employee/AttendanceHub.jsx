import React, { useState } from 'react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';

const AttendanceHub = ({ isDarkMode }) => {
  // Current month reference: June 2026
  const currentMonthName = "June 2026";
  
  // Mock data representing processed logs (this will eventually be populated by your CSV parser)
  const [attendanceRecords, setAttendanceRecords] = useState({
    "2026-06-01": { status: "Present", clockIn: "08:58 AM", clockOut: "05:45 PM" },
    "2026-06-02": { status: "Present", clockIn: "09:02 AM", clockOut: "06:01 PM" },
    "2026-06-03": { status: "Present", clockIn: "08:45 AM", clockOut: "05:30 PM" },
    "2026-06-04": { status: "Present", clockIn: "09:15 AM", clockOut: "06:12 PM" },
    "2026-06-05": { status: "Absent", clockIn: "--", clockOut: "--" },
    "2026-06-08": { status: "On Leave", clockIn: "--", clockOut: "--", leaveType: "Annual Leave" },
  });

  // Calculate Monthly Statistics
  const totalDaysInMonth = 30; // June has 30 days
  const totalPresent = Object.values(attendanceRecords).filter(r => r.status === "Present").length;
  const totalAbsent = Object.values(attendanceRecords).filter(r => r.status === "Absent").length;
  const totalLeave = Object.values(attendanceRecords).filter(r => r.status === "On Leave").length;

  // Helper engine to generate day objects for June 2026
  // June 1, 2026 is a Monday. We map out 30 days cleanly.
  const daysArray = Array.from({ length: totalDaysInMonth }, (_, i) => {
    const dayNum = i + 1;
    const dateString = `2026-06-${dayNum < 10 ? '0' : ''}${dayNum}`;
    return {
      dayNum,
      dateString,
      record: attendanceRecords[dateString] || null
    };
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-fadeIn">
      
      {/* 📊 SECTION 1: ATTENDANCE SUMMARY COUNTERS */}
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

      {/* 📅 SECTION 2: THE INTERACTIVE VISUAL CALENDAR GRID */}
      <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon size={16} className="text-blue-500" /> Biometric Sync Ledger
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Visual processing calendar view for {currentMonthName}</p>
          </div>
          
          {/* Calendar Status Legend */}
          <div className="flex gap-3 text-[10px] font-bold">
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-green-500/20 border border-green-500/30 block"></span> Present</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-red-500/20 border border-red-500/30 block"></span> Absent</div>
            <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500/30 block"></span> Leave</div>
          </div>
        </div>

        {/* Days of the Week Header labels */}
        <div className="grid grid-cols-7 gap-2 text-center text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">
          <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div className="text-slate-300 dark:text-slate-700">Sat</div><div className="text-slate-300 dark:text-slate-700">Sun</div>
        </div>

        {/* Calendar Box Matrix Mapping Loop */}
        <div className="grid grid-cols-7 gap-2">
          {daysArray.map((day) => {
            let bgStyle = isDarkMode ? "bg-slate-900/40 border-slate-800 text-slate-500" : "bg-slate-50/50 border-slate-100 text-slate-400";
            
            // Dynamic theme painting algorithm based on internal status flags
            if (day.record?.status === "Present") {
              bgStyle = "bg-green-500/10 border-green-500/30 text-green-600 font-bold shadow-xs";
            } else if (day.record?.status === "Absent") {
              bgStyle = "bg-red-500/10 border-red-500/30 text-red-500 font-bold";
            } else if (day.record?.status === "On Leave") {
              bgStyle = "bg-amber-500/10 border-amber-500/30 text-amber-500 font-bold";
            }

            // Detect weekends automatically (June 2026 calendar specific coordinates)
            const isWeekend = day.dayNum % 7 === 6 || day.dayNum % 7 === 0;

            return (
              <div 
                key={day.dayNum} 
                className={`p-3 min-h-[64px] rounded-xl border flex flex-col justify-between transition-all text-xs group relative ${bgStyle} ${isWeekend && !day.record ? 'opacity-40' : ''}`}
              >
                <span className="text-[11px] font-mono">{day.dayNum}</span>
                
                {/* Micro Details on Hover */}
                {day.record && (
                  <div className="text-[9px] mt-1 font-medium tracking-tight truncate max-w-full">
                    {day.record.status === "Present" ? (
                      <span className="opacity-80 block">{day.record.clockIn} - {day.record.clockOut}</span>
                    ) : (
                      <span className="opacity-70 block uppercase font-bold text-[8px]">{day.record.leaveType || day.record.status}</span>
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