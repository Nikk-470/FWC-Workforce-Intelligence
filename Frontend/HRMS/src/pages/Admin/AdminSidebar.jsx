import React from "react";
import { LayoutDashboard, Users, CalendarDays, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom"; 

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
    title: "Settings",
    icon: Settings,
    path: "/admin/settings",
  }
];

export default function AdminSidebar() {
  const location = useLocation();

  return (
    <aside className="w-72 bg-white border-r h-screen p-4 flex flex-col justify-between shrink-0">
      <div>
        {/* Admin Operational Branding Header */}
        <div className="mb-8 pl-2">
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">FWC</h2>
          <p className="text-[10px] text-indigo-600 font-extrabold tracking-wider uppercase mt-0.5">Admin Workspace</p>
        </div>

        {/* Dynamic Link Mapping */}
        <div className="space-y-1.5">
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.title}
                to={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all tracking-wide ${
                  isActive
                    ? "bg-indigo-50/80 text-indigo-600 shadow-xs" 
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900" 
                }`}
              >
                <item.icon 
                  size={18} 
                  className={isActive ? "text-indigo-600" : "text-slate-400"} 
                />
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
    </aside>
  );
}