import React, { useState, useEffect } from 'react';
import axios from 'axios'; 
import { Users, UserPlus, Search, ShieldCheck, Mail, X, Loader2, Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false); // Toggle password visibility text

  // 📝 Controlled Interactive Form State (Added password string here)
  const [formData, setFormData] = useState({ 
    name: "", 
    email: "", 
    role: "", 
    department: "Engineering",
    password: "" 
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
      const response = await axios.get("http://localhost:5000/api/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmployees(response.data);
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

  // ==========================================
  // 🔑 ENGINE 2: POST & REGISTER NEW EMPLOYEE
  // ==========================================
  const handleAddEmployeeSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Auto-compute unique employee corporate identity string
    const currentYear = new Date().getFullYear();
    const uniqueSuffix = Math.floor(1000 + Math.random() * 9000);
    const calculatedId = `EMP-${currentYear}-${uniqueSuffix}`;

    try {
      const token = localStorage.getItem("fwc_token");
      
      const payload = {
        employee_id: calculatedId,
        name: formData.name,
        email: formData.email,
        role: formData.role,
        department: formData.department,
        password: formData.password // 🎯 Uses the custom password defined by the admin!
      };

      // Post payload to registration endpoint
      await axios.post("http://localhost:5000/api/auth/register", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh table directory mapping layout
      await fetchEmployeesFromDb();
      
      // Pass configurations to summary success screen
      setGeneratedAccount({
        id: calculatedId,
        name: formData.name,
        email: formData.email,
        password: formData.password
      });

      // Reset form controls safely
      setFormData({ name: "", email: "", role: "", department: "Engineering", password: "" });
      setShowPassword(false);
    } catch (err) {
      console.error("Registration Error:", err);
      alert(err.response?.data?.message || "Could not register account. Verify backend connectivity.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.department?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const closeAndResetModal = () => {
    setIsModalOpen(false);
    setGeneratedAccount(null);
  };

  return (
    <DashboardLayout>
      <DashboardHeader />

      <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn mt-6 px-2">
        
        {/* HEADER BAR */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Users className="text-indigo-600" size={22} /> Employee Registry Terminal
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Provision master database records, assign company IDs, and execute secure authorization keys.</p>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 hover:scale-[1.01]"
          >
            <UserPlus size={15} /> Provision New Employee
          </button>
        </div>

        {/* SEARCH BAR CONTAINER */}
        <div className="relative max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <Search size={16} />
          </span>
          <input 
            type="text"
            placeholder="Search database indices by identity string, ID, or structural department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-200 pl-10 pr-4 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium transition-colors shadow-2xs"
          />
        </div>

        {/* ERROR WARNING DISPATCH */}
        {backendError && (
          <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-medium">
            ⚠️ {backendError} (Please verify your Node.js express backend server is online at port 5000)
          </div>
        )}

        {/* COMPREHENSIVE ACTIVE DIRECTORY LEDGER */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-slate-50/70 font-bold uppercase tracking-wider text-slate-400 text-[10px]">
                  <th className="py-3.5 px-6">Associate Details</th>
                  <th className="py-3.5 px-4">System Identity ID</th>
                  <th className="py-3.5 px-4">Structural Department</th>
                  <th className="py-3.5 px-4">Designated Title</th>
                  <th className="py-3.5 px-4 text-center">Authorization Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {isLoading ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-2 text-xs">
                        <Loader2 className="animate-spin text-indigo-600" size={16} />
                        Querying MongoDB cluster variables...
                      </div>
                    </td>
                  </tr>
                ) : filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp) => (
                    <tr key={emp._id || emp.employee_id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900 text-sm">{emp.name}</span>
                          <span className="text-slate-400 text-[11px] font-mono mt-0.5">{emp.email}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4 font-mono text-indigo-600 font-bold">
                        {emp.employee_id || `EMP-${emp._id?.slice(-4).toUpperCase() || "SYS"}`}
                      </td>

                      <td className="py-4 px-4">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-[11px] font-bold">
                          {emp.department || (emp.role?.toLowerCase() === "admin" ? "Management" : "Operations")}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-slate-500">{emp.role}</td>

                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-[10px] uppercase font-black tracking-wide text-green-600 bg-green-50 px-2 py-0.5 rounded-xs">
                          {emp.role?.toLowerCase() === "admin" ? "SYSTEM ADMIN" : "Active Employee"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 font-medium text-xs">
                      No matching employee files located inside current staging registers.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL CONTAINER POPUP */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-lg p-6 shadow-2xl border border-slate-100 relative mx-4 max-h-[90vh] overflow-y-auto">
              
              <button onClick={closeAndResetModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1">
                <X size={18} />
              </button>

              {!generatedAccount ? (
                <form onSubmit={handleAddEmployeeSubmit} className="space-y-4">
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
                        <input 
                          type="text" required placeholder="e.g. Frontend Specialist" value={formData.role}
                          onChange={(e) => setFormData({...formData, role: e.target.value})}
                          className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* 🔐 NEW FIELD: CREATE PROVISIONAL PASSWORD */}
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
                      Cancel Setup
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
                <div className="space-y-5 animate-scaleUp">
                  <div className="flex items-center gap-2.5 text-green-600">
                    <div className="p-2 bg-green-50 rounded-full"><ShieldCheck size={22} /></div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">Workspace Authorization Created</h3>
                      <p className="text-xs text-slate-400 mt-0.5">Parameters have been committed directly to MongoDB.</p>
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
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-slate-400 font-sans font-bold">Provisional System Password:</span>
                      <span className="bg-amber-100 px-2 py-0.5 text-amber-950 font-bold rounded border border-amber-200 tracking-wider">
                        {generatedAccount.password}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl flex gap-2 text-[11px] text-indigo-700 leading-relaxed">
                    <Mail size={16} className="shrink-0 mt-0.5" />
                    <p>Account committed to backend environment successfully. Provide these credentials to the user so they can safely complete their initial authentication flow.</p>
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