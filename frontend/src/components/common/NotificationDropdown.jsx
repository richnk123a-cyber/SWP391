import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCheck, Briefcase, Calendar, CheckCircle2, ShieldAlert, FileText, ExternalLink, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function NotificationDropdown() {
  const { currentUser, notifications, markAllNotificationsAsRead, setActivePage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter notifications dynamically for currently logged in user
  const myNotifications = React.useMemo(() => {
    if (!currentUser) return [];
    const queryEmail = (currentUser.email || '').toLowerCase();
    const queryId = currentUser.id;
    const isCurrentUserAdmin = currentUser.role === 'ADMIN';

    return (notifications || []).filter(n => {
      // 1. Khớp ID người nhận
      if (n.recipientId && (n.recipientId === queryId || n.userId === queryId)) return true;
      // 2. Khớp email người nhận
      if (n.recipientEmail && n.recipientEmail.toLowerCase() === queryEmail) return true;
      // 3. Nếu người dùng hiện tại là ADMIN: mở toàn quyền nhận thông báo hệ thống & thông báo admin
      if (isCurrentUserAdmin) {
        if (n.recipientRole === 'ADMIN') return true;
        if (n.type === 'USER_DELETED_ACCOUNT' || n.type === 'SYSTEM_AUDIT' || n.type === 'ADMIN_NOTIFICATION') return true;
        if (n.recipientEmail?.toLowerCase() === 'trongtien6571@gmail.com' || n.recipientId === 'user-admin-1') return true;
        if (!n.recipientId && !n.recipientEmail) return true;
      }
      return false;
    });
  }, [notifications, currentUser]);

  const unreadCount = myNotifications.filter(n => n.unread).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-10 h-10 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center focus:outline-none border border-slate-200/60"
        title="Thông báo"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden transition-all duration-180 animate-in fade-in slide-in-from-top-2">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900">Thông báo hệ thống</h4>
              {unreadCount > 0 && (
                <span className="bg-blue-100 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-full">
                  {unreadCount} mới
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllNotificationsAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Đã đọc hết
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {myNotifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs space-y-1">
                <Bell size={24} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-600">Chưa có thông báo nào</p>
                <p className="text-[11px] text-slate-400">Các thông báo ứng tuyển & kết quả sẽ tự động xuất hiện tại đây.</p>
              </div>
            ) : (
              myNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => {
                    setIsOpen(false);
                    if (item.page) setActivePage(item.page);
                  }}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${
                    item.unread ? 'bg-blue-50/40' : ''
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-xs">
                    {item.type === 'APPLICATION_STATUS_CHANGED' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : item.type === 'NEW_APPLICATION' ? (
                      <FileText className="w-4 h-4 text-blue-600" />
                    ) : item.type === 'COMPANY_ACCOUNT_DELETED' || item.type === 'USER_DELETED_ACCOUNT' ? (
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    ) : (
                      <Briefcase className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1 mb-0.5">
                      <p className={`text-xs ${item.unread ? 'font-bold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
            <button
              onClick={() => {
                setIsOpen(false);
                if (currentUser.role === 'CANDIDATE') setActivePage('application-kanban');
                else if (currentUser.role === 'EMPLOYER') setActivePage('employer-dashboard');
                else setActivePage('admin-dashboard');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 mx-auto"
            >
              Xem chi tiết <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
