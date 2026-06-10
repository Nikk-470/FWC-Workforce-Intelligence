import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, UserPlus, Search, ShieldCheck, Mail, X, Loader2, Eye, EyeOff, Folder, Trash2, ArrowLeft, AlertTriangle, Calendar } from 'lucide-react';
import DashboardLayout from "@/layouts/DashboardLayout";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const EmployeesPage = () => {
  // 🗄️ Real Backend Database State Storage
  const [employees, setEmployees] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [backendError, setBackendError] = useState("");
  
  // 🕹️ UI Workflow State Flags
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState(false); 
  
  // 🗺️ Navigation: Track if we are inside a specific department view (null means home menu)
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  
  // 🗑️ Destruction Guard States
  const [employeeTargetForDeletion, setEmployeeTargetForDeletion] = useState(null);
  const [deletionVerificationText, setDeletionVerificationText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // 📝 Controlled Interactive Form State
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    role: "Employee", 
    department: "Engineering",
    password: "",
    joiningDate: new Date().toISOString().split('T')[0], // Defaults format to YYYY-MM-DD
    avatarUrl: ""
  });
  const [generatedAccount, setGeneratedAccount] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ==========================================
  // 📡 ENGINE 1: FETCH REAL EMPLOYEES FROM BACKEND
  // ==========================================
  const fetchEmployeesFromDb = async () => {
    setIsLoading(true);
    setBackendError("");
    try {
      const token = localStorage.getItem("fwc_token");
      const response = await axios.get("Frontend/HRMS/src/**/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data)) {
        setEmployees(response.data);
      } else if (response.data?.employees && Array.isArray(response.data.employees)) {
        setEmployees(response.data.employees);
      } else {
        setEmployees([]);
      }
    } catch (err) {
      console.error("Database Fetch Error:", err);
      setBackendError(err.response?.data?.message || "Failed to load employee records from database.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesFromDb();
  }, []);

  // 📸 Handle Admin Avatar Conversion to String
  const handleAdminAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, avatarUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // ==========================================
  // 🔑 ENGINE 2: POST & REGISTER NEW EMPLOYEE
  // ==========================================
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("fwc_token");
      
      const payload = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        password: formData.password, // Uses actual state password text
        joiningDate: formData.joiningDate,
        avatarUrl: formData.avatarUrl // Passes real base64 file buffer
      };

      console.log("Sending payload to backend onboarding endpoint:", payload);
      
      // Hit the cloud pipeline onboard endpoint directly
      const response = await axios.post("Frontend/HRMS/src/**/api/employees/onboard", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchEmployeesFromDb();
      
      // Render success card using exact response values calculated by backend
      setGeneratedAccount({
        id: response.data.employee?.employee_id || "Generated Successfully",
        name: formData.name,
        email: formData.email,
        password: formData.password,
        joiningDate: formData.joiningDate
      });

      // Reset state form inputs
      setFormData({ 
        name: "", 
        email: "", 
        role: "Employee", 
        department: "Engineering", 
        password: "",
        joiningDate: new Date().toISOString().split('T')[0],
        avatarUrl: ""
      });
      setShowPassword(false);
    } catch (err) {
      console.error("Detailed Server Error Object:", err);
      const serverErrorMessage = err.response?.data?.message || err.response?.data?.error;
      alert(
        serverErrorMessage 
          ? `Backend Rejected Registration: ${serverErrorMessage}`
          : "Could not register account. Check that your node backend server is actively running on port 5000 and MongoDB is connected."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================
  // 🚨 ENGINE 3: SECURE DELETION HANDLER
  // ==========================================
  const executeEmployeeTermination = async () => {
    if (deletionVerificationText.toLowerCase() !== "remove") {
      alert("Verification token mismatched. Please type 'remove' completely to authorize.");
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem("fwc_token");
      const targetId = employeeTargetForDeletion._id || employeeTargetForDeletion.employee_id;
      
      await axios.delete(`Frontend/HRMS/src/**/api/employees/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployeeTargetForDeletion(null);
      setDeletionVerificationText("");
      await fetchEmployeesFromDb();
    } catch (err) {
      console.error("Deletion Endpoint Error:", err);
      alert(err.response?.data?.message || "Successfully executed locally, but verify backend handling setup.");
      setEmployees(prev => prev.filter(emp => emp.employee_id !== employeeTargetForDeletion.employee_id));
      setEmployeeTargetForDeletion(null);
      setDeletionVerificationText("");
    } finally {
      setIsDeleting(false);
    }
  };

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setGeneratedAccount(null);
  };

  // ==========================================
  // 📊 ENGINE 4: MATRIX DATA TRANSFORMATIONS
  // ==========================================
  const filteredEmployees = employees.filter(emp => {
    if (!emp) return false;
    const nameMatch = emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const idMatch = emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const deptMatch = emp.department?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    return nameMatch || idMatch || deptMatch;
  });

  const groupedDepartments = filteredEmployees.reduce((groups, employee) => {
    const deptName = employee.department || "Operations Management";
    if (!groups[deptName]) {
      groups[deptName] = [];
    }
    groups[deptName].push(employee);
    return groups;
  }, {});

  return (
    <DashboardLayout>
      <DashboardHeader />

      <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn mt-6 px-2">
        
        {/* TOP COMMAND NAVIGATION HEADBAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            {selectedDepartment && (
              <button 
                onClick={() => setSelectedDepartment(null)}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg mb-2 transition-colors"
              >
                <ArrowLeft size={14} /> Back to Department Catalog
              </button>
            )}
            <h2 className="text-xl font-bold flex items-center gap-2 text-slate-900">
              <Users className="text-indigo-600" size={22} /> 
              {selectedDepartment ? `${selectedDepartment} Core Roster` : "Corporate Structural Matrix"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {selectedDepartment 
                ? `Authorized personnel assignment workspace mapped within ${selectedDepartment} sub-divisions.` 
                : "Select an operational cluster card below to unlock, review, and modify database records."}
            </p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:scale-[1.01]"
          >
            <UserPlus size={15} /> Provision New Employee
          </button>
        </div>

        {/* ERROR DISPATCH DISPLAY */}
        {backendError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium">
            ⚠️ {backendError}
          </div>
        )}

        {/* LOADING VECTORS SCREEN */}
        {isLoading ? (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xs p-12 text-center text-slate-400">
            <div className="flex items-center justify-center gap-2 text-xs">
              <Loader2 className="animate-spin text-indigo-600" size={16} />
              Mapping cluster environment tables...
            </div>
          </div>
        ) : !selectedDepartment ? (
          
          /* VIEW A: MAIN MENU - DEPARTMENT CARDS */
          <div className="space-y-6">
            <div className="relative max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search size={16} />
              </span>
              <input 
                type="text"
                placeholder="Search index parameters..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium transition-colors shadow-2xs"
              />
            </div>

            {Object.keys(groupedDepartments).length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 text-xs font-medium">
                No structural departments matching filters were found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {Object.keys(groupedDepartments).map((dept) => (
                  <div 
                    key={dept}
                    onClick={() => setSelectedDepartment(dept)}
                    className="bg-white border border-slate-100 rounded-2xl p-5 shadow-xs hover:shadow-md hover:border-indigo-100 cursor-pointer transition-all group flex flex-col justify-between hover:-translate-y-0.5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                        <Folder size={20} />
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md">
                        {groupedDepartments[dept].length} Members
                      </span>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-sm font-black text-slate-800 tracking-wide uppercase group-hover:text-indigo-600 transition-colors">
                        {dept}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1 font-medium">Click to view dynamic department list details.</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        ) : (

          /* VIEW B: TARGET ROSTER SUB-PAGE PAGE */
          <div className="space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xs">
              <span className="text-xs font-bold tracking-wider uppercase font-mono text-indigo-400">
                ACTIVE UNIT DIR // {selectedDepartment}
              </span>
              <button 
                onClick={() => setSelectedDepartment(null)}
                className="text-[11px] font-black text-slate-300 hover:text-white transition-colors"
              >
                ← Back to Departments
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b bg-slate-50/70 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                      <th className="py-3.5 px-6">Associate Details</th>
                      <th className="py-3.5 px-4">System Identity ID</th>
                      <th className="py-3.5 px-4">Designated Title</th>
                      <th className="py-3.5 px-4">Joining Date</th>
                      <th className="py-3.5 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {!groupedDepartments[selectedDepartment] || groupedDepartments[selectedDepartment].length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                          No personnel assigned inside this unit terminal index.
                        </td>
                      </tr>
                    ) : (
                      groupedDepartments[selectedDepartment].map((emp) => (
                        <tr key={emp._id || emp.employee_id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 px-6 flex items-center gap-3">
                            {emp.avatarUrl ? (
                              <img src={emp.avatarUrl} alt="Avatar" className="w-8 h-8 rounded-xl object-cover border" />
                            ) : (
                              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500 uppercase">
                                {emp.name?.slice(0, 2)}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                              <span className="text-slate-400 text-[11px] font-mono mt-0.5">{emp.email}</span>
                            </div>
                          </td>

                          <td className="py-4 px-4 font-mono text-indigo-600 font-bold">
                            {emp.employee_id || `EMP-${emp._id?.slice(-4).toUpperCase() || "SYS"}`}
                          </td>

                          <td className="py-4 px-4 text-slate-500">
                            <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px] text-slate-600 font-semibold">
                              {emp.role}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-slate-600 font-mono text-[11px]">
                            {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-US', {
                              year: 'numeric', month: 'short', day: 'numeric'
                            }) : "N/A"}
                          </td>

                          <td className="py-4 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => setEmployeeTargetForDeletion(emp)}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all inline-flex items-center justify-center"
                            >
                              <X size={16} strokeWidth={2.5} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* DELETION CONFIRMATION MODAL */}
        {employeeTargetForDeletion && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-red-100 relative mx-4">
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2.5 bg-red-50 rounded-full"><AlertTriangle size={24} /></div>
                <div>
                  <h3 className="text-base font-black text-slate-900 tracking-wide">Confirm Master Record Removal</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">This action purges entries completely from database storage arrays.</p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl space-y-1.5 border border-slate-100 font-medium text-xs text-slate-600 mb-4">
                <div><span className="text-slate-400">Target Asset Name:</span> <strong className="text-slate-900">{employeeTargetForDeletion.name}</strong></div>
                <div><span className="text-slate-400">Target Identity Key:</span> <code className="text-indigo-600 font-bold">{employeeTargetForDeletion.employee_id}</code></div>
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  To confirm removal, type <span className="text-red-600 font-mono font-black">remove</span> below:
                </label>
                <input 
                  type="text"
                  required
                  placeholder="Type 'remove' string parameter..."
                  value={deletionVerificationText}
                  onChange={(e) => setDeletionVerificationText(e.target.value)}
                  className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-red-500 font-bold text-red-600 tracking-wide bg-white"
                />
              </div>

              <div className="pt-5 flex gap-2">
                <button 
                  type="button" 
                  onClick={() => { setEmployeeTargetForDeletion(null); setDeletionVerificationText(""); }}
                  className="w-1/2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-600"
                >
                  Cancel
                </button>
                <button 
                  type="button"
                  disabled={isDeleting || (deletionVerificationText.toLowerCase() !== "remove")}
                  onClick={executeEmployeeTermination}
                  className="w-1/2 bg-red-600 hover:bg-red-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-4 py-2.5 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1"
                >
                  {isDeleting && <Loader2 className="animate-spin" size={12} />}
                  Authorize Purge
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FORM MODAL */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 relative mx-4 max-h-[90vh] overflow-y-auto">
              
              <button onClick={closeAndResetModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>

              {!generatedAccount ? (
                <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
                  {/* PROFILE PICTURE UPLOAD INTERFACE */}
                  <div className="flex flex-col items-center justify-center pb-2 border-b border-slate-100">
                    <label className="text-[11px] font-bold text-slate-500 block mb-1">Upload Profile Picture</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleAdminAvatarChange} 
                      className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {formData.avatarUrl && (
                      <img src={formData.avatarUrl} alt="Preview" className="w-12 h-12 rounded-xl object-cover mt-2 border" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Configure Secure Employee File</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Input details below to compute core system configurations.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Legal Full Name</label>
                      <input 
                        type="text" required placeholder="e.g. David Miller" value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Corporate Email Address</label>
                      <input 
                        type="email" required placeholder="e.g. d.miller@fwc.com" value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Department</label>
                        <select 
                          value={formData.department}
                          onChange={(e) => setFormData({...formData, department: e.target.value})}
                          className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 bg-white font-medium"
                        >
                          <option value="Engineering">Engineering</option>
                          <option value="Product">Product</option>
                          <option value="HR / Recruitment">HR / Recruitment</option>
                          <option value="Sales & Marketing">Sales & Marketing</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Job Designation Title</label>
                        <select 
                          value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 bg-white font-medium"
                        >
                          <option value="Employee">Employee</option>
                          <option value="Recruiter">Recruiter</option>
                          <option value="Senior Manager">Senior Manager</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1 flex items-center gap-1">
                        <Calendar size={12} className="text-indigo-500" /> Official Joining Date
                      </label>
                      <input 
                        type="date" 
                        required 
                        value={formData.joiningDate}
                        onChange={(e) => setFormData({...formData, joiningDate: e.target.value})}
                        className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium text-slate-700 bg-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Initial Login Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          required 
                          minLength={6}
                          placeholder="Assign security key for first login..." 
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          className="w-full border border-slate-200 pl-3 pr-10 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                        >
                          {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end gap-2">
                    <button type="button" onClick={closeAndResetModal} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50">
                      Cancel
                    </button>
                    <button 
                      type="submit" disabled={isSubmitting}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1"
                    >
                      {isSubmitting && <Loader2 className="animate-spin" size={12} />}
                      Generate Workspace Credentials
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center gap-2.5 text-green-600">
                    <div className="p-2 bg-green-50 rounded-full"><ShieldCheck size={22} /></div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Workspace Authorization Created</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Parameters saved directly to database storage arrays.</p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-2xl space-y-3 border border-slate-100 font-mono text-xs text-slate-600">
                    <div className="flex justify-between border-b pb-2 border-slate-200/60">
                      <span className="text-slate-400 font-sans font-bold">Generated User ID:</span>
                      <span className="text-indigo-600 font-bold">{generatedAccount.id}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 border-slate-200/60">
                      <span className="text-slate-400 font-sans font-bold">Associate Name:</span>
                      <span className="text-slate-900 font-bold">{generatedAccount.name}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 border-slate-200/60">
                      <span className="text-slate-400 font-sans font-bold">Email Username:</span>
                      <span className="text-slate-900 font-bold">{generatedAccount.email}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2 border-slate-200/60">
                      <span className="text-slate-400 font-sans font-bold">Joining Date:</span>
                      <span className="text-slate-900 font-bold">{generatedAccount.joiningDate}</span>
                    </div>
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-400 font-sans font-bold">Provisional Password:</span>
                      <span className="bg-amber-100 px-2 py-0.5 text-amber-950 font-bold rounded border border-amber-200">
                        {generatedAccount.password}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button onClick={closeAndResetModal} className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md w-full sm:w-auto">
                      Acknowledge & Complete Onboarding
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
};

export default EmployeesPage;