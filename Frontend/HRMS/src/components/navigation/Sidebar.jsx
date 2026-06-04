import {
  LayoutDashboard,
  Users,
  Briefcase,
  Video, // 📅 Added for your new page!
  CalendarDays,
  BarChart3,
  Settings,
} from "lucide-react";
// Import Link from react-router-dom so clicking tabs changes pages without reloading the whole browser
import { Link, useLocation } from "react-router-dom"; 

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    path: "/recruiter", // Matches your current URL structure
  },
  {
    title: "Employees",
    icon: Users,
    path: "/recruiter/employees",
  },
  {
    title: "Recruitment",
    icon: Briefcase,
    path: "/recruiter/recruitment",
  },
  {
    title: "Interviews", // 📅 Your brand new navigation button!
    icon: Video,
    path: "/recruiter/interviews",
  },
  {
    title: "Attendance",
    icon: CalendarDays,
    path: "/recruiter/attendance",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    path: "/recruiter/analytics",
  },
  {
    title: "Settings",
    icon: Settings,
    path: "/recruiter/settings",
  },
  {
    title: "Recruitment",
    icon: Briefcase,
    path: "/recruiter/jobs", // Change path to match this location string
  }
];

export default function Sidebar() {
  const location = useLocation(); // Tracks which page you are currently viewing

  return (
    <aside className="w-72 bg-white border-r h-screen p-4 flex flex-col justify-between">
      <div>
        {/* Logo / Title Branding */}
        <div className="mb-8">
          <h2 className="text-xl font-bold">FWC</h2>
          <p className="text-sm text-slate-500">Workforce Intelligence</p>
        </div>

        {/* Navigation List Links */}
        <div className="space-y-2">
          {menuItems.map((item) => {
            // Check if this menu item matches the page the recruiter is looking at
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.title}
                to={item.path} // 'to' replaces standard 'href' in React Router
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition text-sm ${
                  isActive
                    ? "bg-indigo-50 text-indigo-600" // Highlight style if active tab
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900" // Standard fallback style
                }`}
              >
                <item.icon 
                  size={20} 
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