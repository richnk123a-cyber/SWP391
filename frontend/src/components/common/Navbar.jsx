import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Search, Briefcase, Layers, Menu, ChevronRight, Command } from 'lucide-react';
import { NotificationDropdown } from './NotificationDropdown';
import { ProfileDropdown } from './ProfileDropdown';
import { RegisterRoleModal } from '../auth/RegisterRoleModal';
import { BrandLogo } from './BrandLogo';
import '../auth/LoginPage.css';

export function Navbar() {
  const {
    currentUser,
    employerProfile,
    activePage,
    setActivePage,
    toggleMobileDrawer,
    globalSearchQuery,
    setGlobalSearchQuery
  } = useApp();

  const [globalSearch, setGlobalSearch] = useState(globalSearchQuery || '');
  const [isRegisterRoleOpen, setIsRegisterRoleOpen] = useState(false);
  const searchInputRef = useRef(null);

  const openPublicHome = () => {
    setActivePage('home');
  };

  const isCinematicPage = ['home', 'login'].includes(activePage);

  useEffect(() => {
    setGlobalSearch(globalSearchQuery || '');
  }, [globalSearchQuery]);

  // Global Ctrl + K / Cmd + K keyboard shortcut to focus search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleGlobalSearchSubmit = (e) => {
    e.preventDefault();
    setGlobalSearchQuery(globalSearch);
    if (!currentUser || currentUser.role === 'CANDIDATE') {
      setActivePage('job-search', { query: { keyword: globalSearch.trim() } });
    } else if (currentUser.role === 'EMPLOYER') {
      setActivePage('applicant-management');
    } else if (currentUser.role === 'ADMIN') {
      setActivePage('user-management');
    }
  };

  const getPlaceholderText = () => {
    if (!currentUser || currentUser.role === 'CANDIDATE') {
      return 'Tìm việc, công ty hoặc kỹ năng (Java, React...)...';
    }
    if (currentUser.role === 'EMPLOYER') {
      return 'Tìm ứng viên, kỹ năng hoặc vị trí mục tiêu...';
    }
    if (currentUser.role === 'ADMIN') {
      return 'Tìm người dùng, doanh nghiệp, tin tuyển dụng...';
    }
    return 'Tìm kiếm...';
  };

  // Breadcrumb text based on activePage
  const getBreadcrumbLabel = () => {
    switch (activePage) {
      case 'candidate-dashboard': return 'Dashboard';
      case 'job-search': return 'Việc làm IT';
      case 'job-detail': return 'Chi tiết việc làm';
      case 'candidate-profile':
      case 'candidate-onboarding': return 'Hồ sơ & CV';
      case 'learning-roadmap': return 'Lộ trình học tập';
      case 'candidate-security':
      case 'employer-security':
      case 'admin-security': return 'Cài đặt tài khoản';
      case 'application-kanban': return 'Quản lý Ứng tuyển';
      case 'employer-dashboard': return 'Tổng quan tuyển dụng';
      case 'employer-register': return 'Xác minh doanh nghiệp';
      case 'job-management': return 'Quản lý tin đăng';
      case 'create-job': return 'Đăng tin mới';
      case 'applicant-management': return 'Quản lý Ứng viên';
      case 'recruitment-pipeline': return 'Quy trình Kanban';
      case 'company-profile': return 'Hồ sơ công ty';
      case 'admin-dashboard': return 'Admin Dashboard';
      case 'admin-verifications': return 'Xác minh doanh nghiệp';
      case 'admin-job-moderation': return 'Kiểm duyệt tin';
      case 'admin-reports': return 'Báo cáo vi phạm';
      case 'admin-user-management': return 'Quản lý người dùng';
      case 'admin-skills': return 'Danh mục kỹ năng';
      case 'admin-roadmaps': return 'Quản lý Roadmap';
      default: return 'Trang chủ';
    }
  };

  if (!currentUser) {
    return (
      <header className={`login-header ${isCinematicPage ? 'login-header--cinematic' : ''}`}>
        <div className="login-header-inner">
          <button type="button" className="login-brand" onClick={openPublicHome} aria-label="CareerFit — Trang chủ">
            <BrandLogo />
          </button>
          {isCinematicPage && <nav className="public-navigation" aria-label="Điều hướng chính">
            <button type="button" aria-current={activePage === 'home' ? 'page' : undefined} onClick={openPublicHome}>Trang chủ</button>
            <button type="button" onClick={() => setActivePage('job-search')}>Việc làm</button>
            <a className="public-navigation-about" href="/#careerfit-opportunities">Khám phá</a>
            <button type="button" className="public-navigation-employer" onClick={() => setActivePage('employer-register')}>Doanh nghiệp</button>
          </nav>}
          <div className="login-header-actions">
            <button type="button" className="login-register" aria-current={activePage === 'login' ? 'page' : undefined} onClick={() => setActivePage(activePage === 'login' ? 'home' : 'login')}>{activePage === 'login' ? 'Về trang chủ' : 'Đăng nhập'}{isCinematicPage && <ChevronRight size={14} aria-hidden="true" />}</button>

          </div>
        </div>
        <RegisterRoleModal isOpen={isRegisterRoleOpen} onClose={() => setIsRegisterRoleOpen(false)} onSelectRole={setActivePage} />
      </header>
    );
  }

  return (
    <header className={`${currentUser ? 'workspace-navbar' : ''} bg-white border-b border-slate-200/80 sticky top-0 z-40 h-16 transition-colors`}>
      <div className={`w-full ${!currentUser ? 'max-w-5xl mx-auto px-4' : 'px-4 sm:px-6 lg:px-8'} h-full flex items-center justify-between gap-4`}>
        {/* LEFT: Logo Brand & Public Navigation */}
        <div className="flex items-center gap-2 sm:gap-6 shrink-0">
          {/* Mobile Drawer Hamburger Button */}
          {currentUser && (
            <button
              onClick={toggleMobileDrawer}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 lg:hidden transition-colors"
              title="Mở Navigation Drawer"
            >
              <Menu size={20} />
            </button>
          )}

          {/* Product Logo & Brand */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            aria-label="CareerFit — Trang tổng quan"
            onClick={() => {
              if (!currentUser) openPublicHome();
              else if (currentUser.role === 'CANDIDATE') setActivePage('candidate-dashboard');
              else if (currentUser.role === 'EMPLOYER') setActivePage('employer-dashboard');
              else if (currentUser.role === 'ADMIN') setActivePage('admin-dashboard');
            }}
          >
            <BrandLogo />
          </button>

          {/* Public Nav Links (next to logo, matching design) */}
          {!currentUser && (
            <nav className="hidden sm:flex items-center gap-5 ml-2">
              <button
                type="button"
                onClick={openPublicHome}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  ['home', 'job-search', 'job-detail'].includes(activePage) ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Việc làm
              </button>
              <button
                type="button"
                onClick={() => setActivePage('employer-register')}
                className={`text-sm font-medium transition-colors cursor-pointer ${
                  activePage === 'employer-register' ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Doanh nghiệp
              </button>
            </nav>
          )}

          {/* Contextual Breadcrumb (Dashboard mode) */}
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 text-xs font-medium pl-3 border-l border-slate-200/80">
              <button
                onClick={() => {
                  if (currentUser.role === 'CANDIDATE') setActivePage('candidate-dashboard');
                  else if (currentUser.role === 'EMPLOYER') setActivePage('employer-dashboard');
                  else setActivePage('admin-dashboard');
                }}
                className="workspace-role-badge px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold text-[10px] uppercase tracking-wider border border-blue-200/80 transition-colors"
              >
                {{ CANDIDATE: 'Ứng viên', EMPLOYER: 'Nhà tuyển dụng', ADMIN: 'Quản trị viên' }[currentUser.role]}
              </button>
              <ChevronRight size={13} className="text-slate-400" />
              <span className="font-extrabold text-slate-900 text-xs tracking-tight">{getBreadcrumbLabel()}</span>
            </div>
          )}
        </div>

        {/* CENTER: Context-aware Global Search (only for logged-in dashboard) */}
        {currentUser && (
          <div className="flex-1 justify-center hidden md:flex mx-4">
            <form
              onSubmit={handleGlobalSearchSubmit}
              className="relative w-full max-w-[360px] focus-within:max-w-[460px] transition-all duration-200 ease-out"
            >
              <div className="relative flex items-center">
                <Search className="absolute left-3 text-slate-400 pointer-events-none" size={17} />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="workspace-search w-full pl-9 pr-14 py-2 text-xs font-medium bg-slate-100/80 border border-slate-200 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all placeholder:text-slate-400"
                  placeholder={getPlaceholderText()}
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                />
                <span className="absolute right-2.5 px-1.5 py-0.5 rounded bg-slate-200/60 text-[10px] font-bold text-slate-500 flex items-center gap-0.5 pointer-events-none border border-slate-300/40">
                  <Command size={10} /> K
                </span>
              </div>
            </form>
          </div>
        )}

        {/* RIGHT: Primary Action, Notifications & Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {!currentUser ? (
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setActivePage('login')}
                className="px-2.5 py-1.5 text-slate-700 hover:text-slate-900 font-medium text-sm transition-colors cursor-pointer"
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => setIsRegisterRoleOpen(true)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm transition-colors shadow-2xs cursor-pointer"
              >
                Đăng ký
              </button>
            </div>
          ) : (
            <>
              {/* Context Role Primary CTA Button with Hover Lift */}
              {currentUser.role === 'EMPLOYER' && (
                <button
                  onClick={() => setActivePage('create-job')}
                  disabled={employerProfile?.verificationStatus !== 'Verified'}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs hover:-translate-y-0.5 hidden sm:flex items-center gap-1.5"
                >
                  Đăng tin mới
                </button>
              )}
              {currentUser.role === 'CANDIDATE' && (
                <button
                  onClick={() => setActivePage('job-search')}
                  className="workspace-find-jobs px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs hover:-translate-y-0.5 hidden sm:flex items-center gap-1.5"
                >
                  <Briefcase size={15} /> Tìm việc ngay
                </button>
              )}
              {currentUser.role === 'ADMIN' && (
                <button
                  onClick={() => setActivePage('admin-job-moderation')}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs transition-all shadow-xs hover:-translate-y-0.5 hidden sm:flex items-center gap-1.5"
                >
                  <Layers size={15} /> Kiểm duyệt tin
                </button>
              )}

              {/* Notification Center Popover */}
              <NotificationDropdown />

              {/* Profile Dropdown */}
              <ProfileDropdown />
            </>
          )}
        </div>
      </div>

      {/* Role Selection Modal on Register */}
      <RegisterRoleModal
        isOpen={isRegisterRoleOpen}
        onClose={() => setIsRegisterRoleOpen(false)}
        onSelectRole={setActivePage}
      />
    </header>
  );
}







