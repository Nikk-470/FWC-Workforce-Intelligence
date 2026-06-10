import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  BarChart3,
  UserCheck,
  Briefcase,
  ArrowRight,
  Lock,
  Mail,
  CheckCircle2,
  Globe,
  Bot,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState("Recruiter"); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Carousel slider state management
  const [currentSlide, setCurrentSlide] = useState(0);
  const [timeGreeting, setTimeGreeting] = useState("GOOD DAY");

  const navigate = useNavigate();

  // Dynamic time check for Page 1 greeting string
  useEffect(() => {
    const hours = new Date().getHours();
    if (hours < 12) setTimeGreeting("GOOD MORNING SIR/MAM");
    else if (hours < 17) setTimeGreeting("GOOD AFTERNOON SIR/MAM");
    else setTimeGreeting("GOOD EVENING SIR/MAM");
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      const token = response.data.token;
      const userObj = response.data.user || {};
      const role = userObj.role || response.data.role || "";
      const name = userObj.name || response.data.name || "";

      if (!token) {
        throw new Error("No authentication token was returned from server environment.");
      }

      const databaseRole = role.toLowerCase().trim();
      const selectedWorkspace = activeRole.toLowerCase().trim();

      if (databaseRole !== selectedWorkspace) {
        if (
          (selectedWorkspace === "senior manager" && databaseRole === "manager") ||
          (selectedWorkspace === "senior manager" && databaseRole === "senior manager")
        ) {
          // Pass-through
        } else {
          setError(`Access Denied: Your profile does not have ${activeRole} permissions.`);
          setLoading(false);
          return;
        }
      }

      localStorage.setItem("fwc_token", token);
      localStorage.setItem("fwc_user_role", role);
      localStorage.setItem("fwc_user_name", name);

      setEmail("");
      setPassword("");

      if (databaseRole === "admin") navigate("/admin");
      else if (databaseRole === "senior manager" || databaseRole === "manager") navigate("/manager");
      else if (databaseRole === "recruiter") navigate("/recruiter");
      else if (databaseRole === "employee") navigate("/employee");

    } catch (err) {
      console.error("Login error:", err);
      setError(err.response?.data?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  const rolesConfig = [
    { id: "Admin", label: "Admin", icon: <ShieldCheck size={18} /> },
    { id: "Senior Manager", label: "Manager", icon: <BarChart3 size={18} /> },
    { id: "Recruiter", label: "Recruiter", icon: <Briefcase size={18} /> },
    { id: "Employee", label: "Employee", icon: <UserCheck size={18} /> }
  ];

  // Slides database logic array
  const slidesContent = [
    {
      title: timeGreeting,
      role: "Admin",
      email: "admin@company.com",
      password: "password123"
    },
    {
      title: timeGreeting,
      role: "Senior Manager",
      email: "manager@company.com",
      password: "password123"
    },
    {
      title: timeGreeting,
      role: "Recruiter",
      email: "recruiter@company.com",
      password: "password123"
    },
    {
      title: timeGreeting,
      role: "Employee",
      email: "nikhilraushan470@gmail.com",
      password: "bro1cc6214"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === slidesContent.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? slidesContent.length - 1 : prev - 1));
  };

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 font-sans antialiased flex flex-col justify-between overflow-x-hidden">
      
      {/* Dynamic Embedded Diagonal Floating Keyframe CSS Styles injected in DOM */}
      <style>{`
        @keyframes diagonalFloat {
          0% { transform: translate(0px, 0px); }
          50% { transform: translate(8px, -15px); }
          100% { transform: translate(0px, 0px); }
        }
        .animate-diagonal-float {
          animation: diagonalFloat 6s ease-in-out infinite;
        }
      `}</style>

      {/* Background blueprint elements */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60 pointer-events-none z-0"></div>
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-gradient-to-b from-indigo-100/40 to-sky-100/20 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute bottom-20 left-10 w-[600px] h-[600px] bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none z-0"></div>

      {/* 🧭 Top Navbar */}
      <nav className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="w-[95%] mx-auto py-5 flex justify-between items-center">
          
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-black tracking-tight text-slate-900 select-none">
              FWC Workforce
            </h1>
          </div>

          <div className="relative flex-shrink-0">
            <span className="absolute -inset-1 rounded-xl bg-indigo-500/20 blur-md animate-pulse"></span>
            <Link 
              to="/careers" 
              className="group relative flex items-center gap-3 px-9 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-base font-bold rounded-xl shadow-lg shadow-indigo-600/20 transition-all duration-300 transform hover:scale-[1.03] hover:px-10"
            >
              <Briefcase size={18} className="text-indigo-200 group-hover:text-white transition-colors" />
              <span>Explore Careers</span>
              <ArrowRight size={18} className="opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-300 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-200"></span>
              </span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ⚡ Split-Screen Main Segment */}
      <main className="w-[95%] mx-auto py-12 lg:py-20 flex flex-col lg:flex-row items-stretch justify-between gap-12 lg:gap-4 flex-grow relative z-10">
        
        {/* Column 1: Typography Statements */}
        <div className="w-full lg:w-[38%] flex flex-col justify-center space-y-8 text-left">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-xs font-bold text-indigo-600 tracking-wide uppercase">
              Platform Gateway
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.12]">
              Orchestrate Your <br/>Workforce Ecosystem.
            </h2>
            <p className="text-slate-500 text-base sm:text-lg font-normal leading-relaxed max-w-xl">
              A unified corporate core designed to manage multi-tiered application frameworks, custom operational lifecycles, and direct secure system administration roles seamlessly.
            </p>
          </div>

          <div className="border-t border-slate-200 pt-8 grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-tight">
                <CheckCircle2 size={16} />
                <span>Enterprise Security</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Layered permission architecture matching exact internal active directory roles securely.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm tracking-tight">
                <Globe size={16} />
                <span>Global Infrastructure</span>
              </div>
              <p className="text-xs text-slate-400 leading-normal">
                Synchronized operations coordinating talent pipelines across multi-regional divisions.
              </p>
            </div>
          </div>
        </div>

        {/* 🤖 Column 2: New Diagonal Floating FWCAI Robot & Swipeable Component */}
        <div className="hidden xl:flex w-[22%] flex-col justify-center items-start relative px-2 -ml-20">
          <div className="w-full aspect-[4/5] bg-white rounded-3xl p-6 border border-slate-200/90 flex flex-col justify-between shadow-lg animate-diagonal-float relative overflow-hidden group">
            
            {/* Top Frame: Purple Robot Header Section */}
            <div className="w-full">
              <div className="flex items-center gap-3 pb-4 border-b border-indigo-100">
                <div className="p-2.5 bg-purple-100 text-purple-600 rounded-2xl shadow-sm border border-purple-200">
                  <Bot size={24} className="animate-bounce" />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-900 tracking-tight leading-none">FWCAI</h4>
                  <span className="text-[10px] text-purple-500 font-bold tracking-widest uppercase mt-1 block">Autonomous Core</span>
                </div>
              </div>
            </div>

            {/* Middle Swipeable Content Container Element */}
            <div className="flex-grow flex flex-col justify-center relative py-4 select-none">
            <div className="text-left px-2 space-y-3 transition-all duration-300 transform w-full">
                <h5 className="text-[11px] font-extrabold tracking-widest text-indigo-600 uppercase bg-indigo-50 px-2 py-1 inline-block rounded-md">
                  {slidesContent[currentSlide].title}
                </h5>
                <div className="text-left w-full mt-4">
  <p className="font-bold text-slate-900">
    Login Credentials for {slidesContent[currentSlide].role}
  </p>

  <p className="mt-3">
    <span className="font-semibold">Email:</span>{" "}
    <span className="text-red-500 font-bold">
      {slidesContent[currentSlide].email}
    </span>
  </p>

  <p className="mt-2">
    <span className="font-semibold">Password:</span>{" "}
    <span className="text-red-500 font-bold">
      {slidesContent[currentSlide].password}
    </span>
  </p>
</div>
              </div>
            </div>

            {/* Bottom Slider Control Pagination Bars */}
            <div className="w-full pt-4 border-t border-slate-100 flex items-center justify-between">
              <button 
                onClick={prevSlide} 
                className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-300 transition-colors shadow-sm"
                aria-label="Previous card view"
              >
                <ChevronLeft size={22} strokeWidth={3} />
              </button>
              
              {/* Pagination Indicators track dots */}
              <div className="flex items-center gap-1.5">
                {slidesContent.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentSlide(idx)}
                    className={`h-1.5 rounded-full transition-all ${
                      currentSlide === idx ? "w-5 bg-indigo-600" : "w-1.5 bg-slate-200"
                    }`}
                  />
                ))}
              </div>

              <button 
                onClick={nextSlide} 
                className="p-2 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-indigo-700 border border-indigo-300 transition-colors shadow-sm"
                aria-label="Next card view"
              >
                <ChevronRight size={22} strokeWidth={3} />
              </button>
            </div>

          </div>
        </div>

        {/* Column 3: Significantly Enlarged Verification Panel Card */}
        <div className="w-full lg:w-[48%] xl:w-[34%] flex flex-col justify-center items-end">
          <div className="bg-white w-full lg:w-[540px] rounded-3xl p-10 sm:p-12 shadow-xl shadow-slate-200/80 border border-slate-200/70 transition-all">
            
            <div className="mb-8 text-left">
              <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Workspace Authorization</h3>
              <p className="text-sm text-slate-400 mt-1.5">Select your operational tier and provide authentication tokens.</p>
            </div>

            <div className="grid grid-cols-4 gap-2 bg-slate-100 p-1.5 rounded-xl mb-8">
              {rolesConfig.map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => { setActiveRole(role.id); setError(""); }}
                  className={`flex flex-col sm:flex-row items-center justify-center gap-2 py-3.5 px-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeRole === role.id
                      ? "bg-slate-900 text-white shadow-md font-extrabold scale-[1.02]"
                      : "text-slate-500 hover:text-slate-800 hover:bg-white/40"
                  }`}
                >
                  <span className={activeRole === role.id ? "text-indigo-400" : "text-current"}>
                    {role.icon}
                  </span>
                  <span className="text-[11px] sm:text-xs tracking-tight">{role.label}</span>
                </button>
              ))}
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-medium">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Corporate Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 outline-none text-slate-800 rounded-xl pl-11 pr-4 py-4 text-sm transition-all shadow-inner placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-indigo-500 outline-none text-slate-800 rounded-xl pl-11 pr-4 py-4 text-sm transition-all shadow-inner placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-base font-bold py-4.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex justify-center items-center gap-2"
              >
                {loading ? "Verifying Profile..." : `Access ${activeRole} Suite`}
              </button>
            </form>

          </div>
        </div>
      </main>

      <footer className="w-full text-center py-6 text-xs text-slate-400 border-t border-slate-200/50 bg-white/60">
        &copy; {new Date().getFullYear()} FWC Enterprise Networks. All system interactions are fully audited.
      </footer>
    </div>
  );
}