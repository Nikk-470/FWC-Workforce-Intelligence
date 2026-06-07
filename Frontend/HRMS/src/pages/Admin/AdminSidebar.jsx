import React from "react";
import { LayoutDashboard, Users, CalendarDays, IndianRupee, LogOut } from "lucide-react"; 
import { Link, useLocation, useNavigate } from "react-router-dom"; 

const adminMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin", 
  },
  {
    title: "Employees",
    icon: Users,
    path: "/admin/employees", 
  },
  {
    title: "Attendance",
    icon: CalendarDays,
    path: "/admin/attendance", 
  },
  {
    title: "Payment", 
    icon: IndianRupee,
    path: "/admin/payment", 
  }
];

export default function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("fwc_token"); 
    navigate("/login"); 
  };

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-900 h-screen p-5 flex flex-col justify-between shrink-0 font-sans tracking-normal select-none">
      
      {/* 🔝 TOP NAVIGATION MATRICES */}
      <div>
        {/* Glowing Executive Branding Block */}
        <div className="mb-10 flex items-center gap-3 px-2 pt-1">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-indigo-500/20 border border-indigo-400/20">
            F
          </div>
          <div>
            <h2 className="text-sm font-black text-slate-100 tracking-tight leading-none uppercase">FWC Engine</h2>
            <p className="text-[9px] text-indigo-400 font-extrabold tracking-widest uppercase mt-1">Management Hub</p>
          </div>
        </div>

        {/* Dynamic Link Mapping Workspace */}
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-3 mb-3">Main Menu</p>
          
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.title}
                to={item.path}
                className={`group w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all duration-200 relative ${
                  isActive
                    ? "bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/10 border border-indigo-500/20" 
                    : "text-slate-400 hover:bg-slate-900/60 hover:text-slate-100" 
                }`}
              >
                {/* Clean Left Edge Active Node Accent */}
                {isActive && (
                  <span className="absolute left-0 top-3 bottom-3 w-0.5 bg-white rounded-r-full" />
                )}
                
                <item.icon 
                  size={18} 
                  className={`transition-colors duration-200 ${
                    isActive ? "text-white" : "text-slate-500 group-hover:text-slate-300"
                  }`} 
                />
                <span className="tracking-wide">{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 📥 BOTTOM ANCHORED IMMERSIVE SIGNOUT */}
      <div className="border-t border-slate-900 pt-4">
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-bold text-xs text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 transition-all duration-200 tracking-wide cursor-pointer group"
        >
          <LogOut size={17} className="text-rose-500 transition-transform duration-200 group-hover:-translate-x-0.5" />
          <span className="font-semibold tracking-wide">Sign Out Session</span>
        </button>
      </div>

    </aside>
  );
}