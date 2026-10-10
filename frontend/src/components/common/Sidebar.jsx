import React, { useLayoutEffect, useRef, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { getCompanyLogoUrl, isImageLogo } from '../../utils/logoUtils';
import { LayoutDashboard, Search, FileText, Map, Kanban, Building2, PlusCircle, Users, ShieldAlert, ShieldCheck, Cpu, Layers, LogOut, ChevronLeft, ChevronRight, X, ArrowUpRight } from 'lucide-react';
import './Sidebar.css';

const MENU_GROUPS = {
  CANDIDATE: [
    { label: 'Tổng quan', items: [{ id: 'candidate-dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { label: 'Sự nghiệp', items: [
      { id: 'job-search', label: 'Khám phá việc làm', icon: Search },
      { id: 'application-kanban', label: 'Đơn ứng tuyển', icon: Kanban },
      { id: 'learning-roadmap', label: 'Lộ trình học tập', icon: Map },
    ] },
    { label: 'Tài khoản', items: [
      { id: 'candidate-profile', label: 'Hồ sơ & CV', icon: FileText },
    ] },
  ],
  EMPLOYER: [
    { label: 'Tổng quan', items: [{ id: 'employer-dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { label: 'Tuyển dụng', items: [
      { id: 'job-management', label: 'Tin tuyển dụng', icon: PlusCircle },
      { id: 'applicant-management', label: 'Ứng viên', icon: Users },
      { id: 'recruitment-pipeline', label: 'Quy trình tuyển dụng', icon: Kanban },
    ] },
    { label: 'Doanh nghiệp', items: [
      { id: 'company-profile', label: 'Hồ sơ công ty', icon: Building2 },
      { id: 'employer-register', label: 'Xác minh doanh nghiệp', icon: ShieldCheck },
    ] },
  ],
  ADMIN: [
    { label: 'Tổng quan', items: [{ id: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard }] },
    { label: 'Kiểm duyệt', items: [
      { id: 'admin-verifications', label: 'Doanh nghiệp', icon: ShieldCheck },
      { id: 'admin-job-moderation', label: 'Tin tuyển dụng', icon: Layers },
      { id: 'admin-reports', label: 'Báo cáo vi phạm', icon: ShieldAlert },
    ] },
    { label: 'Quản trị', items: [
      { id: 'admin-user-management', label: 'Người dùng', icon: Users },
      { id: 'admin-skills', label: 'Danh mục kỹ năng', icon: Cpu },
      { id: 'admin-roadmaps', label: 'Lộ trình học tập', icon: Map },
    ] },
  ],
};
const ROLE_NAMES = { CANDIDATE: 'Không gian ứng viên', EMPLOYER: 'Không gian tuyển dụng', ADMIN: 'Không gian quản trị' };

export function Sidebar({ mobile = false }) {
  const { currentUser, logout, activePage, setActivePage, candidateProfile, currentEmployerCompany, isSidebarCollapsed, toggleSidebar, setIsMobileDrawerOpen } = useApp();
  const collapsed = !mobile && isSidebarCollapsed;
  const navRef = useRef(null);
  const [indicator, setIndicator] = useState({ top: 0, height: 42, visible: false });
  const selectedPage = activePage === 'candidate-onboarding' ? 'candidate-profile' : activePage === 'job-detail' ? 'job-search' : activePage === 'create-job' ? 'job-management' : activePage;
  useLayoutEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const update = () => {
      const selected = nav.querySelector('[aria-current="page"]');
      if (!selected) { setIndicator(previous => ({ ...previous, visible: false })); return; }
      setIndicator({ top: selected.getBoundingClientRect().top - nav.getBoundingClientRect().top, height: selected.offsetHeight, visible: true });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(nav);
    return () => observer.disconnect();
  }, [selectedPage, collapsed, currentUser?.role, mobile]);
  if (!currentUser) return null;
  const groups = MENU_GROUPS[currentUser.role] || [];
  const displayName = (currentUser.role === 'CANDIDATE' ? candidateProfile?.name : currentUser.role === 'EMPLOYER' ? currentEmployerCompany?.recruiterName : null) || currentUser.fullName || currentUser.name || currentUser.username || 'Tài khoản';
  const navigate = (page) => { setActivePage(page); if (mobile) setIsMobileDrawerOpen(false); };

  return <aside className={`workspace-sidebar ${collapsed ? 'is-collapsed' : ''} ${mobile ? 'is-mobile' : ''}`} aria-label="Menu điều hướng">
    <div className="sidebar-heading"><span className="sidebar-heading-label">{ROLE_NAMES[currentUser.role]}</span><button className="sidebar-toggle" onClick={mobile ? () => setIsMobileDrawerOpen(false) : toggleSidebar} aria-label={mobile ? 'Đóng menu' : collapsed ? 'Mở rộng menu' : 'Thu gọn menu'} aria-expanded={mobile ? undefined : !collapsed}>{mobile ? <X size={17} /> : collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}</button></div>
    <div className="sidebar-scroll"><nav className="sidebar-navigation" ref={navRef}>
      <span className="sidebar-active-indicator" aria-hidden="true" style={{ transform: `translate3d(0, ${indicator.top}px, 0)`, height: indicator.height, opacity: indicator.visible ? 1 : 0 }} />
      {groups.map(group => <div className="sidebar-group" key={group.label}><h2>{group.label}</h2>{group.items.map(({ id, label, icon: Icon }) => <button key={id} className={`sidebar-item ${selectedPage === id ? 'is-active' : ''}`} aria-current={selectedPage === id ? 'page' : undefined} onClick={() => navigate(id)} title={collapsed ? label : undefined}><Icon size={18} strokeWidth={1.65} /><span className="sidebar-item-label">{label}</span>{selectedPage === id && <span className="sidebar-item-dot" />}</button>)}</div>)}
    </nav></div>
    {currentUser.role === 'CANDIDATE' && <div className="sidebar-career-note"><span>Bước tiếp theo</span><h3>Đầu tư cho chính mình.</h3><p>Một kỹ năng mới. Một cơ hội mới.</p><button onClick={() => navigate('learning-roadmap')}>Tiếp tục học <ArrowUpRight size={14} /></button></div>}
    <div className="sidebar-account"><button className="sidebar-profile" onClick={() => navigate(currentUser.role === 'CANDIDATE' ? 'candidate-profile' : currentUser.role === 'EMPLOYER' ? 'company-profile' : 'admin-dashboard')} title={collapsed ? displayName : undefined}><span className="sidebar-avatar" style={currentUser.role === 'EMPLOYER' && currentEmployerCompany?.logo && isImageLogo(currentEmployerCompany.logo) ? { background: 'transparent' } : undefined}>{currentUser.role === 'CANDIDATE' && candidateProfile?.avatarUrl ? <img src={candidateProfile.avatarUrl} alt="" /> : currentUser.role === 'EMPLOYER' && currentEmployerCompany?.logo && isImageLogo(currentEmployerCompany.logo) ? <img src={getCompanyLogoUrl(currentEmployerCompany.logo)} alt="" className="w-full h-full object-cover" style={{ background: 'transparent' }} /> : displayName.charAt(0).toUpperCase()}</span><span className="sidebar-account-copy"><strong>{displayName}</strong><small>{currentUser.email}</small></span></button><button className="sidebar-logout" onClick={() => { if (mobile) setIsMobileDrawerOpen(false); logout(); }} title="Đăng xuất" aria-label="Đăng xuất"><LogOut size={16} /></button></div>
  </aside>;
}

