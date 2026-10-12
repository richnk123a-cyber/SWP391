import React, { useState, useRef, useEffect } from 'react';
import { User, FileText, Settings, LogOut, ShieldCheck, MapPin, Building2, Map, LayoutDashboard, ChevronDown, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getCompanyLogoUrl, isImageLogo } from '../../utils/logoUtils';
import { DeleteAccountModal } from './DeleteAccountModal';

export function ProfileDropdown() {
  const { currentUser, logout, setActivePage, candidateProfile, currentEmployerCompany, employerProfile } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const dropdownRef = useRef(null);

  const activeEmployerLogo = employerProfile?.logo || currentEmployerCompany?.logo;
  const isEmployerImage = currentUser?.role === 'EMPLOYER' && isImageLogo(activeEmployerLogo);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!currentUser) return null;

  const getDisplayName = () => {
    if (currentUser.role === 'CANDIDATE') return candidateProfile?.name || currentUser.fullName || currentUser.username || currentUser.name || 'Ứng viên';
    if (currentUser.role === 'EMPLOYER') return currentEmployerCompany?.recruiterName || currentUser.fullName || currentUser.username || currentUser.name || 'HR Recruiter';
    return currentUser.fullName || currentUser.name || currentUser.username || 'Trọng Tiến (Admin)';
  };

  const getSubTitle = () => {
    if (currentUser.role === 'CANDIDATE') return candidateProfile?.email || currentUser.email || 'candidate@careerfit.com';
    if (currentUser.role === 'EMPLOYER') return currentEmployerCompany?.name || currentUser.email || 'Công ty IT';
    return currentUser.email || 'trongtien6571@gmail.com';
  };

  const getAvatarContent = () => {
    const name = getDisplayName();
    if (currentUser.role === 'CANDIDATE') {
      if (candidateProfile?.avatarUrl || currentUser?.avatarUrl) {
        return <img src={candidateProfile?.avatarUrl || currentUser?.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />;
      }
      return name ? name.charAt(0).toUpperCase() : 'C';
    }
    if (currentUser.role === 'EMPLOYER') {
      if (isEmployerImage) {
        return (
          <img
            src={getCompanyLogoUrl(activeEmployerLogo)}
            alt="Logo"
            className="w-full h-full object-cover"
            style={{ background: 'transparent' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        );
      }
      return activeEmployerLogo || '🏢';
    }
    return name ? name.charAt(0).toUpperCase() : 'A';
  };

  const handleNavigate = (page) => {
    setIsOpen(false);
    setActivePage(page);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-100 transition-colors focus:outline-none"
      >
        <div className={`w-9 h-9 rounded-full text-white font-bold flex items-center justify-center text-xs border border-blue-200 shadow-xs overflow-hidden shrink-0 ${
          isEmployerImage ? 'bg-transparent' : 'bg-blue-600'
        }`}>
          {getAvatarContent()}
        </div>
        <div className="text-left hidden lg:block">
          <p className="text-xs font-bold text-slate-900 leading-none max-w-[130px] truncate">
            {getDisplayName()}
          </p>
          <span className="text-[10px] font-medium text-slate-500 max-w-[130px] truncate block mt-0.5">
            {getSubTitle()}
          </span>
        </div>
        <ChevronDown size={14} className="text-slate-400 hidden lg:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header Card */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-slate-200 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-sm border-2 border-white shadow-sm overflow-hidden shrink-0 ${
              isEmployerImage ? 'bg-transparent' : 'bg-blue-600'
            }`}>
              {getAvatarContent()}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-slate-900 truncate">{getDisplayName()}</h4>
              <p className="text-[11px] text-slate-500 truncate">{getSubTitle()}</p>
              <span className="inline-block mt-1 text-[9px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded uppercase tracking-wider">
                {currentUser.role}
              </span>
            </div>
          </div>

          {/* Menu items by Role */}
          <div className="p-1.5 divide-y divide-slate-100">
            <div className="py-1">
              {currentUser.role === 'CANDIDATE' && (
                <>
                  <button
                    onClick={() => handleNavigate('candidate-onboarding')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <User size={15} className="text-slate-400" /> Hồ sơ cá nhân
                  </button>
                  <button
                    onClick={() => handleNavigate('candidate-onboarding')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <FileText size={15} className="text-slate-400" /> CV & Đính kèm PDF
                  </button>
                  <button
                    onClick={() => handleNavigate('learning-roadmap')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <Map size={15} className="text-slate-400" /> Learning Roadmap
                  </button>
                  <button
                    onClick={() => handleNavigate('application-kanban')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <LayoutDashboard size={15} className="text-slate-400" /> Theo dõi ứng tuyển
                  </button>
                </>
              )}

              {currentUser.role === 'EMPLOYER' && (
                <>
                  <button
                    onClick={() => handleNavigate('employer-dashboard')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <Building2 size={15} className="text-slate-400" /> Hồ sơ Doanh nghiệp
                  </button>
                  <button
                    onClick={() => handleNavigate('employer-register')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <ShieldCheck size={15} className="text-slate-400" /> Trang xác minh GPKD
                  </button>
                </>
              )}

              {currentUser.role === 'ADMIN' && (
                <>
                  <button
                    onClick={() => handleNavigate('admin-dashboard')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <LayoutDashboard size={15} className="text-slate-400" /> OverView Dashboard
                  </button>
                  <button
                    onClick={() => handleNavigate('admin-user-management')}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
                  >
                    <User size={15} className="text-slate-400" /> Quản lý người dùng
                  </button>
                </>
              )}
            </div>

            <div className="py-1">
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (currentUser.role === 'CANDIDATE') setActivePage('candidate-profile');
                  else if (currentUser.role === 'EMPLOYER') setActivePage('company-profile');
                  else setActivePage('admin-dashboard');
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-blue-600 flex items-center gap-2.5 transition-colors"
              >
                <Settings size={15} className="text-slate-400" /> Cài đặt tài khoản
              </button>
            </div>

            <div className="py-1 border-t border-slate-100">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsDeleteModalOpen(true);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors"
              >
                <Trash2 size={15} className="text-rose-600" /> Xóa tài khoản
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
              >
                <LogOut size={15} className="text-slate-500" /> Đăng xuất
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xóa tài khoản 2 bước xác minh */}
      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}
