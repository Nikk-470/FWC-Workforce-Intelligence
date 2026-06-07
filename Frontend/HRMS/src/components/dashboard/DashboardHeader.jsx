import React, { useState, useEffect } from 'react';

const DashboardHeader = () => {
  const [userName, setUserName] = useState("Admin");
  const [avatarUrl, setAvatarUrl] = useState(""); // Change this to a string url path if you store profile pictures later

  useEffect(() => {
    try {
      const token = localStorage.getItem("fwc_token");
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(window.atob(base64));
        if (payload && payload.name) {
          setUserName(payload.name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Compute the first alphabetical token character as fallback placeholder layout symbol
  const initialFallbackLetter = userName ? userName.trim().charAt(0).toUpperCase() : "A";

  return (
    <header className="flex justify-end items-center px-6 py-4 bg-transparent border-b border-slate-100/40">
      {/* PROFILE SELECTION ACTIONS AREA */}
      <div className="flex items-center gap-3">
        
        {/* Dynamic Circular User Indicator Badge */}
        <div className="w-9 h-9 rounded-full flex items-center justify-center border border-slate-200/80 bg-indigo-50 text-indigo-700 shadow-2xs overflow-hidden font-bold text-sm">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt={userName} 
              className="w-full h-full object-cover"
            />
          ) : (
            <span>{initialFallbackLetter}</span>
          )}
        </div>
        
      </div>
    </header>
  );
};

export default DashboardHeader;