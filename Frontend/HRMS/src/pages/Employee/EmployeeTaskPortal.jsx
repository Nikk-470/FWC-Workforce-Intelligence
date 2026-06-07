import React, { useState, useEffect } from "react";
import axios from "axios";
import { Calendar, CheckCircle2, Clock, ListTodo, AlertCircle, ChevronDown } from "lucide-react";

export default function EmployeeTaskPortal({ user }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("fwc_token"); 
      
      const res = await axios.get(`http://localhost:5000/api/tasks/employee/${user.employee_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
  
      if (res.data.success) {
        setTasks(res.data.tasks);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.employee_id) {
      fetchMyTasks();
    }
  }, [user]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const token = localStorage.getItem("fwc_token");
      
      setTasks(prevTasks => 
        prevTasks.map(task => 
          task._id === taskId ? { ...task, status: newStatus } : task
        )
      );

      await axios.patch(`http://localhost:5000/api/tasks/${taskId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Failed to update status on server:", err);
      fetchMyTasks();
    }
  };

  // Metric Computations for Summary Counters
  const totalCount = tasks.length;
  const completedCount = tasks.filter(t => t.status === "75-100%").length;
  const activeCount = totalCount - completedCount;

  const chronologicalGroups = tasks.reduce((groups, task) => {
    const date = task.assignedDateString || "Prior Deployments";
    if (!groups[date]) groups[date] = [];
    groups[date].push(task);
    return groups;
  }, {});

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-semibold text-slate-500 tracking-wide">Loading assignment matrix...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8 bg-slate-50/50 min-h-screen text-left">
      
      {/* HEADER NODE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/60 pb-5">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">My Operations Desk</h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">Active assignments and objectives deployed to your node.</p>
        </div>
        <div className="text-xs bg-indigo-50 border border-indigo-100/80 rounded-xl px-3.5 py-1.5 font-bold text-indigo-600 tracking-wide uppercase">
          Node Node: {user?.employee_id || "ENG-000"}
        </div>
      </div>

      {/* OVERVIEW ANALYTICS HUB */}
      {totalCount > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Total Targets</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">{totalCount}</h3>
            </div>
            <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl border border-slate-100"><ListTodo size={16} /></div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">In-Flight Actions</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">{activeCount}</h3>
            </div>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100"><Clock size={16} /></div>
          </div>
          <div className="bg-white border border-slate-200/60 p-4 rounded-2xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Validated Closed</p>
              <h3 className="text-xl font-black text-slate-800 mt-0.5">{completedCount}</h3>
            </div>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100"><CheckCircle2 size={16} /></div>
          </div>
        </div>
      )}

      {/* OPERATIONS STREAM */}
      {Object.keys(chronologicalGroups).length === 0 ? (
        <div className="border border-dashed border-slate-200/80 rounded-3xl p-16 text-center bg-white flex flex-col items-center max-w-xl mx-auto mt-10 shadow-xs">
          <div className="p-3 bg-slate-50 text-slate-400 rounded-2xl border border-slate-100 mb-3">
            <AlertCircle size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800">Operational Queue Empty</h4>
          <p className="text-xs text-slate-400 max-w-xs mt-1">No tasks or deployment parameters are configured for your account currently.</p>
        </div>
      ) : (
        Object.keys(chronologicalGroups).sort((a, b) => b.localeCompare(a)).map((calendarDate) => (
          <div key={calendarDate} className="bg-white rounded-2xl border border-slate-200/60 shadow-xs overflow-hidden">
            
            {/* Date Group Header */}
            <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200/60 flex items-center gap-2 text-slate-800 font-bold text-xs tracking-wide">
              <Calendar size={14} className="text-indigo-600" />
              <span>
                {new Date(calendarDate).toLocaleDateString('en-US', { 
                  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                })}
              </span>
            </div>

            {/* Tasks Interactive Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/20 text-[10px] font-black text-slate-400 border-b border-slate-100 uppercase tracking-widest select-none">
                    <th className="py-3 px-5 w-16 text-center">Index</th>
                    <th className="py-3 px-5">Deployment Objectives</th>
                    <th className="py-3 px-5 w-52 text-center">Execution Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {chronologicalGroups[calendarDate].map((task, index) => {
                    
                    // Style Matrix Evaluators
                    let selectStyle = "bg-slate-50 text-slate-700 border-slate-200/80 focus:ring-slate-400";
                    let progressWidth = "w-0";
                    let progressBg = "bg-slate-300";

                    if (task.status === "0-25%") {
                      selectStyle = "bg-rose-50 text-rose-700 border-rose-200/60 focus:ring-rose-400";
                      progressWidth = "w-1/4";
                      progressBg = "bg-rose-500";
                    } else if (task.status === "25-50%") {
                      selectStyle = "bg-amber-50 text-amber-700 border-amber-200/60 focus:ring-amber-400";
                      progressWidth = "w-1/2";
                      progressBg = "bg-amber-500";
                    } else if (task.status === "50-75%") {
                      selectStyle = "bg-sky-50 text-sky-700 border-sky-200/60 focus:ring-sky-400";
                      progressWidth = "w-3/4";
                      progressBg = "bg-sky-500";
                    } else if (task.status === "75-100%") {
                      selectStyle = "bg-emerald-50 text-emerald-700 border-emerald-200/60 focus:ring-emerald-400";
                      progressWidth = "w-full";
                      progressBg = "bg-emerald-500";
                    }

                    return (
                      <tr key={task._id} className="hover:bg-slate-50/40 transition-colors duration-150">
                        {/* Index Indicator */}
                        <td className="py-4 px-5 font-bold text-slate-300 text-center select-none">{index + 1}</td>
                        
                        {/* Task Content Matrix */}
                        <td className="py-4 px-5">
                          <div className="space-y-2 max-w-xl">
                            <span className="font-semibold text-slate-800 tracking-wide text-[13px] block leading-snug">
                              {task.title}
                            </span>
                            
                            {/* Inline Visual Progress Bar Track */}
                            <div className="flex items-center gap-3 select-none">
                              <div className="w-24 h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${progressBg} ${progressWidth} transition-all duration-300 rounded-full`} />
                              </div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                                Completion Span
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Status Select Controller */}
                        <td className="py-4 px-5 text-center">
                          <div className="relative inline-block w-full">
                            <select
                              value={task.status || "0-25%"}
                              onChange={(e) => handleStatusChange(task._id, e.target.value)}
                              className={`w-full text-center font-bold text-[11px] py-2 pl-3 pr-8 rounded-xl border cursor-pointer outline-none focus:ring-2 transition-all appearance-none tracking-wide ${selectStyle}`}
                            >
                              <option value="0-25%">⏳ 0 - 25%</option>
                              <option value="25-50%">🟡 25 - 50%</option>
                              <option value="50-75%">🔵 50 - 75%</option>
                              <option value="75-100%">✅ 75 - 100%</option>
                            </select>
                            <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-current pointer-events-none opacity-70" />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

          </div>
        ))
      )}
    </div>
  );
}