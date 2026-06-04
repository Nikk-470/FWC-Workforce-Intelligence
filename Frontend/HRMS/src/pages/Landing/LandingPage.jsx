import PortalCard from "@/components/landing/PortalCard";
import recruiterimg from "@/assets/recruiterimg.png";
import employee from "@/assets/employee.png";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // 🚀 To handle workspace redirection

import {
  ShieldCheck,
  BarChart3,
} from "lucide-react";

export default function LandingPage() {
  // 🔑 Multi-Role Modal & Auth States
  const [activeRoleModal, setActiveRoleModal] = useState(null); // Stores "Admin", "Senior Manager", etc.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  // 📝 Secure Authentication Handler
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      const { token, role, name } = response.data;

      // 🔒 Security Check: Make sure their role matches the workspace card they selected!
      if (role !== activeRoleModal) {
        setError(`Access Denied: Your profile does not have ${activeRoleModal} permissions.`);
        setLoading(false);
        return;
      }

      // Save user session credentials locally
      localStorage.setItem("fwc_token", token);
      localStorage.setItem("fwc_user_role", role);
      localStorage.setItem("fwc_user_name", name);

      // Reset modal inputs
      setActiveRoleModal(null);
      setEmail("");
      setPassword("");

      // 🚀 Redirect to the corresponding dashboard workspace
      if (role === "Admin") navigate("/admin");
      else if (role === "Senior Manager") navigate("/manager");
      else if (role === "Recruiter") navigate("/recruiter");
      else if (role === "Employee") navigate("/employee");

    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-50 overflow-hidden">
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"></div>

      {/* Navbar */}
      <nav className="border-b bg-white">
        <div className="w-full px-2 sm:px-8 py-4 flex justify-between items-center">
          <div className="pl-0 sm:pl-4 lg:pl-8">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold">
              FWC Workforce Intelligence
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              AI-Powered Workforce Platform
            </p>
          </div>
          <div className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-full text-sm font-semibold">
            AI Enabled
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* Welcome Section */}
        <div className="text-center mb-10 sm:mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Welcome to FWC Workforce Intelligence
          </h2>
          <p className="text-slate-500 mt-3 text-base sm:text-lg max-w-3xl mx-auto">
            Unified platform for workforce management, recruitment, analytics and employee engagement.
          </p>
        </div>

        {/* Portal Cards */}
        {/* 🔄 CHANGED HERE: Removed 'route' and attached a dynamic onClick trigger to intercept access */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div onClick={() => setActiveRoleModal("Admin")} className="cursor-pointer">
            <PortalCard
              icon={<ShieldCheck size={70} className="text-blue-600" />}
              title="Admin"
              description="Manage organization, analytics and workforce operations."
            />
          </div>

          <div onClick={() => setActiveRoleModal("Senior Manager")} className="cursor-pointer">
            <PortalCard
              icon={<BarChart3 size={70} className="text-purple-600" />}
              title="Senior Manager"
              description="Track team performance and department insights."
            />
          </div>

          <div onClick={() => setActiveRoleModal("Recruiter")} className="cursor-pointer">
            <PortalCard
              icon={
                <img
                  src={recruiterimg}
                  alt="Recruiter"
                  className="w-24 h-24 object-contain"
                />
              }
              title="Recruiter"
              description="Screen resumes and conduct AI interviews."
            />
          </div>

          <div onClick={() => setActiveRoleModal("Employee")} className="cursor-pointer">
            <PortalCard
              icon={
                <img
                  src={employee}
                  alt="Employee"
                  className="w-24 h-24 object-contain"
                />
              }
              title="Employee"
              description="Attendance, payroll and performance tracking."
            />
          </div>
        </div>

        {/* System Overview */}
        <div className="mt-16">
          <div className="mb-8 bg-white rounded-3xl p-5 shadow-lg border border-slate-100">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
              <div>
                <h3 className="font-bold text-lg">HERA AI Status</h3>
                <p className="text-slate-500 text-sm">
                  Resume Screening • Voice Analysis • Workforce Insights
                </p>
              </div>
              <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-semibold">
                Active
              </span>
            </div>
          </div>

          <h3 className="text-2xl font-bold mb-6">System Overview</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
              <p className="text-slate-500">Employees</p>
              <h2 className="text-3xl font-bold">5,247</h2>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
              <p className="text-slate-500">Attendance</p>
              <h2 className="text-3xl font-bold">98.4%</h2>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
              <p className="text-slate-500">Open Positions</p>
              <h2 className="text-3xl font-bold">324</h2>
            </div>
            <div className="bg-white rounded-3xl p-6 shadow-lg border border-slate-100 hover:shadow-xl transition-all duration-300">
              <p className="text-slate-500">AI Screening</p>
              <h2 className="text-3xl font-bold text-green-600">Active</h2>
            </div>
          </div>
        </div>

      </div>

      {/* 📥 ATTACHED OVERLAY MODAL FOR AUTHENTICATION */}
{activeRoleModal && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 relative">
      
      {/* Close Cross */}
      <button 
        onClick={() => { setActiveRoleModal(null); setError(""); }}
        className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-bold text-sm"
      >
        ✕
      </button>

      {/* Title Context */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-slate-900">Workspace Authorization</h3>
        <p className="text-xs text-slate-500 mt-1">
          Please enter your credentials to clear the security barrier for the <span className="font-semibold text-indigo-600">{activeRoleModal}</span> workspace.
        </p>
      </div>

      {/* Error Notification Banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
          {error}
        </div>
      )}

      {/* Forms Submission Block */}
      <form onSubmit={handleLoginSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Corporate Email</label>
          <input
            type="email"
            required
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-slate-200 outline-none focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition-all shadow-sm"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">Secret Password</label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-slate-200 outline-none focus:border-indigo-500 rounded-xl px-3 py-2.5 text-sm text-slate-700 transition-all shadow-sm"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-medium py-2.5 rounded-xl transition-all shadow-sm flex justify-center items-center"
        >
          {loading ? "Authenticating Profile..." : `Enter ${activeRoleModal} Workspace`}
        </button>
      </form>
    </div>
  </div>
)}
    </div>
  );
}