import { useState } from "react";
import { Bell, Check, Trash2, ShieldAlert, Clock } from "lucide-react";

export default function ManagerNotification() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: "leave_request",
      sender: "Alice Smith (Developer)",
      message: "Requested 3 days of medical leave for next week.",
      time: "10 mins ago",
      read: false,
    },
    {
      id: 2,
      type: "timesheet",
      sender: "Bob Jones (Designer)",
      message: "Submitted pending overtime logs for Project Nexus approval.",
      time: "2 hours ago",
      read: false,
    }
  ]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = (id) => {
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const deleteNotification = (id) => {
    setNotifications(notifications.filter((n) => n.id !== id));
  };

  return (
    <div className="relative inline-block text-left z-50">
      {/* 🔔 Top Left Positioned Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all outline-none border border-slate-200/60"
        aria-label="Toggle Manager Notifications"
      >
        <Bell size={20} className={unreadCount > 0 ? "animate-swing" : ""} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu Window Panel */}
      {isOpen && (
        <>
          <div className="fixed inset-0" onClick={() => setIsOpen(false)} />
          <div className="absolute left-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden transform origin-top-left transition-all">
            <div className="p-4 bg-slate-900 text-white flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sm tracking-tight">Manager Alert Gateway</h4>
                <p className="text-[10px] text-slate-400">Direct reports operational streams</p>
              </div>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-indigo-500/30 text-indigo-300 font-bold px-2 py-0.5 rounded-full">
                  {unreadCount} Actionable
                </span>
              )}
            </div>

            <div className="max-h-[320px] overflow-y-auto divide-y divide-slate-100">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No active incoming requests pending review.
                </div>
              ) : (
                notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={`p-4 transition-colors flex gap-3 items-start ${
                      notif.read ? "bg-white" : "bg-indigo-50/40"
                    }`}
                  >
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-lg mt-0.5">
                      <ShieldAlert size={15} />
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-bold text-slate-900">{notif.sender}</span>
                        <span className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Clock size={10} /> {notif.time}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-normal">{notif.message}</p>
                      
                      <div className="flex gap-2 pt-2">
                        {!notif.read && (
                          <button
                            onClick={() => markAsRead(notif.id)}
                            className="flex items-center gap-1 text-[10px] bg-white hover:bg-slate-100 border border-slate-200 font-bold px-2 py-1 rounded-md text-emerald-600 transition-colors"
                          >
                            <Check size={12} /> Mark read
                          </button>
                        )}
                        <button
                          onClick={() => deleteNotification(notif.id)}
                          className="flex items-center gap-1 text-[10px] bg-white hover:bg-red-50 border border-slate-200 text-slate-400 hover:text-red-600 px-2 py-1 rounded-md transition-colors ml-auto"
                        >
                          <Trash2 size={12} />
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