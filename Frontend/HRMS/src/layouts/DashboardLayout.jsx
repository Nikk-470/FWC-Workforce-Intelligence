import React from "react";
import { useLocation } from "react-router-dom";

// 🟢 FIXED: Removed curly braces to cleanly read your 'export default function Sidebar'
import Sidebar from "@/components/navigation/Sidebar"; 

// 🟢 FIXED: Lowercase path to align safely with your admin pages folder structure
import AdminSidebar from "@/pages/admin/AdminSidebar"; 

export default function DashboardLayout({ children }) {
  const location = useLocation();

  // If the path starts with /admin, strictly render the Admin's unique sidebar
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex bg-slate-50/50 min-h-screen text-slate-800 antialiased font-sans">
      
      {/* 🚀 EACH DASHBOARD OWNS ITS SIDEBAR HERE */}
      {isAdminRoute ? <AdminSidebar /> : <Sidebar />}

      {/* Main Panel Content Window */}
      <main className="flex-1 overflow-y-auto h-screen p-8 relative">
        {children}
      </main>
    </div>
  );
}