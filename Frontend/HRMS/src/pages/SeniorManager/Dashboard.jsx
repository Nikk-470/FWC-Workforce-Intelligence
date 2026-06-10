import React, { useState, useEffect } from "react";
import { Users, CheckSquare, Calendar, Plus, UserPlus, Check, X, FolderPlus, Layers, Loader2, User, Phone, MapPin, Briefcase } from "lucide-react";
import axios from "axios";
import SMSidebar from "./SMSidebar";
import ManagerNotification from "./ManagerNotification";
import { io } from "socket.io-client";

export default function SeniorManagerDashboard() {
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState("");

  const [isSidebarVisible, setIsSidebarVisible] = useState(true);
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard", "teamDeck", "taskDeck", "profile"

  const [teams, setTeams] = useState(["All Teams"]);
  const [selectedTeamFilter, setSelectedTeamFilter] = useState("All Teams");
  const [viewingTeamDetails, setViewingTeamDetails] = useState(null);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
 
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [managerUser, setManagerUser] = useState({
    _id: "", employee_id: "", name: "", email: "", role: "", department: "", phone: "", address: "", avatarUrl: ""
  });
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [profileSuccessMessage, setProfileSuccessMessage] = useState("");

  // Linked backend operational variables state
  const [tasks, setTasks] = useState([]);
  const [requisitions, setRequisitions] = useState([
    { id: 1, position: "Senior React Developer", slots: 1, status: "Sourcing Candidates" }
  ]);
  const [leaveRequests, setLeaveRequests] = useState([
    { id: 501, employee: "Rohan Das", type: "Sick Leave", duration: "2 days", date: "June 08 - June 09" }
  ]);

  // Form Fields
  const [newTeamName, setNewTeamName] = useState("");
  const [newTaskTitle, setNewTaskTitle] = useState("");
  
  // ⚡ New Variable Pipelines: Scope controls if assigning to entire team cluster or individual context
  const [taskScope, setTaskScope] = useState("Individual"); // "Individual" or "Team"
  const [targetTaskTeamName, setTargetTaskTeamName] = useState("");
  const [newTaskAssigneeId, setNewTaskAssigneeId] = useState("");
  const [newTaskPriority, setNewTaskPriority] = useState("Medium");
  const [newRoleTitle, setNewRoleTitle] = useState("");

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  // Fetch initial system configuration details
  const fetchDashboardData = async (targetManagerId) => {
    setIsLoading(true);
    setBackendError("");
    try {
      const token = localStorage.getItem("fwc_token");

      // 1. Grab all registered workspace employees
      const empRes = await axios.get("Frontend/HRMS/src/**/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(empRes.data);

      // 2. Grab your custom managed database teams
      const teamRes = await axios.get(`Frontend/HRMS/src/**/api/teams?managerId=${targetManagerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (teamRes.data.success && Array.isArray(teamRes.data.teams)) {
        // Extract string 'name' from each MongoDB team document object
        const dbTeamNames = teamRes.data.teams.map(teamObj => teamObj.name);
        
        // Lock them into your state array alongside "All Teams"
        setTeams(["All Teams", ...dbTeamNames]);
      }
    } catch (err) {
      console.error("MongoDB Dashboard Fetch Error:", err);
      setBackendError("Failed to sync workforce metrics with MongoDB cluster variables.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    try {
      const token = localStorage.getItem("fwc_token");
      if (!token) return;

      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(window.atob(base64));
      const activeManagerId = payload.id || "";

      setManagerUser({
        _id: activeManagerId,
        employee_id: payload.employee_id || "MGR001",
        name: payload.name || "Senior Manager",
        email: payload.email || "manager@company.com",
        role: payload.role || "Manager",
        department: payload.department || "Operations",
        phone: payload.phone || "",
        address: payload.address || "",
        avatarUrl: payload.avatarUrl || ""
      });

      fetchDashboardData(activeManagerId);
    } catch (error) {
      console.error("Failed parsing authentication token context metadata:", error);
    }
  }, []);

  // Department-Level Filter Isolation Logic
  const departmentEmployees = employees.filter(
    emp => emp.department?.toLowerCase() === managerUser.department?.toLowerCase()
  );

  const visibleEmployees = selectedTeamFilter === "All Teams" 
    ? departmentEmployees 
    : departmentEmployees.filter(emp => emp.team === selectedTeamFilter);

  useEffect(() => {
    if (visibleEmployees.length > 0) {
      setNewTaskAssigneeId(visibleEmployees[0]._id || visibleEmployees[0].employee_id);
    } else {
      setNewTaskAssigneeId("");
    }
  }, [selectedTeamFilter, employees]);

  // Profile submission handler
  const handleUpdateManagerProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    setProfileSuccessMessage("");
    try {
      const token = localStorage.getItem("fwc_token");
      await axios.put(`Frontend/HRMS/src/**/api/employees/${managerUser._id}`, {
        phone: managerUser.phone,
        address: managerUser.address
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfileSuccessMessage("Profile parameters updated successfully inside MongoDB cluster index.");
    } catch (err) {
      console.error(err);
      alert("Failed updating personal manager records securely.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Create separated isolated team
  // Create separated isolated team and persist to MongoDB
const handleCreateTeam = async (e) => {
  e.preventDefault();
  const trimmedName = newTeamName.trim();
  
  if (!trimmedName) return;
  if (!managerUser?._id) return alert("Identity metrics refreshing.");
  if (teams.includes(trimmedName)) return alert("Cluster verified already.");

  try {
    const token = localStorage.getItem("fwc_token");
    const response = await axios.post(
      "Frontend/HRMS/src/**/api/teams", 
      {
        name: trimmedName,
        managerId: managerUser._id
      }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Persist immediately across layout instances matching MongoDB properties
    if (response.data.success) {
      // Fallback check to safely parse string whether payload sends 'teamName', 'team', or raw inputs
      const savedTeamName = response.data.teamName || response.data.team?.name || trimmedName;
      
      setTeams((prevTeams) => {
        if (prevTeams.includes(savedTeamName)) return prevTeams;
        return [...prevTeams, savedTeamName];
      });
      
      setSelectedTeamFilter(savedTeamName); 
      setNewTeamName("");
      
      // Optional: Re-fetch dashboard indices to ensure full operational sync
      if (managerUser._id) {
        fetchDashboardData(managerUser._id);
      }
    }
  } catch (err) {
    console.error("MongoDB Persistence Error:", err);
    alert(err.response?.data?.message || "Failed saving separate tracking cluster node.");
  }
};

  // Add Member to Team Execution Node
  const handleAddMemberToTeam = async (employeeId) => {
    try {
      const token = localStorage.getItem("fwc_token");
      
      // Update employee's team allocation in MongoDB
      const response = await axios.put(`Frontend/HRMS/src/**/api/employees/${employeeId}`, {
        team: viewingTeamDetails // Assigns them to the active team string name (e.g. "Alpha")
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        alert("Employee successfully allocated to this cluster pod!");
        
        // 🔥 RE-FETCH IMMEDIATELY: Syncs all database metrics and updates your team member listing instantly
        if (managerUser?._id) {
          await fetchDashboardData(managerUser._id);
        }
      }
    } catch (err) {
      console.error("Error adding member to team:", err);
      alert("Failed to update employee's cluster assignment node.");
    }
  };

  // Remove Member from Team Execution Node
  const handleRemoveMemberFromTeam = async (employeeId) => {
    try {
      const token = localStorage.getItem("fwc_token");
      
      // Clearing the team field sets them back to an unassigned department asset
      const response = await axios.put(`Frontend/HRMS/src/**/api/employees/${employeeId}`, {
        team: "" 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data) {
        alert("Employee removed from this cluster pod.");
        
        // Re-sync instantly
        if (managerUser?._id) {
          await fetchDashboardData(managerUser._id);
        }
      }
    } catch (err) {
      console.error("Error removing member from team:", err);
      alert("Failed to clear employee cluster assignment node.");
    }
  };

  // 🚀 CORE DISPATCH HANDLER: PUSH TASK AND NOTIFICATION LOGS TO MONGO CLUSTER
  const handleAssignTask = async (e) => {
    if (e && typeof e.preventDefault === "function") {
      e.preventDefault();
    }

    const trimmedTitle = newTaskTitle ? newTaskTitle.trim() : "";
    if (!trimmedTitle) {
      alert("Please specify a task description requirement.");
      return;
    }

    try {
      const token = localStorage.getItem("fwc_token");
      setIsSyncingDb(true);

      // Determine the team name context safely (using your active scope or state)
      const currentTeamScope = viewingTeamDetails || targetTaskTeamName || "SDE";

      if (taskScope === "Team") {
        const response = await axios.post(
          "Frontend/HRMS/src/**/api/tasks/assign",
          {
            title: trimmedTitle,
            description: "Deploys automatically via sprint workflow manager panel.",
            priority: "High",
            assignmentType: "Team",
            targetTeam: currentTeamScope,
            managerId: managerUser?._id || "ManagerCoreID",
            managerName: managerUser?.name || "Sarah Manager"
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data.success) {
          alert(`Task pipeline successfully deployed to all members in ${currentTeamScope}!`);
          setNewTaskTitle("");
        }
      } else {
        if (!newTaskAssigneeId) {
          alert("Please select a target employee element from the roster.");
          return;
        }

        const response = await axios.post(
          "Frontend/HRMS/src/**/api/tasks/assign",
          {
            title: trimmedTitle,
            description: "Dedicated single workflow item assignment.",
            priority: "Medium",
            assignmentType: "Individual",
            targetEmployeeId: newTaskAssigneeId,
            managerId: managerUser?._id || "ManagerCoreID",
            managerName: managerUser?.name || "Sarah Manager"
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data && response.data.success) {
          alert("Individual task pipeline successfully created!");
          setNewTaskTitle("");
          setNewTaskAssigneeId("");
        }
      }
    } catch (err) {
      console.error("Pipeline Dispatch Error:", err);
      alert(err.response?.data?.message || "Failed to dispatch workflow pipeline structures across nodes.");
    } finally {
      setIsSyncingDb(false);
    }
  };
  const handleRaiseRequisition = (e) => {
    e.preventDefault();
    if (!newRoleTitle.trim()) return;
    setRequisitions([...requisitions, { id: Date.now(), position: newRoleTitle, slots: 1, status: "Sent to Recruiter" }]);
    setNewRoleTitle("");
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-x-hidden">
      <SMSidebar 
        isSidebarVisible={isSidebarVisible} setIsSidebarVisible={setIsSidebarVisible} 
        activeView={activeView} setActiveView={setActiveView} 
        onTeamChange={setSelectedTeamFilter} currentSelectedTeam={selectedTeamFilter} 
      />
     
      <div className={`flex-1 overflow-x-hidden p-6 mt-14 lg:mt-0 transition-all duration-300 space-y-6 ${isSidebarVisible ? "lg:pl-72" : "pl-6"}`}>
        
        {/* Top Header Control Matrix */}
        <div className="flex flex-row justify-between items-center gap-4 pt-4 lg:pt-0 border-b border-slate-200/60 pb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">{getGreeting()}, {managerUser?.name}</h1>
            <p className="text-sm text-slate-500">{managerUser?.role} • {managerUser?.department} Administration Gateway</p>
          </div>
          
          <div className="flex items-center gap-5">
            <ManagerNotification />
            <div className="relative">
              <button onClick={() => setIsDropdownOpen(!isDropdownOpen)} className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-sm overflow-hidden border border-indigo-200">
                {managerUser.avatarUrl ? <img src={managerUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : managerUser.name.slice(0,2).toUpperCase()}
              </button>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                  <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-100 rounded-2xl shadow-xl py-2 z-20">
                    <div className="px-4 py-2.5 border-b border-slate-50">
                      <p className="text-xs font-bold text-slate-800">{managerUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{managerUser.email}</p>
                    </div>
                    <button onClick={() => { setActiveView("profile"); setIsDropdownOpen(false); }} className="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50 font-semibold flex items-center gap-2"><User size={13} className="text-indigo-500" /> View Individual Profile</button>
                    <button onClick={() => { localStorage.clear(); window.location.href = "/"; }} className="w-full text-left px-4 py-2 text-xs text-red-600 hover:bg-red-50 font-semibold flex items-center gap-2 mt-1 border-t border-slate-50"><X size={13} /> Sign Out</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* VIEW MODULE A: DASHBOARD CONTROL PANEL */}
        {activeView === "dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-slate-700">
                <FolderPlus size={18} className="text-indigo-600" />
                <span className="text-sm font-semibold">Establish Operational Cluster Group:</span>
              </div>
              <form onSubmit={handleCreateTeam} className="flex gap-2 flex-1 max-w-md">
                <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="e.g., Core DevOps, UI/UX Pod, Inbound Sales..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none text-slate-700" />
                <button type="submit" className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-medium px-4 py-1.5 rounded-xl whitespace-nowrap">Deploy Team Branch</button>
              </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Department Workers</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">{isLoading ? "..." : departmentEmployees.length}</h3>
                  <p className="text-xs text-emerald-600 font-medium mt-1">● Synced to {managerUser.department}</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600"><Users size={24} /></div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Clusters</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">{teams.filter(t => t !== "All Teams").length} Active</h3>
                  <p className="text-xs text-slate-500 mt-1">Isolated workspace active</p>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-amber-600"><Layers size={24} /></div>
              </div>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Leave Authorizations</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-1">{leaveRequests.length} Pending</h3>
                  <p className="text-xs text-slate-500 mt-1">Pending approval nodes</p>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl text-rose-600"><Calendar size={24} /></div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                
                {/* 🛠️ TASK ASSIGNMENT BLOCK WITH TEAM BROADCAST INTEGRATION */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-4">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <CheckSquare size={18} className="text-indigo-600" /> Task Delegation Pipeline Control
                    </h2>
                    
                    {/* Toggle Switch between assigning to a single person or broadcasting to a complete team */}
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button type="button" onClick={() => setTaskScope("Individual")} className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${taskScope === "Individual" ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-400"}`}>Individual</button>
                      <button type="button" onClick={() => setTaskScope("Team")} className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${taskScope === "Team" ? "bg-white text-indigo-600 shadow-3xs" : "text-slate-400"}`}>Entire Team</button>
                    </div>
                  </div>
                 
                  <form onSubmit={handleAssignTask} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="md:col-span-3">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Task Objective Deliverable Title</label>
                      <input type="text" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Specify deliverable target instructions..." className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 font-medium text-slate-700" />
                    </div>
                    
                    {taskScope === "Individual" ? (
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Select Department Assignee</label>
                        <select value={newTaskAssigneeId} onChange={(e) => setNewTaskAssigneeId(e.target.value)} disabled={departmentEmployees.length === 0} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm outline-none text-slate-700 disabled:opacity-50">
                          {departmentEmployees.length === 0 ? <option value="">No department personnel</option> : departmentEmployees.map(emp => (
                            <option key={emp._id} value={emp._id}>{emp.name} [{emp.team || "No Team Assigned"}]</option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Target Cluster Team</label>
                        <select value={targetTaskTeamName} onChange={(e) => setTargetTaskTeamName(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm outline-none text-slate-700">
                          <option value="">-- Choose Target Team --</option>
                          {teams.filter(t => t !== "All Teams").map((teamName, idx) => (
                            <option key={idx} value={teamName}>{teamName}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Priority Weights</label>
                      <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-sm outline-none text-slate-700">
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                    
                    <div className="flex items-end">
                      <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm">
                        <Plus size={14} /> Dispatch Assignment
                      </button>
                    </div>
                  </form>

                  <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                    {tasks.map(task => (
                      <div key={task.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50 transition-colors">
                        <div className="space-y-0.5 max-w-[65%]">
                          <p className="text-sm font-medium text-slate-700 line-clamp-1">{task.title}</p>
                          <p className="text-xs text-slate-400">Target Object: <span className="font-bold text-slate-600">{task.assignee}</span> | Scope Group: <span className="italic text-indigo-500 font-bold">{task.team}</span></p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${task.priority === "High" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>{task.priority}</span>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[10px] font-medium">{task.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
                  <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2"><UserPlus size={18} className="text-indigo-600" /> Talent Acquisition Pipeline Link</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <form onSubmit={handleRaiseRequisition} className="space-y-3 bg-slate-50 rounded-2xl p-4 border border-slate-100 h-fit">
                      <p className="text-xs font-semibold text-slate-600">Dispatch Headcount Request</p>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Target Role Designation</label>
                        <input type="text" value={newRoleTitle} onChange={(e) => setNewRoleTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none text-slate-700 mt-1" />
                      </div>
                      <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium text-xs py-2 rounded-xl">Push To Recruiter Queue</button>
                    </form>
                    <div className="md:col-span-2 space-y-2 max-h-48 overflow-y-auto pr-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Live Recruiter Pipelines</p>
                      {requisitions.map(req => (
                        <div key={req.id} className="flex justify-between items-center p-3 rounded-xl bg-white border border-slate-100">
                          <div>
                            <p className="text-xs font-bold text-slate-700">{req.position}</p>
                            <p className="text-[10px] text-slate-400">Allocation: 1 Active Slot Node</p>
                          </div>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full text-[10px] font-bold uppercase">{req.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-100">
                  <div className="space-y-3 mb-4">
                    <div className="flex justify-between items-center">
                      <h2 className="text-base font-bold text-slate-800 flex items-center gap-2"><Users size={18} className="text-indigo-600" /> Team Layout Roster ({isLoading ? "..." : visibleEmployees.length})</h2>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Filter View By Team Segment</label>
                      <select value={selectedTeamFilter} onChange={(e) => setSelectedTeamFilter(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold outline-none text-slate-700 cursor-pointer">
                        {teams.map((teamName, idx) => (
                          <option key={idx} value={teamName}>{teamName}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {isLoading ? (
                      <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2 text-xs font-medium"><Loader2 className="animate-spin text-indigo-600" size={18} />Querying indices...</div>
                    ) : visibleEmployees.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">No active personnel assigned to this filter.</div>
                    ) : (
                      visibleEmployees.map(emp => (
                        <div key={emp._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100/70">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                            <p className="text-[10px] text-slate-400 font-medium">{emp.role} • <span className="font-bold text-indigo-600">{emp.department}</span></p>
                          </div>
                          <span className="text-[9px] bg-white border border-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold">{emp.team || "No Cluster"}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-100">
                  <h2 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2"><Calendar size={18} className="text-indigo-600" /> Leave Authorizations Queue</h2>
                  {leaveRequests.map(req => (
                    <div key={req.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-bold text-slate-700">{req.employee}</p>
                          <p className="text-[10px] text-indigo-600 font-bold">{req.type} ({req.duration})</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-bold font-mono">{req.date}</span>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button className="flex-1 bg-indigo-600 text-white text-[11px] font-semibold py-1.5 rounded-lg flex items-center justify-center gap-1"><Check size={12} /> Grant</button>
                        <button className="px-3 bg-white border border-slate-200 text-slate-400 text-[11px] rounded-lg flex items-center justify-center"><X size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Add this render layout check right next to your activeView blocks inside the dashboard wrapper main container body */}
{activeView === "meetings" && (
  <ManagerMeetingControlPanel 
    managerUser={managerUser} 
    teams={teams} 
    departmentEmployees={departmentEmployees} 
  />
)}

        {/* VIEW MODULE B: CLUSTER MANAGEMENT DECK */}
        {activeView === "teamDeck" && (
  <div className="space-y-6 animate-in fade-in duration-200">
    {isSyncingDb && (
      <div className="fixed top-4 right-4 bg-slate-950 text-white text-xs px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-lg border border-slate-800 z-50 animate-bounce">
        <Loader2 className="animate-spin text-indigo-400" size={14} /> Saving to MongoDB Cluster...
      </div>
    )}

    {!viewingTeamDetails ? (
      <>
        {/* 🔥 i. ENHANCED HIGH-IMPACT PREMIUM HERO BANNER FOR TEAM CLUSTERS */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 border border-indigo-500/20 shadow-xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.12),transparent_50%)]"></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight">
                Team Clusters Control Hub
              </h2>
              <p className="text-indigo-200/70 text-xs font-medium mt-1.5 max-w-xl leading-relaxed">
                Architect tactical pods, sync operational department branches, manage workflow distribution structures, and track real-time workforce alignment.
              </p>
            </div>
          </div>
        </div>

        {/* Create Cluster Card Layer */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
            <Plus size={16} className="text-indigo-600" /> Provision New Cluster Pod
          </h2>
          <form onSubmit={handleCreateTeam} className="flex gap-3 max-w-md">
            <input 
              type="text" 
              value={newTeamName} 
              onChange={(e) => setNewTeamName(e.target.value)} 
              placeholder="Enter team designation name..." 
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs outline-none text-slate-700 focus:border-indigo-500 transition-colors" 
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-5 py-2 rounded-xl whitespace-nowrap transition-all shadow-sm active:scale-95">
              Create Team
            </button>
          </form>
        </div>

        {/* Active Grid Roster List */}
        {/* Active Grid Roster List */}
       {/* Active Grid Roster List */}
       <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Active Managed Teams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {teams.filter(t => t !== "All Teams").map((teamName, idx) => {
              
              // Safely look inside the loaded employees array list
              const currentRoster = employees || [];
              const clusterCount = currentRoster.filter(emp => emp && emp.team === teamName).length;

              return (
                <div 
                  key={idx} 
                  onClick={() => {
                    setViewingTeamDetails(teamName);
                    setTaskScope("Team"); 
                    setTargetTaskTeamName(teamName);
                  }} 
                  className="p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:border-indigo-300 hover:bg-indigo-50/10 transition-all cursor-pointer group flex flex-col justify-between min-h-[120px]"
                >
                  <div>
                    <h3 className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors text-sm">
                      {teamName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      {clusterCount} Active Members Assigned
                    </p>
                  </div>
                  <span className="text-[10px] bg-white border border-slate-200 text-slate-500 px-2 py-1 rounded-lg font-semibold group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all w-fit mt-3 shadow-2xs">
                    Open Dashboard View →
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </>
    ) : (
      <>
        {/* Isolated Cluster Specific Views */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-4 lg:pt-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setViewingTeamDetails(null)} 
              className="bg-white text-slate-600 border border-slate-200 text-xs font-semibold px-3 py-1.5 rounded-xl hover:bg-slate-50 transition-colors shadow-2xs"
            >
              ← Back to Clusters
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">{viewingTeamDetails}</h1>
              <p className="text-xs text-slate-400 mt-0.5">Roster control bounds for this isolated division node branch</p>
            </div>
          </div>
          <button 
            onClick={() => setIsAddMemberModalOpen(true)} 
            className="bg-indigo-600 text-white text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <UserPlus size={14} /> Add Team Member
          </button>
        </div>

        {/* 🛠️ ii & iii. PIPELINE CONTROLLER PANEL */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 mt-4">
          <div className="mb-3">
            <h3 className="text-sm font-bold text-slate-800">Task Dispatch Engine</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Deploy synchronized deliverables or route specific assignments directly down the stack.</p>
          </div>
          
          <div className="p-4 bg-slate-50/60 rounded-2xl border border-slate-200/60 max-w-2xl">
            <div className="flex gap-2 mb-3 bg-slate-200/50 p-1 rounded-xl w-fit">
              <button 
                type="button" 
                onClick={() => { setTaskScope("Team"); setTargetTaskTeamName(viewingTeamDetails); }} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${taskScope === "Team" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Broadcast to Entire Team
              </button>
              <button 
                type="button" 
                onClick={() => setTaskScope("Individual")} 
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${taskScope === "Individual" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:text-slate-700"}`}
              >
                Target Specific Member
              </button>
            </div>

            <div className="space-y-3">
              <input 
                type="text" 
                value={newTaskTitle} 
                onChange={(e) => setNewTaskTitle(e.target.value)} 
                placeholder={taskScope === "Team" ? `What should everyone in ${viewingTeamDetails} work on?` : "Enter specific individual deliverables tasks..."} 
                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none text-slate-700 focus:border-indigo-500 transition-all shadow-2xs" 
              />
              
              <div className="flex flex-col sm:flex-row gap-2">
                {taskScope === "Individual" && (
                  <select 
                    value={newTaskAssigneeId} 
                    onChange={(e) => setNewTaskAssigneeId(e.target.value)} 
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 flex-1 outline-none focus:border-indigo-500 shadow-2xs"
                  >
                    <option value="">-- Choose Target Member from Roster --</option>
                    {departmentEmployees.filter(e => e.team === viewingTeamDetails).map(emp => (
                      <option key={emp._id} value={emp.employee_id || emp._id}>
                        {emp.name} ({emp.employee_id || "No ID"})
                      </option>
                    ))}
                  </select>
                )}
                
                <button 
                  type="button" 
                  onClick={async () => {
                    if (!newTaskTitle.trim()) return alert("Please specify a task requirement description first.");
                    if (taskScope === "Individual" && !newTaskAssigneeId) return alert("Please select a target employee element.");
                    
                    try {
                      await handleAssignTask(); 
                      alert(`Task pipeline successfully created and targeted via ${taskScope} distribution context!`);
                    } catch (err) {
                      console.error(err);
                    }
                  }} 
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-5 py-2 rounded-xl whitespace-nowrap shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1"
                >
                  Deploy Task Pipeline
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Current Members Listing Panel */}
        <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 mt-6">
          <h2 className="text-sm font-bold text-slate-800 mb-4">Assigned Team Members</h2>
          {departmentEmployees.filter(emp => emp.team === viewingTeamDetails).length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No team member allocated inside this specific cluster block yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {departmentEmployees.filter(emp => emp.team === viewingTeamDetails).map((emp) => (
                <div key={emp._id} className="flex justify-between items-center p-4 rounded-xl bg-slate-50 border border-slate-100/70 hover:shadow-2xs transition-shadow">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                    <p className="text-[10px] text-slate-400 font-medium">{emp.role} • ID: {emp.employee_id || "N/A"}</p>
                  </div>
                  <button 
                    onClick={() => handleRemoveMemberFromTeam(emp._id)} 
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                    title="Remove user from cluster"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </>
    )}
  </div>
)}
        {/* VIEW MODULE C: TASKS SPRINT */}
        {activeView === "taskDeck" && (
          <div className="space-y-6 bg-white rounded-3xl p-8 border border-slate-100 shadow-md animate-in fade-in duration-200">
            <h1 className="text-2xl font-bold text-slate-800">Sprint Scheduler Matrix</h1>
            <div className="p-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center text-slate-400 text-sm">
              <CheckSquare size={40} className="text-indigo-500 mb-2 opacity-70" />
              <span>Full Width Task Matrix Component Node Link Ready.</span>
            </div>
          </div>
        )}
        {/* 🚀 ADDED THIS NEW BLOCK RIGHT HERE BELOW IT */}
        {activeView === "leave-triage" && (
          <LeaveTriagePanel />
        )}

        {/* VIEW MODULE D: PROFILE MODIFICATION SEPARATION */}
        {activeView === "profile" && (
          <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 shadow-md border border-slate-100 flex flex-col sm:flex-row items-center gap-6">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600 text-white text-3xl font-bold flex items-center justify-center shadow-md overflow-hidden shrink-0">
                {managerUser.avatarUrl ? <img src={managerUser.avatarUrl} alt="avatar" className="w-full h-full object-cover" /> : managerUser.name.slice(0,2).toUpperCase()}
              </div>
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl font-bold text-slate-800">{managerUser.name}</h2>
                <p className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md w-fit">{managerUser.role}</p>
                <p className="text-xs text-slate-400 pt-1">Node Identifier Map: <span className="font-mono text-slate-600 font-bold">{managerUser.employee_id}</span></p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-3xl p-5 shadow-md border border-slate-100 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-2">Corporate Profile Context</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-2.5"><Briefcase size={15} className="text-slate-400 mt-0.5" /><div><p className="text-[10px] font-bold text-slate-400 uppercase">Division Group</p><p className="text-xs font-semibold text-slate-700">{managerUser.department}</p></div></div>
                  <div className="flex items-start gap-2.5"><User size={15} className="text-slate-400 mt-0.5" /><div><p className="text-[10px] font-bold text-slate-400 uppercase">Primary Enterprise Email</p><p className="text-xs font-semibold text-slate-700 truncate">{managerUser.email}</p></div></div>
                </div>
              </div>

              <div className="md:col-span-2 bg-white rounded-3xl p-6 shadow-md border border-slate-100">
                <h3 className="text-sm font-bold text-slate-800 mb-4">Edit Personal Identity Attributes</h3>
                {profileSuccessMessage && <div className="p-3 mb-4 rounded-xl bg-emerald-500/10 text-xs font-bold text-emerald-600">✅ {profileSuccessMessage}</div>}
                
                <form onSubmit={handleUpdateManagerProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1"><Phone size={12} /> Mobile Phone Number</label>
                      <input type="text" value={managerUser.phone || ""} onChange={(e) => setManagerUser({ ...managerUser, phone: e.target.value })} placeholder="+1 (555) 000-0000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700" />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 mb-1"><MapPin size={12} /> Residential / Office Address Base</label>
                    <textarea rows={3} value={managerUser.address || ""} onChange={(e) => setManagerUser({ ...managerUser, address: e.target.value })} placeholder="Street details..." className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-700 resize-none" />
                  </div>
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={isUpdatingProfile} className="bg-indigo-600 text-white text-xs font-semibold px-6 py-2 rounded-xl flex items-center gap-2">
                      {isUpdatingProfile && <Loader2 size={12} className="animate-spin" />} Commit Changes
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* POPUP MODAL FOR ROSTER ADDITION (ISOLATED BY MANAGER'S DEPARTMENT) */}
      {isAddMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl border border-slate-100 max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-800">Select {managerUser.department} Personnel</h3>
                <p className="text-xs text-slate-400 mt-0.5">Append worker entries directly into {viewingTeamDetails}</p>
              </div>
              <button onClick={() => setIsAddMemberModalOpen(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-xl"><X size={18} /></button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-2 pr-1">
              {departmentEmployees.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">No personnel available under {managerUser.department}.</div>
              ) : (
                departmentEmployees.map((emp) => {
                  const isAlreadyInThisTeam = emp.team === viewingTeamDetails;
                  return (
                    <div key={emp._id} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium">{emp.role} • ID: {emp.employee_id || "N/A"}</p>
                        {emp.team && !isAlreadyInThisTeam && (
                          <span className="text-[9px] bg-amber-50 text-amber-600 font-semibold px-1 py-0.5 rounded block mt-1 w-fit">Assigned to: {emp.team}</span>
                        )}
                      </div>
                      <button disabled={isAlreadyInThisTeam} onClick={() => handleAddMemberToTeam(emp._id)} className={`p-1.5 rounded-lg border ${isAlreadyInThisTeam ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-white border-slate-200 text-slate-600"}`}>
                        {isAlreadyInThisTeam ? <Check size={14} /> : <Plus size={14} />}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button onClick={() => setIsAddMemberModalOpen(false)} className="bg-slate-800 text-white text-xs font-semibold px-5 py-2 rounded-xl">Done</button>
            </div>
          </div>
        </div>
      )}
      

    </div>

    
  );
}
// =========================================================
// 🚀 LEAVE REQUEST TRIAGE CONTROL MODULAR BLOCK (FOR MANAGER)
// =========================================================
function LeaveTriagePanel() {
  const [tickets, setTickets] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const loadTriageData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("fwc_token");
      const res = await axios.get("Frontend/HRMS/src/**/api/leaves/admin/queue", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setTickets(res.data.data || []);
      }
    } catch (err) {
      setError("Failed to sync leave operational queues from database cluster.");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    loadTriageData();
  }, []);

  const handleTriageAction = async (id, actionString) => {
    try {
      const token = localStorage.getItem("fwc_token");
      const res = await axios.patch(`Frontend/HRMS/src/**/api/leaves/admin/triage/${id}`, 
        { action: actionString },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Live optimistically update status parameters without requiring refresh
        setTickets(prev => prev.map(t => t._id === id ? { ...t, status: actionString } : t));
      }
    } catch (err) {
      alert("Pipeline fault: Execution node failed to update request status.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-indigo-500">
        <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Syncing Leave Records...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 bg-white rounded-3xl p-8 border border-slate-100 shadow-md animate-in fade-in duration-200">
      <div className="text-left">
        <h1 className="text-2xl font-bold text-slate-800">Leave Requests Triage</h1>
        <p className="text-xs text-slate-400 mt-1">Review, approve, or decline incoming employee absence petitions.</p>
      </div>

      {error && <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl text-left">{error}</div>}

      <div className="space-y-3">
        {tickets.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl text-slate-400 text-xs italic">
            No incoming employee leave requests found in active routing queue.
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket._id} className="p-5 bg-slate-50 border border-slate-100 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-slate-200">
              <div className="space-y-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-800">{ticket.employee_name}</span>
                  <span className="text-[10px] font-mono text-slate-400">({ticket.employee_id || "EMP-ID"})</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                  <span className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded-md font-bold uppercase text-[9px] tracking-wide shadow-xs">{ticket.leaveType}</span>
                  <span>•</span>
                  <span className="text-indigo-600 font-extrabold">{ticket.daysRequested} {ticket.daysRequested === 1 ? "Day" : "Days"}</span>
                  <span>•</span>
                  <span className="text-slate-400 font-medium">
                    {ticket.singleDate ? `Date: ${ticket.singleDate}` : `Range: ${ticket.startDate} ➔ ${ticket.endDate}`}
                  </span>
                </div>
                <p className="text-xs text-slate-500 italic font-medium pt-1">" {ticket.reason} "</p>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                {ticket.status === "Pending" ? (
                  <>
                    <button 
                      onClick={() => handleTriageAction(ticket._id, "Approved")}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Grant Leave
                    </button>
                    <button 
                      onClick={() => handleTriageAction(ticket._id, "Rejected")}
                      className="bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white border border-rose-200 text-xs font-bold px-4 py-2 rounded-xl transition-all cursor-pointer"
                    >
                      Decline
                    </button>
                  </>
                ) : (
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${
                    ticket.status === "Approved" 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                      : "bg-rose-50 text-rose-600 border-rose-200"
                  }`}>
                    {ticket.status === "Approved" ? "✓ Granted" : "✕ Declined"}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
// backend/src/pages/seniormanager/Dashboard.jsx -> Replace old ManagerMeetingControlPanel at the bottom
function ManagerMeetingControlPanel({ managerUser, teams, departmentEmployees }) {
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingType, setMeetingType] = useState("Instant");
  const [meetScope, setMeetScope] = useState("Team");
  const [chosenTeam, setChosenTeam] = useState("");
  const [chosenEmpId, setChosenEmpId] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [activeRooms, setActiveRooms] = useState([]);
  
  // 🟢 WebRTC Streaming State Engine Hooks
  const [activeCallRoomId, setActiveCallRoomId] = useState(null);
  const [managerStream, setManagerStream] = useState(null);
  const managerLocalVideoRef = React.useRef(null);
  const employeeRemoteVideoRef = React.useRef(null);

  const socketRef = React.useRef(null);
  const peerConnectionRef = React.useRef(null);

  const iceServersConfig = { iceServers: [{ urls: "stun:stun.l.google.com:19302" }] };
  
  const loadManagerRooms = async () => {
    try {
      const res = await axios.get(`Frontend/HRMS/src/**/api/meetings/manager/${managerUser._id}`);
      if (res.data.success) setActiveRooms(res.data.meetings);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { if (managerUser._id) loadManagerRooms(); }, [managerUser]);

  // 🟢 Captures webcam & microphone tracks + Executes Signaling Loop
  const startManagerMediaTracks = async (roomId) => {
    try {
      setActiveCallRoomId(roomId);

      // 1. Fire up real-time bidirectional socket channels to backend server
      socketRef.current = io("Frontend/HRMS/src/**");
      
      // 2. Fetch local system media streams hardware access
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setManagerStream(stream);
      setTimeout(() => {
        if (managerLocalVideoRef.current) managerLocalVideoRef.current.srcObject = stream;
      }, 300);

      // 3. Initialize native Peer Connection configuration instances
      peerConnectionRef.current = new RTCPeerConnection(iceServersConfig);

      // Attach local hardware media device tracks straight into connection stream pipeline
      stream.getTracks().forEach(track => peerConnectionRef.current.addTrack(track, stream));

      // Capture and render incoming peer visual stream data tracks onto remote UI element
      peerConnectionRef.current.ontrack = (event) => {
        if (employeeRemoteVideoRef.current) {
          employeeRemoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Broadcast generated network configurations straight through relay sockets channel
      peerConnectionRef.current.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit("ice-candidate", { roomId, candidate: event.candidate });
        }
      };

      // 4. Emit room handshake join request to signalling server
      socketRef.current.emit("join-room", roomId);

      // Trigger structural Offer description protocol proposal once Employee arrives
      socketRef.current.on("user-connected", async () => {
        const offer = await peerConnectionRef.current.createOffer();
        await peerConnectionRef.current.setLocalDescription(offer);
        socketRef.current.emit("video-offer", { roomId, sdp: offer });
      });

      // Synchronize Answer parameters returned by employee browser instance
      socketRef.current.on("incoming-answer", async (sdp) => {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(sdp));
      });

      // Index and append incoming ICE network profiles directly to ongoing connection
      socketRef.current.on("incoming-ice-candidate", async (candidate) => {
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        }
      });

    } catch (err) {
      console.error(err);
      alert("Hardware Block: Unable to access camera or microphone devices.");
    }
  };

  // 🟢 Releases hardware drivers and safely teardowns socket nodes on call shutdown
  const stopManagerMediaTracks = () => {
    if (managerStream) {
      managerStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    setManagerStream(null);
    setActiveCallRoomId(null);
  };

  const dispatchMeetingRoom = async (e) => {
    e.preventDefault();
    if (!meetingTitle.trim()) return alert("Provide a conference session name.");
    
    try {
      const payload = {
        title: meetingTitle, type: meetingType, scopeType: meetScope,
        targetTeam: meetScope === "Team" ? chosenTeam : "",
        targetEmployeeId: meetScope === "Individual" ? chosenEmpId : "",
        hostManagerId: managerUser._id, managerName: managerUser.name,
        department: managerUser.department, scheduledTime: meetingType === "Scheduled" ? scheduleDate : null
      };

      const res = await axios.post("Frontend/HRMS/src/**/api/meetings/create", payload, {
        headers: { Authorization: `Bearer ${localStorage.getItem("fwc_token")}` }
      });
      if (res.data.success) {
        setMeetingTitle("");
        loadManagerRooms();
        
        // Auto-launch the manager view frame if it's an Instant Live option
        if (meetingType === "Instant") {
          startManagerMediaTracks(res.data.meeting.roomId);
        } else {
          alert("Conference successfully scheduled. Notifications sent.");
        }
      }
    } catch (err) { alert("Failed to establish interactive stream room context."); }
  };

  return (
    <div className="space-y-6 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left animate-in fade-in duration-150">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Video & Audio Meeting Workspace</h2>
        <p className="text-xs text-slate-400 mt-0.5">Launch native high-speed communication lines across your department branches.</p>
      </div>

      {!activeCallRoomId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <form onSubmit={dispatchMeetingRoom} className="p-5 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-4 h-fit">
            <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Configure Room Grid</p>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase">Meeting Topic</label>
              <input type="text" value={meetingTitle} onChange={e => setMeetingTitle(e.target.value)} placeholder="e.g., Daily Sprint Review" className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Call Timing</label>
                <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs mt-1 outline-none">
                  <option value="Instant">Instant Live</option>
                  <option value="Scheduled">Schedule Later</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Invite Context</label>
                <select value={meetScope} onChange={e => setMeetScope(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs mt-1 outline-none">
                  <option value="Team">Whole Team</option>
                  <option value="Individual">Single Member</option>
                </select>
              </div>
            </div>

            {meetingType === "Scheduled" && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Execution Timestamp</label>
                <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs mt-1 outline-none" />
              </div>
            )}

            {meetScope === "Team" ? (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Select Target Cluster Pod</label>
                <select value={chosenTeam} onChange={e => setChosenTeam(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs mt-1 outline-none">
                  <option value="">-- Select Target Pod --</option>
                  {teams.filter(t => t !== "All Teams").map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
              </div>
            ) : (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase">Target Roster Asset</label>
                <select value={chosenEmpId} onChange={e => setChosenEmpId(e.target.value)} className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs mt-1 outline-none">
                  <option value="">-- Choose Employee Target --</option>
                  {departmentEmployees.map(emp => <option key={emp._id} value={emp.employee_id || emp._id}>{emp.name} [{emp.role}]</option>)}
                </select>
              </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded-xl text-xs uppercase tracking-wider shadow-xs mt-2 transition-all">
              Deploy Live Communication Link
            </button>
          </form>

          <div className="lg:col-span-2 space-y-3 max-h-[420px] overflow-y-auto pr-1">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Live Active Rooms</p>
            {activeRooms.length === 0 ? (
              <div className="text-center py-12 border border-dashed rounded-2xl border-slate-200 text-slate-400 text-xs italic bg-slate-50">No meetings indexed under your node identifier currently.</div>
            ) : (
              activeRooms.map((room) => (
                <div key={room._id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{room.title}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Target: <span className="text-indigo-600 font-bold">{room.scopeType === "Team" ? `Cluster [${room.targetTeam}]` : `Asset [${room.targetEmployeeName || "Roster Pool"}]`}</span> | Room ID: {room.roomId}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {room.status === "Active" ? (
                      <button onClick={() => startManagerMediaTracks(room.roomId)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-all cursor-pointer">
                        Enter Room
                      </button>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border">{room.status}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* 🟢 LIVE VIDEO CONFERENCE CALL ROOM CANVAS INTERFACE PANEL */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900 border border-slate-800 p-6 rounded-3xl relative">
          <div className="absolute top-4 left-4 bg-indigo-600 text-white text-[9px] font-mono tracking-widest uppercase font-bold px-2.5 py-0.5 rounded-full z-20 animate-pulse">
            • Executive Conference Console Active
          </div>

          <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative border border-slate-800 shadow-inner flex items-center justify-center">
            <video ref={managerLocalVideoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
            <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-slate-300 px-2 py-0.5 rounded border border-slate-800">My Feed (Manager Camera)</span>
          </div>

          <div className="bg-slate-950 rounded-2xl overflow-hidden aspect-video relative border border-slate-800 shadow-inner flex items-center justify-center">
            <video ref={employeeRemoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
            <div className="text-center space-y-1 p-4 absolute z-10 text-slate-500">
              <p className="text-xs font-bold tracking-wide">Awaiting Employee Connection Stream...</p>
              <p className="text-[10px] font-mono opacity-60">WebRTC Signal Loop Handshake Pending</p>
            </div>
            <span className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono font-bold text-slate-300 px-2 py-0.5 rounded border border-slate-800 z-20">Employee Feed (Remote Stream)</span>
          </div>

          <div className="md:col-span-2 flex justify-center border-t border-slate-800/80 pt-4 mt-2">
            <button onClick={stopManagerMediaTracks} className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl uppercase tracking-wider transition-colors shadow-lg">
              Close Meeting Room
            </button>
          </div>
        </div>
      )}
    </div>
  );
}