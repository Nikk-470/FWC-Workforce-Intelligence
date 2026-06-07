import React from "react";
import { Layers, Users, CheckSquare, Menu, X, LogOut, ShieldAlert, ClipboardList } from "lucide-react"; // 🚀 Added ClipboardList for leaves!

export default function SMSidebar({
  isSidebarVisible,
  setIsSidebarVisible,
  activeView,
  setActiveView,
  onTeamChange,
  currentSelectedTeam
}) {
  
  // 📜 Mapped "leave-triage" perfectly into your main workflow tracker array
  const navigationItems = [
    { id: "dashboard", label: "Dashboard", icon: Layers },
    { id: "teamDeck", label: "Team Clusters", icon: Users },
    { id: "taskDeck", label: "Sprint Planner", icon: CheckSquare },
    { id: "leave-triage", label: "Leave Requests", icon: ClipboardList }, // 🚀 New operational lane!
  ];

  const handleLogout = () => {
    localStorage.removeItem("fwc_token");
    window.location.href = "/login"; 
  };

  return (
    <>
      {/* Mobile Top Navigation Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-2 text-white">
          <ShieldAlert size={20} className="text-indigo-400" />
          <span className="font-bold text-sm tracking-wide">SM Control Panel</span>
        </div>
        <button 
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className="p-1 rounded-lg text-slate-400 hover:text-white bg-slate-800 transition-colors"
        >
          {isSidebarVisible ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Background Overlay Backdrop for Mobile Drawers */}
      {isSidebarVisible && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40"
          onClick={() => setIsSidebarVisible(false)}
        />
      )}

      {/* Primary Left Sidebar Layout Drawer */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-64 bg-slate-900 text-slate-300 border-r border-slate-800 flex flex-col z-40 transition-transform duration-300 lg:translate-x-0 pt-14 lg:pt-0 ${
          isSidebarVisible ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Workspace Brand Label Area */}
        <div className="p-6 border-b border-slate-800 hidden lg:flex items-center gap-2.5">
          <div className="p-2 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-indigo-400">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="font-bold text-white text-sm tracking-tight leading-none">Operations Suite</h2>
            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider block mt-1">Cluster Root Node</span>
          </div>
        </div>

        {/* Dynamic Structural Link System */}
        <nav className="flex-1 p-4 space-y-1.5 mt-4">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 block mb-2">Main Controls</span>
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  // Auto-collapse sidebar on smaller layouts after select
                  if (window.innerWidth < 1024) setIsSidebarVisible(false);
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-xl transition-all ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" 
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <IconComponent size={16} className={isActive ? "text-white" : "text-slate-400"} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Global Context Workspace Indicator & Disconnect Handle */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="px-3 py-2 bg-slate-800/40 border border-slate-800 rounded-xl">
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Isolated Team Scope</span>
            <span className="text-xs font-bold text-slate-200 block truncate mt-0.5">
              {currentSelectedTeam}
            </span>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 rounded-xl transition-all cursor-pointer"
          >
            <LogOut size={14} />
            <span>Terminate Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}