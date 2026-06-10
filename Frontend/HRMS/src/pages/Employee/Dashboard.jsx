import React, { useState, useEffect, useRef } from 'react'; // 💡 FIXED: Added missing useRef hook import
import { Clock, Calendar, FileText, CheckCircle2, User, LogOut, Camera, DollarSign, Check, X, ClipboardList, AlertCircle, RefreshCw, Video } from 'lucide-react';
import PayrollLedger from './Payroll'; 
import AttendanceHub from "./AttendanceHub";
import EmployeeNotification from './EmployeeNotification';
import EmployeeTaskPortal from './EmployeeTaskPortal';
import axios from 'axios'; 
import LeaveRequestPortal from "./LeaveRequestPortal";
import { io } from "socket.io-client";

const EmployeeDashboard = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("Available");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);
  
  // 💡 FIXED: Added missing states for profile error checking and attendance logs
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [attendanceLogs, setAttendanceLogs] = useState([]);

  const [user, setUser] = useState({
    _id: "",
    name: "Employee",
    email: "employee@company.com",
    employee_id: "",
    phone: "",
    role: "Staff Member",
    address: "",
    avatarUrl: null
  });

  useEffect(() => {
    try {
      const token = localStorage.getItem("fwc_token");
      if (!token) return;

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      
      const identityState = {
        _id: payload.id || payload._id || "",
        employee_id: payload.employee_id || "EMP-2026-0894",
        name: payload.name || "Employee",
        email: payload.email || "employee@company.com",
        role: payload.role || payload.designation || "Senior SDE",
        phone: payload.phone || "+1 (555) 234-5678",
        address: payload.address || "123 Technology Drive, Suite 400, Silicon Valley, CA",
        avatarUrl: payload.avatarUrl || null
      };

      setUser(identityState);
      setFormData(identityState); 
    } catch (error) {
      console.error("Failed parsing employee identity configuration token details:", error);
      
      const savedUser = localStorage.getItem("fwc_user");
      if (savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          const localState = {
            _id: parsedUser._id || parsedUser.id || "",
            name: parsedUser.name || "Employee",
            email: parsedUser.email || "employee@company.com",
            employee_id: parsedUser.employee_id || parsedUser._id || "EMP-2026-0894",
            phone: parsedUser.phone || "+1 (555) 234-5678",
            role: parsedUser.role || parsedUser.designation || "Senior SDE",
            address: parsedUser.address || "123 Technology Drive, Suite 400, Silicon Valley, CA",
            avatarUrl: parsedUser.avatarUrl || null
          };
          setUser(localState);
          setFormData(localState);
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, []);

  const [formData, setFormData] = useState({ ...user });
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const [activeTab, setActiveTab] = useState("dashboard");
  
  const [leaveBalances, setLeaveBalances] = useState({ annual: 14, annualMax: 18, sick: 6, sickMax: 8 });
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 1, type: "Annual Leave", start: "2026-07-10", end: "2026-07-14", days: 4, status: "Approved" },
    { id: 2, type: "Sick Leave", start: "2026-05-12", end: "2026-05-12", days: 1, status: "Approved" }
  ]);
  const [newLeave, setNewLeave] = useState({ type: "Annual Leave", start: "", end: "", days: 1 });

  const [tasks, setTasks] = useState([]);
  const [isTasksLoading, setIsTasksLoading] = useState(false);
  const [tasksError, setTasksError] = useState("");
  const [updatingTaskId, setUpdatingTaskId] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
  
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (activeTab === "profile") {
      setFormData({ ...user });
    }
  }, [activeTab, user]);

  const fetchEmployeeTasks = async () => {
    setIsTasksLoading(true);
    setTasksError("");
    try {
      const token = localStorage.getItem("fwc_token");
      const targetEmpId = user.employee_id || user._id;

      if (!targetEmpId) {
        setTasksError("Employee context identity missing. Please log in again.");
        setIsTasksLoading(false);
        return;
      }

      const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/tasks/my-tasks?empId=${targetEmpId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.success) {
        setTasks(response.data.tasks || []);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Error fetching assignments:", error);
      setTasksError("Backend routing for Tasks is offline or rejected the parameters.");
      setTasks([]); 
    } finally {
      setIsTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeTasks();
  }, [activeTab]);

  const handleUpdateTaskStatus = async (taskId, nextStatus) => {
    setUpdatingTaskId(taskId);
    try {
      const token = localStorage.getItem("fwc_token");
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/tasks/update-status/${taskId}`,
        { status: nextStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: nextStatus } : t));
      }
    } catch (err) {
      console.error("Failed to commit database state status transition:", err);
      alert("Could not update task on the backend server.");
    } finally {
      setUpdatingTaskId(null);
    }
  };

  const handleClockIn = () => {
    const now = new Date();
    if (!isClockedIn) {
      setIsClockedIn(true);
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
      setAttendanceLogs(prev => prev.map((log, index) => {
        if (index === 0 && log.status === "Active Shift") {
          return {
            ...log,
            clockOut: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            hours: "8.5h",
            status: "Present"
          };
        }
        return log;
      }));
    }
  };

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

  // 💡 FIXED: Updated profile submit loop to safely interact with form loading indicators
  const handleProfileSave = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileError("");
    setProfileSuccess(false);
    try {
      const token = localStorage.getItem("fwc_token");
      const response = await axios.put(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/profile/update", 
        {
          name: formData.name,
          email: user.email,
          phone: formData.phone,
          address: formData.address,
          avatarUrl: formData.avatarUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        setUser({ ...formData });
        const currentStoredUser = localStorage.getItem("fwc_user");
        if (currentStoredUser) {
          const parsed = JSON.parse(currentStoredUser);
          const updatedPackage = { ...parsed, ...formData };
          localStorage.setItem("fwc_user", JSON.stringify(updatedPackage));
        }
        setProfileSuccess(true);
        alert("Profile permanently saved to Database!");
        setActiveTab("dashboard");
      }
    } catch (error) {
      console.error("Database Save Error:", error);
      setProfileError(error.response?.data?.message || "Failed to update profile in database.");
    } finally {
      setIsUpdatingProfile(false);
    }
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
              onClick={() => setActiveTab("tasks")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "tasks" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <ClipboardList size={18} /> My Tasks 
            </button>

            <button 
              onClick={() => setActiveTab("meetings")}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                activeTab === "meetings" 
                  ? "bg-blue-600 text-white shadow-md" 
                  : isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Video size={18} /> My Media Desk
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
                activeTab === "leaves" ? "bg-blue-600 text-white shadow-md" : isDarkMode ? "text-slate-400 hover:bg-slate-900" : "text-slate-600 hover:bg-slate-50"
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
          
          <div className="flex items-center gap-5">
            <div className={`text-right border-r pr-5 hidden sm:block ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
              <p className={`text-base font-bold ${isDarkMode ? 'text-slate-200' : 'text-slate-700'}`}>{currentTime}</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            </div>

            <EmployeeNotification currentEmployeeId={user?.employee_id} />

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
                currentStatus === "Available" ? "bg-green-500" : currentStatus === "Busy" ? "bg-amber-500" : "bg-purple-500"
              }`}></span>

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
                          {user.role}
                        </span>
                      </div>
                    </div>

                    <div className={`px-4 py-2.5 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <div onClick={() => setIsStatusSelectorOpen(!isStatusSelectorOpen)} className="flex justify-between items-center cursor-pointer select-none group py-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Activity Status</span>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${currentStatus === "Available" ? "bg-green-500" : currentStatus === "Busy" ? "bg-amber-500" : "bg-purple-500"}`}></span>
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

                    <div className={`px-4 py-3 border-b flex items-center justify-between ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className={`text-xs font-semibold ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {isDarkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
                      </span>
                      <button onClick={() => setIsDarkMode(!isDarkMode)} className={`w-10 h-5.5 rounded-full transition-colors p-0.5 flex items-center ${isDarkMode ? "bg-blue-600 justify-end" : "bg-slate-200 justify-start"}`}>
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

        {/* SCREEN 1: CORE DASHBOARD VIEW */}
        {activeTab === "dashboard" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className={`lg:col-span-2 rounded-2xl border p-6 shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                  <Clock size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Shift Attendance Tracking</h2>
                  <p className="text-xs text-slate-400 mt-0.5">Punch in or out to log your shift securely.</p>
                </div>
              </div>
              
              <div className={`p-6 rounded-2xl text-center border mb-6 transition-colors ${isDarkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-3xl font-mono font-bold tracking-wider">{currentTime}</p>
                <p className="text-xs text-slate-400 mt-1">Current system timestamp alignment</p>
                <button 
                  onClick={handleClockIn}
                  className={`mt-4 py-3 px-8 rounded-xl font-bold text-sm shadow-md transition-all transform active:scale-95 ${
                    isClockedIn 
                      ? "bg-amber-50 hover:bg-amber-600 text-white" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  {isClockedIn ? "⛔ Clock Out Current Shift" : "⚡ Clock In Shift Now"}
                </button>
              </div>
            </div>

            <div className={`rounded-2xl border p-6 shadow-sm transition-all duration-300 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Assigned Task Deck</h3>
                <button onClick={() => setActiveTab("tasks")} className="text-xs font-bold text-blue-600 hover:underline">View All</button>
              </div>
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <div className="text-center py-6 border border-dashed rounded-xl border-slate-200 dark:border-slate-800">
                    <CheckCircle2 size={24} className="text-emerald-500 mx-auto mb-2" />
                    <p className="text-xs font-medium text-slate-400">All clean! No urgent tasks pending.</p>
                  </div>
                ) : (
                  tasks.slice(0, 3).map((task) => (
                    <div key={task._id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${isDarkMode ? 'bg-slate-900/60 border-slate-800/80' : 'bg-slate-50 border-slate-100'}`}>
                      <CheckCircle2 size={16} className={`mt-0.5 flex-shrink-0 ${task.status === "Completed" ? "text-emerald-500" : "text-slate-300"}`} />
                      <div className="overflow-hidden flex-1">
                        <p className="text-xs font-semibold truncate">{task.title}</p>
                        <div className="flex gap-1.5 mt-1">
                          <span className={`text-[9px] font-bold px-1 py-0.5 rounded uppercase ${
                            task.priority === "High" ? "bg-red-50 text-red-600 border border-red-100" :
                            task.priority === "Medium" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            "bg-slate-100 text-slate-600"
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* SCREEN 2: TASKS PORTAL VIEW */}
        {activeTab === "tasks" && user._id && (
          <EmployeeTaskPortal user={user} />
        )}

        {/* SCREEN EXTRA: WEBRTC MEDIA DESK */}
        {activeTab === "meetings" && user.employee_id && (
          <EmployeeMeetingDesk user={user} isDarkMode={isDarkMode} />
        )}

        {/* SCREEN 3: PROFILE */}
        {activeTab === "profile" && (
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`p-6 rounded-2xl border text-center ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <div className="relative w-24 h-24 mx-auto mb-4 group">
                <img src={user.avatarUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256"} alt="Profile" className="w-full h-full rounded-full object-cover border-2 border-blue-500" />
                <button className="absolute bottom-0 right-0 p-1.5 bg-blue-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={12} />
                </button>
              </div>
              <h3 className="font-bold text-sm">{user.name}</h3>
              <p className="text-[11px] text-slate-400 font-medium capitalize mt-0.5">{user.role}</p>
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <div className="flex justify-between text-[11px] mb-2">
                  <span className="text-slate-400">Node ID</span>
                  <span className="font-bold font-mono">{user.employee_id || "N/A"}</span>
                </div>
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400">Status Vector</span>
                  <span className="text-emerald-500 font-bold flex items-center gap-1">● {currentStatus}</span>
                </div>
              </div>
            </div>

            <div className={`md:col-span-2 p-6 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
              <h3 className="text-sm font-bold mb-4">Profile Synchronization Fields</h3>
              {/* 💡 FIXED: Replaced loose form variables with mapped formData attributes safely */}
              <form onSubmit={handleProfileSave} className="space-y-4 text-left">
                {profileSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 flex items-center gap-2">
                    <CheckCircle2 size={14} /> Profile fields successfully synced to database.
                  </div>
                )}
                {profileError && (
                  <div className="p-3 bg-amber-50 text-amber-700 text-xs font-semibold rounded-xl border border-amber-200 flex items-center gap-2">
                    <AlertCircle size={14} /> {profileError}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Full Name Reference</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 text-xs rounded-xl border bg-slate-50/50 dark:bg-slate-900/50" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Corporate Email Address</label>
                    <input type="email" value={formData.email} className="w-full px-3 py-2 text-xs rounded-xl border bg-slate-100 text-slate-400 dark:bg-slate-900/80 cursor-not-allowed" disabled />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Secure Contact Number</label>
                    <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="w-full px-3 py-2 text-xs rounded-xl border dark:bg-slate-900" />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 block mb-1">Physical Residential Node Address</label>
                    <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="w-full px-3 py-2 text-xs rounded-xl border dark:bg-slate-900" />
                  </div>
                </div>
                <div className="pt-2">
                  <button type="submit" disabled={isUpdatingProfile} className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-md hover:bg-blue-700 transition-colors disabled:opacity-50">
                    {isUpdatingProfile ? "Synchronizing database records..." : "Commit Document Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SCREEN 4: ATTENDANCE */}
        {activeTab === "attendance" && (
          <AttendanceHub user={user} />
        )}

        {/* SCREEN 5: LEAVES */}
        {activeTab === "leaves" && (
          <LeaveRequestPortal user={user} isDarkMode={isDarkMode} />
        )}

        {/* SCREEN 6: PAYROLL */}
        {activeTab === "payroll" && (
          <div className="max-w-5xl mx-auto">
            <PayrollLedger user={user} isDarkMode={isDarkMode} />
          </div>
        )}
      </div>
    </div>
  );
};

function EmployeeMeetingDesk({ user, isDarkMode }) {
  const [meetings, setMeetings] = useState([]);
  const [activeCallId, setActiveCallId] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [streamInstance, setStreamInstance] = useState(null);

  // 🟢 WebRTC Live Signaling Client Object References
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const iceServersConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };

  const fetchRooms = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/meetings/employee/${user.employee_id}`);
      if (res.data.success) setMeetings(res.data.meetings);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchRooms(); const loop = setInterval(fetchRooms, 10000); return () => clearInterval(loop); }, [user]);

  // 🟢 Captures webcam & hooks the incoming offer/answer pipeline
  const launchNativeMediaTracks = async (roomId) => {
    try {
      setActiveCallId(roomId);

      // 1. Instantly connect to backend WebSocket gateway
      socketRef.current = io(`${import.meta.env.VITE_API_BASE_URL}");

      // 2. Spin up native hardware trackers
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStreamInstance(stream);
      if (localVideoRef.current) localVideoRef.current.srcObject = stream;

      // 3. Spin up local WebRTC connection stack
      peerConnectionRef.current = new RTCPeerConnection(iceServersConfig);
      stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));

      peerConnectionRef.current.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      // 4. Respond directly to the Manager browser's session parameters
      socketRef.current.on("incoming-offer", async (sdp) => {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        socketRef.current.emit("video-answer", { roomId, sdp: answer });
      });

      socketRef.current.on("incoming-ice-candidate", async (candidate) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

      socketRef.current.emit("join-room", roomId);

    } catch (err) {
      console.error(err);
      alert("Could not initialize local optical media hardware.");
    }
  };

  const endNativeCallLoop = () => {
    if (streamInstance) streamInstance.getTracks().forEach(t => t.stop());
    if (peerConnectionRef.current) peerConnectionRef.current.close();
    if (socketRef.current) socketRef.current.disconnect();
    setStreamInstance(null);
    setActiveCallId(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 text-left">
      <div>
        <h2 className="text-xl font-black tracking-tight">My Media Operations Desk</h2>
        <p className="text-xs font-medium text-slate-400 mt-0.5">Secure, native communication room matrix connected to your cluster group.</p>
      </div>

      {!activeCallId ? (
        <div className="bg-white rounded-2xl border border-slate-200/60 p-5 space-y-3">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Available Group Streams</p>
          {meetings.length === 0 ? (
            <div className="text-center py-12 text-xs italic text-slate-400 border border-dashed rounded-xl">No active channels or call requests flagged for your department.</div>
          ) : (
            meetings.map(m => (
              <div key={m._id} className="p-4 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                <div>
                  <h4 className="text-sm font-bold text-slate-800">{m.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Hosted by Manager: {m.managerName} ({m.department})</p>
                </div>
                <button onClick={() => launchNativeMediaTracks(m.roomId)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors">
                  Join Call Now
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl relative">
          <div className="absolute top-4 left-4 bg-red-600 text-white text-[9px] font-mono tracking-widest uppercase font-bold px-2.5 py-0.5 rounded-full z-20 animate-pulse">
            • Live Native Internal Link Active
          </div>

          <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative border border-slate-800 flex items-center justify-center">
            <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-slate-300 px-2 py-0.5 rounded border border-slate-800">My Video (Local Source)</span>
          </div>

          <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative border border-slate-800 flex items-center justify-center">
            <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-slate-300 px-2 py-0.5 rounded border border-slate-800 z-20">Manager Feed (Remote Asset)</span>
          </div>

          <div className="md:col-span-2 flex justify-center border-t border-slate-800/80 pt-4 mt-2">
            <button onClick={endNativeCallLoop} className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl uppercase tracking-wider shadow-lg">
              Disconnect from Stream
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeDashboard;