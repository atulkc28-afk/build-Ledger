import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { formatDateTime } from '../../utils/formatters';

export const NotificationDropdown: React.FC = () => {
  const { notifications, currentRole, markNotificationRead, markAllNotificationsRead } = useApp();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const visibleNotifications = notifications.filter(
    (n) => n.targetRole === currentRole || n.targetRole === 'both',
  );
  const unreadCount = visibleNotifications.filter((n) => !n.read).length;

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Open notifications"
        className="relative p-2 rounded-lg border border-[#E6E9EF] bg-white text-[#20252D] hover:bg-[#F0F2F5] transition-colors cursor-pointer"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-mono font-semibold flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E6E9EF] rounded-xl shadow-lg z-40 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#E6E9EF]">
            <span className="text-xs font-semibold text-[#172B4D]">
              Notifications ({unreadCount} unread)
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllNotificationsRead}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-[#E6E9EF]">
            {visibleNotifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-[#707987]">
                No notifications right now.
              </div>
            ) : (
              visibleNotifications.slice(0, 12).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    markNotificationRead(n.id);
                    setOpen(false);
                    navigate(n.link);
                  }}
                  className={`w-full text-left px-4 py-3 hover:bg-[#F7F8FA] transition-colors cursor-pointer ${
                    !n.read ? 'bg-[#EFF6FF]/40' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold text-[#172B4D]">{n.title}</span>
                    {!n.read && (
                      <span className="text-[10px] font-semibold text-[#2563EB] shrink-0">New</span>
                    )}
                  </div>
                  <p className="mt-0.5 text-xs text-[#707987] line-clamp-2">{n.message}</p>
                  <div className="mt-1 text-[11px] text-[#707987] font-mono">
                    {formatDateTime(n.timestamp)}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
