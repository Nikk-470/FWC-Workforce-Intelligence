import React from "react";
import { useLocation } from "react-router-dom";

// 1. Keep your original Recruiter sidebar import from components
import Sidebar from "@/components/navigation/Sidebar"; 

// 2. Import your dedicated Admin sidebar right from its own Admin page home folder!
import AdminSidebar from "@/pages/Admin/AdminSidebar"; 

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