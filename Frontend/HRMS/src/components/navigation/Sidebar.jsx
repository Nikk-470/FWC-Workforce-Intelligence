import {
    LayoutDashboard,
    Users,
    Briefcase,
    CalendarDays,
    BarChart3,
    Settings,
  } from "lucide-react";
  
  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Employees",
      icon: Users,
    },
    {
      title: "Recruitment",
      icon: Briefcase,
    },
    {
      title: "Attendance",
      icon: CalendarDays,
    },
    {
      title: "Analytics",
      icon: BarChart3,
    },
    {
      title: "Settings",
      icon: Settings,
    },
  ];
  
  export default function Sidebar() {
    return (
      <aside className="w-72 bg-white border-r h-screen p-4">
       <div className="mb-8">
  <h2 className="text-xl font-bold">
    FWC
  </h2>

  <p className="text-sm text-slate-500">
    Workforce Intelligence
  </p>
</div>
  
        <div className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.title}
              className="
                w-full
                flex
                items-center
                gap-3
                px-4
                py-3
                rounded-xl
                hover:bg-slate-100
                transition
              "
            >
              <item.icon size={20} />
              {item.title}
            </button>
          ))}
        </div>
      </aside>
    );
  }