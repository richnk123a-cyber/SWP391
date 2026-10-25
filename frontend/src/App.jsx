import React, { lazy, Suspense, useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { ToastContainer } from './components/common/ToastContainer';
import { PageLoading } from './components/common/PageLoading';
import { AppBackground } from './components/common/AppBackground';
import { canAccessPage, dashboardForRole, ROUTES } from './routing/routes';

const lazyPage = (load, name) => lazy(() => load().then(module => ({ default: module[name] })));
const Sidebar = lazyPage(() => import('./components/common/Sidebar'), 'Sidebar');
const CandidateDetailModal = lazyPage(() => import('./components/common/CandidateDetailModal'), 'CandidateDetailModal');
const AIAnalysisModal = lazyPage(() => import('./components/candidate/AIAnalysisModal'), 'AIAnalysisModal');
const ReportJobModal = lazyPage(() => import('./components/candidate/ReportJobModal'), 'ReportJobModal');
const CandidateProfilePage = lazyPage(() => import('./components/candidate/CandidateProfilePage'), 'CandidateProfilePage');
const AccountSettingsPage = lazyPage(() => import('./components/common/AccountSettingsPage'), 'AccountSettingsPage');
const CareerFitChatbot = lazyPage(() => import('./components/common/CareerFitChatbot'), 'CareerFitChatbot');
const PAGES = {
  home: lazyPage(() => import('./components/public/HomePage'), 'HomePage'),
  login: lazyPage(() => import('./components/auth/LoginPage'), 'LoginPage'),
  'register-entry': lazyPage(() => import('./components/auth/OAuthRegister'), 'OAuthRegister'),
  'candidate-onboarding': lazyPage(() => import('./components/auth/CandidateOnboarding'), 'CandidateOnboarding'),
  'employer-register': lazyPage(() => import('./components/auth/EmployerRegister'), 'EmployerRegister'),
  'job-search': lazyPage(() => import('./components/candidate/JobSearchPage'), 'JobSearchPage'),
  'job-detail': lazyPage(() => import('./components/candidate/JobDetailRoute'), 'JobDetailRoute'),
  'candidate-dashboard': lazyPage(() => import('./components/candidate/CandidateDashboard'), 'CandidateDashboard'),
  'candidate-profile': CandidateProfilePage,
  'learning-roadmap': lazyPage(() => import('./components/candidate/LearningRoadmapPage'), 'LearningRoadmapPage'),
  'application-kanban': lazyPage(() => import('./components/candidate/ApplicationKanban'), 'ApplicationKanban'),
  'employer-dashboard': lazyPage(() => import('./components/employer/EmployerDashboard'), 'EmployerDashboard'),
  'job-management': lazyPage(() => import('./components/employer/JobManagementPage'), 'JobManagementPage'),
  'create-job': lazyPage(() => import('./components/employer/CreateJobPage'), 'CreateJobPage'),
  'applicant-management': lazyPage(() => import('./components/employer/ApplicantManagementPage'), 'ApplicantManagementPage'),
  'recruitment-pipeline': lazyPage(() => import('./components/employer/RecruitmentPipeline'), 'RecruitmentPipeline'),
  'company-profile': lazyPage(() => import('./components/employer/CompanyProfilePage'), 'CompanyProfilePage'),
  'admin-dashboard': lazyPage(() => import('./components/admin/AdminDashboard'), 'AdminDashboard'),
  'admin-verifications': lazyPage(() => import('./components/admin/EmployerVerificationPage'), 'EmployerVerificationPage'),
  'admin-job-moderation': lazyPage(() => import('./components/admin/JobModerationPage'), 'JobModerationPage'),
  'admin-reports': lazyPage(() => import('./components/admin/ReportManagementApiPage'), 'ReportManagementApiPage'),
  'admin-user-management': lazyPage(() => import('./components/admin/UserManagementPage'), 'UserManagementPage'),
  'admin-skills': lazyPage(() => import('./components/admin/SkillManagementPage'), 'SkillManagementPage'),
  'admin-roadmaps': lazyPage(() => import('./components/admin/RoadmapManagementPage'), 'RoadmapManagementPage'),
  'candidate-security': AccountSettingsPage,
  'employer-security': AccountSettingsPage,
  'admin-security': AccountSettingsPage,
};
const DESIGN_PREVIEWS = {
  landing: lazyPage(() => import('./components/public/designs/CareerFitLanding'), 'CareerFitLanding'),
  home: lazyPage(() => import('./components/public/designs/CareerFitHome'), 'CareerFitHome'),
  jobs: lazyPage(() => import('./components/public/designs/CareerFitJobs'), 'CareerFitJobs'),
};

export default function App() {
  const { currentUser, isAuthLoading, activePage, setActivePage, selectedJobId, isMobileDrawerOpen, setIsMobileDrawerOpen, isReportModalOpen, viewingCVModalCandidate, setViewingCVModalCandidate } = useApp();

  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const media = window.matchMedia('(min-width: 1024px)');
    const closeOnDesktop = () => { if (media.matches) setIsMobileDrawerOpen(false); };
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setIsMobileDrawerOpen(false);
      if (event.key !== 'Tab') return;
      const panel = document.querySelector('.workspace-mobile-panel');
      const controls = panel?.querySelectorAll('button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]');
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    const previousFocus = document.activeElement;
    document.body.style.overflow = 'hidden';
    document.querySelector('.workspace-mobile-panel button')?.focus();
    document.addEventListener('keydown', closeOnEscape);
    media.addEventListener('change', closeOnDesktop);
    closeOnDesktop();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      media.removeEventListener('change', closeOnDesktop);
      previousFocus?.focus();
    };
  }, [isMobileDrawerOpen, setIsMobileDrawerOpen]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (!currentUser && !ROUTES[activePage].public) {
      setActivePage('login', { replace: true });
    } else if (currentUser && ['login', 'oauth-callback'].includes(activePage)) {
      setActivePage(dashboardForRole(currentUser.role), { replace: true });
    }
  }, [activePage, currentUser, isAuthLoading, setActivePage]);

  const DesignPreview = DESIGN_PREVIEWS[new URLSearchParams(window.location.search).get('design')];
  if (!currentUser && activePage === 'home' && DesignPreview) {
    return <Suspense fallback={<PageLoading />}><DesignPreview /><ToastContainer /></Suspense>;
  }

  const isPublicPage = !currentUser || ['home', 'login', 'register-entry', 'oauth-callback', 'not-found'].includes(activePage);
  const isCandidateWorkspace = ['candidate-dashboard', 'job-search', 'job-detail', 'application-kanban', 'learning-roadmap', 'candidate-profile', 'candidate-security'].includes(activePage) && (!currentUser || currentUser.role === 'CANDIDATE');
  const isEmployerWorkspace = currentUser?.role === 'EMPLOYER' && ROUTES[activePage]?.role === 'EMPLOYER';
  const hasWorkspaceBackground = !isPublicPage || isCandidateWorkspace;
  const renderCurrentView = () => {
    if (activePage === 'oauth-callback' || (isAuthLoading && !ROUTES[activePage].public)) {
      return <PageLoading label="Đang hoàn tất xác thực..." />;
    }
    if (!canAccessPage(activePage, currentUser?.role)) {
      if (!currentUser) return <PageLoading label="Đang chuyển đến trang đăng nhập..." />;
      return <div className="max-w-2xl mx-auto my-12 p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-900"><h1 className="text-2xl font-semibold mb-4">403 — Không có quyền truy cập</h1><p>Bạn không có quyền truy cập trang này.</p><button className="mt-6 underline" onClick={() => setActivePage(dashboardForRole(currentUser.role))}>Về trang tổng quan</button></div>;
    }
    if (activePage === 'not-found') {
      return <div className="px-6 py-16 text-center"><h1 className="text-2xl font-semibold mb-4">404 — Không tìm thấy trang</h1><button className="btn btn-primary" onClick={() => setActivePage(currentUser ? dashboardForRole(currentUser.role) : 'home')}>Về trang chủ</button></div>;
    }
    if (activePage === 'login' && currentUser) return <PageLoading />;
    const Page = activePage === 'candidate-onboarding' && currentUser?.role === 'CANDIDATE'
      ? CandidateProfilePage : PAGES[activePage];
    return Page ? <Page /> : <PageLoading />;
  };

  return (
    <>
    {hasWorkspaceBackground && <AppBackground employer={isEmployerWorkspace} />}
    <div className={`${hasWorkspaceBackground ? 'landscape-workspace' : ''} min-h-screen ${!isPublicPage || isCandidateWorkspace ? 'workspace-shell' : ''} ${isCandidateWorkspace ? 'candidate-workspace-shell' : ''} ${activePage === 'candidate-dashboard' && currentUser?.role === 'CANDIDATE' ? 'candidate-studio-shell' : ''} ${isEmployerWorkspace ? 'employer-studio-shell' : ''} ${['home', 'login'].includes(activePage) && !currentUser ? 'login-shell bg-white' : 'bg-slate-50'} text-slate-800 flex flex-col font-sans antialiased`}>
      <Navbar />
      {isPublicPage ? (
        <main className={`flex-1 w-full ${['home', 'login'].includes(activePage) ? 'bg-white p-0' : 'max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6'}`}>
          <Suspense key={`${activePage}:${activePage === 'job-detail' ? selectedJobId : ''}`} fallback={<PageLoading />}>{renderCurrentView()}</Suspense>
        </main>
      ) : (
        <div className="flex-1 flex w-full relative">
          <Suspense fallback={null}>
            <div className="workspace-desktop-sidebar hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-64px)] z-30"><Sidebar /></div>
            <div className={`workspace-mobile-menu ${isMobileDrawerOpen ? 'is-open' : ''}`} aria-hidden={!isMobileDrawerOpen} inert={!isMobileDrawerOpen}>
              <button className="workspace-mobile-backdrop" onClick={() => setIsMobileDrawerOpen(false)} aria-label="Đóng menu" tabIndex={-1} />
              <div className="workspace-mobile-panel" role="dialog" aria-modal="true" aria-label="Menu điều hướng">{isMobileDrawerOpen && <Sidebar mobile />}</div>
            </div>
          </Suspense>
          <main className="workspace-content flex-1 min-w-0"><div className="max-w-[1440px] mx-auto w-full">
            <Suspense key={`${activePage}:${activePage === 'job-detail' ? selectedJobId : ''}`} fallback={<PageLoading />}>{renderCurrentView()}</Suspense>
          </div></main>
        </div>
      )}
      <Suspense fallback={null}>
        <AIAnalysisModal />
        {isReportModalOpen && <ReportJobModal />}
        {viewingCVModalCandidate && <CandidateDetailModal isOpen onClose={() => setViewingCVModalCandidate(null)} candidateData={viewingCVModalCandidate} />}
        {currentUser && ['CANDIDATE', 'EMPLOYER'].includes(currentUser.role) && <CareerFitChatbot />}
      </Suspense>
      <ToastContainer />
    </div>
    </>
  );
}
