import React, { useState, useEffect } from 'react';
import { Clock, Calendar, FileText, CheckCircle2, User, LogOut, Camera,DollarSign, Check, X } from 'lucide-react';
import PayrollLedger from './Payroll'; // adjust path based on folder structure
import AttendanceHub from "./AttendanceHub";

const EmployeeDashboard = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Available");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);

  // --- 🛠️ FEATURE 1: REAL TIME LIVE CONTROLLED STATE ---
  const [user, setUser] = useState({ 
    name: "Employee", 
    email: "employee@company.com",
    id: "EMP-2026-0894",
    phone: "+1 (555) 234-5678",
    designation: "Senior SDE",
    address: "123 Technology Drive, Suite 400, Silicon Valley, CA",
    avatarUrl: null
  });

  // Temporary form state to hold edits before clicking "Save"
  const [formData, setFormData] = useState({ ...user });

  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // --- 🛠️ FEATURE 2: EXPANDED ROUTING SYSTEM ---
  // Options: "dashboard", "profile", "attendance", "leaves"
  const [activeTab, setActiveTab] = useState("dashboard"); 

  // Mock Data for Attendance Tracking history
  const [attendanceLogs, setAttendanceLogs] = useState([
    { date: "2026-06-03", clockIn: "09:02 AM", clockOut: "05:58 PM", hours: "8.9h", status: "Present" },
    { date: "2026-06-02", clockIn: "08:55 AM", clockOut: "06:02 PM", hours: "9.1h", status: "Present" },
    { date: "2026-06-01", clockIn: "09:15 AM", clockOut: "05:30 PM", hours: "8.2h", status: "Present" },
  ]);

  // Mock Data for Leave Requests history & Leave limits
  const [leaveBalances, setLeaveBalances] = useState({ annual: 14, annualMax: 18, sick: 6, sickMax: 8 });
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, type: "Annual Leave", start: "2026-07-10", end: "2026-07-14", days: 4, status: "Approved" },
    { id: 2, type: "Sick Leave", start: "2026-05-12", end: "2026-05-12", days: 1, status: "Approved" }
  ]);
  const [newLeave, setNewLeave] = useState({ type: "Annual Leave", start: "", end: "", days: 1 });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(prev => ({ ...prev, ...storedUser }));
      setFormData(prev => ({ ...prev, ...storedUser }));
    }

    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync temporary state whenever the active profile panel opens
  useEffect(() => {
    if (activeTab === "profile") {
      setFormData({ ...user });
    }
  }, [activeTab, user]);

  const handleClockIn = () => {
    const now = new Date();
    if (!isClockedIn) {
      setIsClockedIn(true);
      // Prepend new clock-in row to history logs
      const newLog = {
        date: now.toISOString().split('T')[0],
        clockIn: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        clockOut: "--:--",
        hours: "Running...",
        status: "Active Shift"
      };
      setAttendanceLogs([newLog, ...attendanceLogs]);
    } else {
      setIsClockedIn(false);
      // Update the active shift log with clock-out values
      setAttendanceLogs(prev => prev.map((log, index) => {
        if (index === 0 && log.status === "Active Shift") {
          return {
            ...log,
            clockOut: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hours: "8.5h", // Hardcoded mock duration calc for styling consistency
            status: "Present"
          };
        }
        return log;
      }));
    }
  };

  // --- 🛠️ FEATURE 3: AVATAR MOCK FILE UPLOADER ENGINE ---
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileSave = (e) => {
    e.preventDefault();
    setUser({ ...formData });
    localStorage.setItem('user', JSON.stringify(formData));
    alert("Profile Changes Saved Globally!");
    setActiveTab("dashboard");
  };

  const handleLeaveSubmit = (e) => {
    e.preventDefault();
    if (!newLeave.start || !newLeave.end) return alert("Please fill in dates.");
    
    const submittedRequest = {
      id: Date.now(),
      type: newLeave.type,
      start: newLeave.start,
      end: newLeave.end,
      days: Number(newLeave.days),
      status: "Pending"
    };

    setLeaveRequests([submittedRequest, ...leaveRequests]);
    alert("Leave Request Submitted for Approval!");
    setNewLeave({ type: "Annual Leave", start: "", end: "", days: 1 });
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/";
  };

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* SIDEBAR NAVIGATION PANEL */}
      <div className={`w-64 border-r p-6 flex flex-col justify-between transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div>
          <div className="flex items-center gap-3 mb-8">
            <div className="bg-blue-600 text-white p-2 rounded-lg font-bold text-xl">FWC</div>
            <span className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Workforce Hub</span>
          </div>
          <nav className="space-y-2">
            <button 
              onClick={() => setActiveTab("dashboard")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "dashboard" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <User size={18} /> My Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("attendance")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "attendance" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}

              
            >
             
              <Calendar size={18} /> My Attendance
            </button>

            <button 
  onClick={() => setActiveTab("payroll")}
  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
    activeTab === "payroll" 
      ? "bg-blue-600 text-white shadow-md" 
      : isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
  }`}
>
  <DollarSign size={18} /> My Payroll
</button>

            <button 
              onClick={() => setActiveTab("leaves")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "leaves" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <FileText size={18} /> Leave Requests
            </button>
          </nav>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-medium text-sm transition-all">
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {/* MAIN SYSTEM BODY WRAPPER */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {/* APP RUNTIME HEADER BLOCK */}
        <div className="flex justify-between items-center mb-8 relative">
          <div>
            <h1 className={`text-3xl font-extrabold tracking-tight transition-colors duration-300 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
              Welcome Back, {user.name}! 👋
            </h1>
            <p className="text-sm text-slate-500 mt-1">Here is your individual workspace overview for today.</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* Real-time Clock / Date Display */}
            <div className={`text-right border-r pr-6 hidden sm:block ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <p className={`text-base font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentTime}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>

            {/* Navbar Avatar Status Badge Indicator */}
            <div className="relative">
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`w-12 h-12 rounded-xl border flex items-center justify-center shadow-sm transition-all cursor-pointer select-none relative overflow-hidden ${
                  isDarkMode ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-base tracking-wider transition-colors shadow-inner">
                    {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : "EM"}
                  </div>
                )}
              </div>
              <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 z-10 ${isDarkMode ? 'border-slate-950' : 'border-white'} ${
                currentStatus === "Available" ? "bg-green-500" :
                currentStatus === "Busy" ? "bg-amber-500" : "bg-purple-500"
              }`}></span>

              {/* Floating Action Menu Dropdown Card */}
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => { setIsDropdownOpen(false); setIsStatusSelectorOpen(false); }}></div>
                  
                  <div className={`absolute right-0 mt-3 w-72 border rounded-2xl shadow-2xl py-3.5 z-20 transition-all ${
                    isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'
                  }`}>
                    
                    <div 
                      onClick={() => { setActiveTab("profile"); setIsDropdownOpen(false); }}
                      className={`mx-3 mb-2.5 p-3 rounded-xl border transition-all cursor-pointer flex items-center gap-3 group ${
                        isDarkMode ? 'border-slate-800/60 bg-slate-900/40 hover:bg-slate-900/80 hover:border-slate-700' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-100/80 hover:border-slate-200'
                      }`}
                    >
                      <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shadow-sm flex-shrink-0 overflow-hidden">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-blue-600 text-white flex items-center justify-center font-bold">
                            {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase() : "EM"}
                          </div>
                        )}
                      </div>
                      <div className="text-left overflow-hidden flex-1">
                        <p className={`text-sm font-bold truncate group-hover:text-blue-600 transition-colors ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                          {user.name}
                        </p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{user.email}</p>
                        <span className="inline-block mt-1.5 text-[10px] font-bold tracking-wider uppercase text-blue-600 dark:text-blue-400">
                          {user.designation}
                        </span>
                      </div>
                    </div>

                    {/* Collapsible Status Picker Row */}
                    <div className={`px-4 py-2.5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div 
                        onClick={() => setIsStatusSelectorOpen(!isStatusSelectorOpen)}
                        className="flex justify-between items-center cursor-pointer select-none group py-1"
                      >
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity Status</span>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            currentStatus === "Available" ? "bg-green-500" : currentStatus === "Busy" ? "bg-amber-500" : "bg-purple-500"
                          }`}></span>
                          <span className={`text-xs font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentStatus}</span>
                          <svg className={`w-3 h-3 text-slate-400 transition-transform ${isStatusSelectorOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>

                      {isStatusSelectorOpen && (
                        <div className="flex flex-col gap-1 mt-2.5 pl-1">
                          {["Available", "Busy", "Remote"].map((status) => (
                            currentStatus !== status && (
                              <button 
                                key={status}
                                onClick={() => { setCurrentStatus(status); setIsStatusSelectorOpen(false); setIsDropdownOpen(false); }}
                                className="w-full text-left text-xs px-2.5 py-1.5 rounded-lg font-medium text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900"
                              >
                                <span className={`w-1.5 h-1.5 rounded-full inline-block mr-2 ${status === "Available" ? "bg-green-500" : status === "Busy" ? "bg-amber-500" : "bg-purple-500"}`}></span> 
                                Set {status === "Busy" ? "In a Meeting" : status === "Remote" ? "Remote Work" : "Available"}
                              </button>
                            )
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Dark Mode Interface Toggle Switch */}
                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {isDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
                      </span>
                      <button 
                        onClick={() => setIsDarkMode(!isDarkMode)}
                        className={`w-10 h-5.5 rounded-full transition-colors p-0.5 flex items-center ${isDarkMode ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"}`}
                      >
                        <span className="w-4.5 h-4.5 rounded-full bg-white shadow-sm block"></span>
                      </button>
                    </div>
                    
                    <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-4 py-3 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 text-left font-bold transition-colors mt-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Sign Out Securely
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 🛠️ CENTRAL CORE RE-ROUTING COMPONENT LAYERS BLOCK */}
        {/* ======================================================== */}
        
        {/* SCREEN 1: PROFILE MANAGEMENT CONTROLLER */}
        {activeTab === "profile" && (
          <div className={`rounded-2xl border p-8 max-w-4xl mx-auto shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
            
            {/* AVATAR UPLOAD HUB */}
            <div className="flex flex-col items-center text-center mb-8 pb-8 border-b border-slate-100 dark:border-slate-800">
              <div className="relative group cursor-pointer w-28 h-28">
                <div className="w-full h-full bg-blue-600 text-white text-3xl font-bold rounded-full flex items-center justify-center shadow-md border-4 border-white dark:border-slate-900 overflow-hidden">
                  {formData.avatarUrl ? (
                    <img src={formData.avatarUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    formData.name ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase() : "EM"
                  )}
                </div>
                <label className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer">
                  <Camera className="w-6 h-6 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                </label>
              </div>
              <h2 className={`text-xl font-bold mt-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>{formData.name}</h2>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold tracking-wider uppercase mt-1">{formData.designation}</p>
            </div>

            {/* FORM INPUT ELEMENT HOOKS */}
            <form onSubmit={handleProfileSave} className="space-y-6">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">🏢 Corporate Metadata (Read-Only)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Employee Badge ID</label>
                    <input type="text" value={formData.id} disabled className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1.5">Company Email Handle</label>
                    <input type="email" value={formData.email} disabled className="w-full px-4 py-2.5 rounded-xl text-sm font-medium border cursor-not-allowed bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 focus:outline-none" />
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">👤 Personal Data Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Full Display Name</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500 outline-none' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600 outline-none'}`} />
                  </div>
                  <div>
                    <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Phone Contact Line</label>
                    <input type="tel" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500 outline-none' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600 outline-none'}`} />
                  </div>
                </div>
                <div>
                  <label className={`text-xs font-semibold block mb-1.5 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>Residential Mailing Address</label>
                  <textarea rows="2" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium border transition-all resize-none ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500 outline-none' : 'bg-white border-slate-200 text-slate-800 focus:border-blue-600 outline-none'}`}></textarea>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button type="button" onClick={() => setActiveTab("dashboard")} className={`px-5 py-2.5 rounded-xl text-xs font-bold border transition-colors ${isDarkMode ? 'border-slate-800 text-slate-400 hover:bg-slate-900' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>Cancel</button>
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition-colors">Save System Profile</button>
              </div>
            </form>
          </div>
        )}

        {/* SCREEN 2: MY ATTENDANCE HISTORICAL LOGS TAB */}
        {activeTab === "attendance" && (
          <div className="space-y-6 max-w-5xl mx-auto">
            
            {/* 1. OUR NEW VISUAL CALENDAR ENGINE & COUNTERS */}
            <AttendanceHub isDarkMode={isDarkMode} />

            {/* 2. YOUR ORIGINAL HISTORICAL LOGS TABLE */}
            <div className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-xl font-bold">Shift Clock Attendance History</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Comprehensive grid log audit record of active network punches.</p>
                </div>
                <button onClick={handleClockIn} className={`py-2 px-5 rounded-xl font-bold text-xs border transition-all ${isClockedIn ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-green-600 text-white border-transparent"}`}>
                  {isClockedIn ? "⛔ Quick Punch Out" : "⚡ Quick Punch In"}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-bold uppercase tracking-wider text-slate-400 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <th className="py-3 px-4">Calendar Date</th>
                      <th className="py-3 px-4">Clock In Punch</th>
                      <th className="py-3 px-4">Clock Out Punch</th>
                      <th className="py-3 px-4">Total Duration</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                    {attendanceLogs.map((log, i) => (
                      <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                        <td className="py-3.5 px-4">{log.date}</td>
                        <td className="py-3.5 px-4 text-green-600 dark:text-green-400">{log.clockIn}</td>
                        <td className="py-3.5 px-4 text-red-500">{log.clockOut}</td>
                        <td className="py-3.5 px-4 font-bold">{log.hours}</td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-md ${log.status === "Active Shift" ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400"}`}>
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* SCREEN 3: LEAVE REQUEST PROCESSOR ENGINE TAB */}
        {activeTab === "leaves" && (
          <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Allocation Form Panel */}
            <div className={`lg:col-span-1 rounded-2xl border p-6 h-fit ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h2 className="text-base font-bold mb-4">Request Time Off Leave</h2>
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Leave Classification</label>
                  <select value={newLeave.type} onChange={(e) => setNewLeave({...newLeave, type: e.target.value})} className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white focus:border-blue-500' : 'bg-white border-slate-200 focus:border-blue-600'}`}>
                    <option value="Annual Leave">Annual Vacation Leave</option>
                    <option value="Sick Leave">Medical Sick Leave</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">Start Date</label>
                    <input type="date" value={newLeave.start} onChange={(e) => setNewLeave({...newLeave, start: e.target.value})} className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'}`} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-400 block mb-1">End Date</label>
                    <input type="date" value={newLeave.end} onChange={(e) => setNewLeave({...newLeave, end: e.target.value})} className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'}`} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 block mb-1">Requested Total Days</label>
                  <input type="number" min="1" value={newLeave.days} onChange={(e) => setNewLeave({...newLeave, days: e.target.value})} className={`w-full px-3 py-2 text-sm rounded-xl border focus:outline-none ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200'}`} />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl transition-all shadow-sm">Submit Leave Request</button>
              </form>
            </div>

            {/* Allocation Balance Log View Table Container */}
            <div className={`lg:col-span-2 rounded-2xl border p-6 flex flex-col justify-between ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <h2 className="text-base font-bold mb-4">Historical Requests & Ledger Tracking</h2>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {leaveRequests.map((req) => (
                    <div key={req.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50/50 border-slate-100'}`}>
                      <div>
                        <p className="text-sm font-bold">{req.type}</p>
                        <p className="text-xs text-slate-400 mt-0.5">Timeline Range: {req.start} to {req.end} ({req.days} days)</p>
                      </div>
                      <span className={`text-[10px] uppercase font-extrabold px-2.5 py-1 rounded-md tracking-wider ${
                        req.status === "Approved" ? "bg-green-100 text-green-800 dark:bg-green-950/40 dark:text-green-400" : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400"
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dynamic balances summary row tracking state */}
              <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="text-left">
                  <span className="text-xs text-slate-400 font-semibold block">Total Pending/Approved Vacation Taken</span>
                  <p className="text-lg font-extrabold text-blue-600">{leaveRequests.filter(r => r.type === "Annual Leave").reduce((acc, curr) => acc + curr.days, 0)} Active Days</p>
                </div>
                <div className="text-left">
                  <span className="text-xs text-slate-400 font-semibold block">Total Medical Absence Taken</span>
                  <p className="text-lg font-extrabold text-purple-500">{leaveRequests.filter(r => r.type === "Sick Leave").reduce((acc, curr) => acc + curr.days, 0)} Active Days</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 4: ORIGINAL DASHBOARD VIEW LINK GRID LIST SYSTEM */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Shift Tracker Card */}
            <div className={`border p-6 rounded-2xl shadow-sm flex flex-col justify-between transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Shift Tracker</h3>
                  <Clock className={isClockedIn ? "text-green-500 animate-pulse" : "text-slate-400"} size={20} />
                </div>
                <p className="text-sm text-slate-400 mb-6">Log your working hours directly into the secure company network.</p>
              </div>
              <button 
                onClick={handleClockIn}
                className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all border ${
                  isClockedIn 
                    ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100" 
                    : "bg-green-600 text-white border-transparent hover:bg-green-700"
                }`}
              >
                {isClockedIn ? "⛔ Clock Out of Shift" : "⚡ Clock In to Shift"}
              </button>
            </div>

            {/* Leave Allocation Card */}
            <div className={`border p-6 rounded-2xl shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`font-semibold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Time-Off Allocation</h3>
                <button onClick={() => setActiveTab("leaves")} className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">Manage Leaves</button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-4 rounded-xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-xs text-slate-400 block mb-1">Annual Leave</span>
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {leaveBalances.annualMax - leaveRequests.filter(r => r.type === "Annual Leave" && r.status === "Approved").reduce((a,c) => a+c.days, 0)} / {leaveBalances.annualMax}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">Days remaining</span>
                </div>
                <div className={`p-4 rounded-xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-xs text-slate-400 block mb-1">Sick Leave</span>
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                    {leaveBalances.sickMax - leaveRequests.filter(r => r.type === "Sick Leave" && r.status === "Approved").reduce((a,c) => a+c.days, 0)} / {leaveBalances.sickMax}
                  </span>
                  <span className="text-xs text-slate-400 block mt-1">Days remaining</span>
                </div>
              </div>
            </div>

            {/* Assigned Tasks Card */}
            <div className={`border p-6 rounded-2xl shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className={`font-semibold mb-4 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>Assigned Tasks</h3>
              <div className="space-y-3">
                <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <CheckCircle2 size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Complete standard IT compliance module</p>
                    <span className="text-[10px] text-amber-600 font-semibold uppercase bg-amber-50 px-1.5 py-0.5 rounded">High Priority</span>
                  </div>
                </div>
                <div className={`flex items-start gap-3 p-3 rounded-xl border transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                  <CheckCircle2 size={16} className="text-slate-300 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className={`text-xs font-medium ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Submit quarterly self-evaluation performance report</p>
                    <span className="text-[10px] text-slate-500 font-semibold uppercase bg-slate-100 px-1.5 py-0.5 rounded">Due in 4 days</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default EmployeeDashboard;