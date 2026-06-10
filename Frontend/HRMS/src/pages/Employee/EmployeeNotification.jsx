import { useState, useEffect } from "react";
import { Bell, Info, Trash2, Clock } from "lucide-react";
import axios from "axios";

export default function EmployeeNotification({ currentEmployeeId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchLiveNotifications = async () => {
      if (!currentEmployeeId) return;
      
      try {
        const token = localStorage.getItem("fwc_token");
        const res = await axios.get(`Frontend/HRMS/src/**/api/tasks/notifications/${currentEmployeeId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success && Array.isArray(res.data.notifications)) {
          setNotifications(res.data.notifications);
        }
      } catch (err) {
        console.error("Error reading MongoDB notification collection:", err);
      }
    };

    fetchLiveNotifications();
    const loopInterval = setInterval(fetchLiveNotifications, 10000); // Polls every 10 seconds
    return () => clearInterval(loopInterval);
  }, [currentEmployeeId]);

  // 🔥 BACKEND MATCH: Matches your schema key 'isRead'
  const unreadCount = notifications.filter(n => !n.isRead).length;

  const clearNotificationLocal = (id) => {
    setNotifications(prev => prev.filter((n) => n._id !== id));
  };

  return (
    <div className="relative inline-block text-left z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl transition-all outline-none border border-slate-200/60 dark:border-slate-800"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-black text-white ring-2 ring-white dark:ring-slate-950">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transform origin-top-right transition-all">
            <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 tracking-tight">Your Inbox Desk</h4>
                <p className="text-[10px] text-slate-400">Live operational dispatches</p>
              </div>
            </div>

            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Inbox clean. No corporate dispatches filed.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif._id}
                    className="p-4 bg-slate-50/50 dark:bg-slate-800/30 transition-colors flex gap-3 items-start"
                  >
                    <div className="bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400 p-1.5 rounded-lg mt-0.5">
                      <Info size={15} />
                    </div>
                    
                    <div className="flex-grow space-y-0.5">
                      <div className="flex justify-between items-baseline gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          🚀 New Team Objective Deployed
                        </span>
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 flex items-center gap-1 shrink-0">
                          <Clock size={10} /> Just now
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                        {notif.message}
                      </p>
                      
                      <div className="text-right pt-1">
                        <button
                          onClick={() => clearNotificationLocal(notif._id)}
                          className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-rose-400 inline-flex items-center gap-1"
                        >
                          <Trash2 size={11} /> Clear entry
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}