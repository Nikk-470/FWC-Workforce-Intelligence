import React from "react";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Video, 
  CalendarDays,
  BarChart3,
  Settings,
  FolderPlus 
} from "lucide-react";
import { Link, useLocation } from "react-router-dom"; 

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/recruiter", 
  },
  {
    title: "Pipeline Screening",
    icon: Briefcase, 
    path: "/recruiter/pipeline",
  },
  
  
  {
    title: "Interviews", 
    icon: Video,
    path: "/recruiter/interviews",
  },
 
  
  {
    title: "Job Openings", 
    icon: FolderPlus,      
    path: "/recruiter/jobs", 
  }
];

// 🟢 THE CRITICAL FIX: Explicitly exporting default function wrapper
export default function Sidebar() {
  const location = useLocation(); 

  return (
    <aside className="w-72 bg-white border-r h-screen p-4 flex flex-col justify-between shadow-xs">
      <div>
        {/* Branding Headers */}
        <div className="mb-8 px-2">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">FWC</h2>
          <p className="text-xs font-medium text-slate-400">Workforce Intelligence</p>
        </div>

        {/* Mapped Action Buttons */}
        <div className="space-y-1">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path} 
                to={item.path}  
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold transition text-xs ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600 shadow-3xs" 
                    : "text-slate-500 hover:bg-slate-50/80 hover:text-slate-900" 
                }`}
              >
                <item.icon 
                  size={16} 
                  className={isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600"} 
                />
                <span>{item.title}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}