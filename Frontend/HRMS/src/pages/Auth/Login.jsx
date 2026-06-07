import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Loader2 } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRealLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      // 📡 Send actual credentials to your Express auth controller
      const response = await axios.post("http://localhost:5000/api/auth/login", {
        email,
        password,
      });

      // 🔄 Directly monitor response headers/data packages safely
      if (response.data && response.data.token) {
        const token = response.data.token;
        // 🚀 Extract the clean role parameter from inside the backend's nested user object!
        const userRole = response.data.user?.role || ""; 

        // 💾 Save the real JWT token inside localStorage!
        localStorage.setItem("fwc_token", token);

        // 💾 Save user data and role details for dashboard rendering context tracks
        localStorage.setItem("user_role", userRole);
        localStorage.setItem("fwc_user", JSON.stringify(response.data.user));

        // 🔀 Securely redirect based on the user role case-insensitively
        const cleanRole = userRole.toLowerCase().trim();
        
        if (cleanRole === "admin") {
          navigate("/admin");
        } else if (cleanRole === "recruiter") {
          navigate("/recruiter");
        } else if (cleanRole === "senior manager" || cleanRole === "manager") {
          navigate("/manager"); // Redirects to manager dashboard layout smoothly
        } else {
          navigate("/employee");
        }
      }
    } catch (error) {
      console.error("Login connection error:", error);
      setErrorMessage(error.response?.data?.message || "Invalid credentials or Server Offline");
    } finally {
      setIsLoading(false);
    }
  };

  // 🧪 Quick bypass function for development testing
  const handleQuickBypass = (role) => {
    // 💾 Set temporary mock properties inside storage parameters so bypass views don't crash
    localStorage.setItem("user_role", role);
    localStorage.setItem("fwc_user", JSON.stringify({
      name: role === "employee" ? "Regular Employee Node" : "Senior Manager Asset",
      email: `${role}@fwc.com`,
      employee_id: "EMP-MOCK-999",
      designation: role === "employee" ? "Software Engineer Associate" : "Cluster Operations Lead"
    }));
    navigate(`/${role}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-lg w-96 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-950">FWC Login</h1>
          <p className="text-xs text-slate-400 mt-1">Enter your database credentials to connect your workspace session.</p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-500 font-semibold">
            ❌ {errorMessage}
          </div>
        )}

        {/* 🔑 REAL ACCREDITED SECURE ACCOUNT FORM */}
        <form onSubmit={handleRealLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              placeholder="e.g. admin@fwc.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">Account Password</label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 px-3 py-2.5 rounded-xl text-xs focus:outline-hidden focus:border-indigo-500 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-xl text-xs font-bold shadow-md transition-colors flex items-center justify-center gap-2"
          >
            {isLoading && <Loader2 className="animate-spin" size={14} />}
            Authenticate Secure Session
          </button>
        </form>

        <div className="relative flex py-2 items-center text-slate-300">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">Dev Mock Bypass</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>

        {/* 🎛️ DEV ENVIRONMENT BYPASS BUTTON PANELS */}
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => handleQuickBypass("admin")} className="bg-slate-50 border text-slate-600 hover:bg-slate-100 py-2 rounded-xl text-[11px] font-bold transition-all">
            👑 Admin Layout
          </button>
          <button onClick={() => handleQuickBypass("recruiter")} className="bg-slate-50 border text-slate-600 hover:bg-slate-100 py-2 rounded-xl text-[11px] font-bold transition-all">
            💼 Recruiter
          </button>
          <button onClick={() => handleQuickBypass("manager")} className="bg-slate-50 border text-slate-600 hover:bg-slate-100 py-2 rounded-xl text-[11px] font-bold transition-all">
            👔 Manager View
          </button>
          <button onClick={() => handleQuickBypass("employee")} className="bg-slate-50 border text-slate-600 hover:bg-slate-100 py-2 rounded-xl text-[11px] font-bold transition-all">
            👤 Employee View
          </button>
        </div>
      </div>
    </div>
  );
}