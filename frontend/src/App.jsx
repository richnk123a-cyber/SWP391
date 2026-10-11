import React, { useEffect } from 'react';
import { useApp } from './context/AppContext';
import { Navbar } from './components/common/Navbar';
import { Sidebar } from './components/common/Sidebar';
import { ToastContainer } from './components/common/ToastContainer';
import { CandidateDetailModal } from './components/common/CandidateDetailModal';

// Public & Auth Pages
import { HomePage } from './components/public/HomePage';
import { CareerFitLanding } from './components/public/designs/CareerFitLanding';
import { CareerFitHome } from './components/public/designs/CareerFitHome';
import { CareerFitJobs } from './components/public/designs/CareerFitJobs';
import { LoginPage } from './components/auth/LoginPage';
import { CandidateOnboarding } from './components/auth/CandidateOnboarding';
import { EmployerRegister } from './components/auth/EmployerRegister';
import { OAuthRegister } from './components/auth/OAuthRegister';

// Candidate Pages
import { CandidateDashboard } from './components/candidate/CandidateDashboard';
import { JobSearchPage } from './components/candidate/JobSearchPage';
import { JobDetailPage } from './components/candidate/JobDetailPage';
import { AIAnalysisModal } from './components/candidate/AIAnalysisModal';
import { LearningRoadmapPage } from './components/candidate/LearningRoadmapPage';
import { ApplicationKanban } from './components/candidate/ApplicationKanban';
import { ReportJobModal } from './components/candidate/ReportJobModal';
import { CandidateProfilePage } from './components/candidate/CandidateProfilePage';

// Employer Pages
import { EmployerDashboard } from './components/employer/EmployerDashboard';
import { CreateJobPage } from './components/employer/CreateJobPage';
import { JobManagementPage } from './components/employer/JobManagementPage';
import { ApplicantManagementPage } from './components/employer/ApplicantManagementPage';
import { RecruitmentPipeline } from './components/employer/RecruitmentPipeline';
import { CompanyProfilePage } from './components/employer/CompanyProfilePage';

// Admin Pages
import { AdminDashboard } from './components/admin/AdminDashboard';
import { EmployerVerificationPage } from './components/admin/EmployerVerificationPage';
import { JobModerationPage } from './components/admin/JobModerationPage';
import { ReportManagementApiPage } from './components/admin/ReportManagementApiPage';
import { UserManagementPage } from './components/admin/UserManagementPage';
import { SkillManagementPage } from './components/admin/SkillManagementPage';
import { RoadmapManagementPage } from './components/admin/RoadmapManagementPage';

export default function App() {
  const { currentUser, activePage, isMobileDrawerOpen, setIsMobileDrawerOpen, viewingCVModalCandidate, setViewingCVModalCandidate } = useApp();

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

  // Preview the converted React designs through the same Vite entry point.
  const design = new URLSearchParams(window.location.search).get('design');
  const DesignPreview = { landing: CareerFitLanding, home: CareerFitHome, jobs: CareerFitJobs }[design];
  if (!currentUser && activePage === 'home' && DesignPreview) {
    return <><DesignPreview /><ToastContainer /></>;
  }

  // Pages that don't need the dashboard sidebar layout
  const isPublicPage = !currentUser || ['home', 'login', 'oauth-register', 'register-entry'].includes(activePage);

  const renderCurrentView = () => {
    // Permission Guard: 403 Forbidden for non-Admin trying to access admin pages
    if (activePage.startsWith('admin-') && (!currentUser || currentUser.role !== 'ADMIN')) {
      return (
        <div className="max-w-2xl mx-auto my-12 p-8 bg-rose-50 border-2 border-rose-300 rounded-2xl text-center space-y-4 text-rose-900 shadow-lg">
          <div className="w-16 h-16 rounded-full bg-rose-200 text-rose-800 font-extrabold text-2xl flex items-center justify-center mx-auto">
            403
          </div>
          <h2 className="text-2xl font-black">403 Forbidden - Access Denied</h2>
          <p className="text-xs leading-relaxed text-rose-800 max-w-md mx-auto">
            Bạn không có quyền truy cập vào Phân hệ Quản trị viên (Admin Module). Vui lòng đăng nhập bằng tài khoản Administrator để tiếp tục.
          </p>
        </div>
      );
    }

    // Public / Unauthenticated Route Handling
    if (!currentUser) {
      switch (activePage) {
        case 'home':
          return <HomePage />;
        case 'login':
          return <LoginPage />;
        case 'oauth-register':
        case 'register-entry':
          return <OAuthRegister />;
        case 'candidate-onboarding':
          return <CandidateOnboarding />;
        case 'employer-register':
          return <EmployerRegister />;
        case 'job-search':
          return <JobSearchPage />;
        case 'job-detail':
          return <JobDetailPage />;
        default:
          return <HomePage />;
      }
    }

    // Role-based Router Guarding
    if (currentUser.role === 'CANDIDATE') {
      switch (activePage) {
        case 'candidate-dashboard':
          return <CandidateDashboard />;
        case 'job-search':
          return <JobSearchPage />;
        case 'job-detail':
          return <JobDetailPage />;
        case 'candidate-onboarding':
        case 'candidate-profile':
          return <CandidateProfilePage />;
        case 'learning-roadmap':
          return <LearningRoadmapPage />;
        case 'application-kanban':
          return <ApplicationKanban />;
        default:
          return <CandidateDashboard />;
      }
    }

    if (currentUser.role === 'EMPLOYER') {
      switch (activePage) {
        case 'employer-dashboard':
          return <EmployerDashboard />;
        case 'job-management':
          return <JobManagementPage />;
        case 'create-job':
          return <CreateJobPage />;
        case 'applicant-management':
          return <ApplicantManagementPage />;
        case 'recruitment-pipeline':
          return <RecruitmentPipeline />;
        case 'company-profile':
          return <CompanyProfilePage />;
        case 'employer-register':
          return <EmployerRegister />;
        default:
          return <EmployerDashboard />;
      }
    }

    if (currentUser.role === 'ADMIN') {
      switch (activePage) {
        case 'admin-dashboard':
          return <AdminDashboard />;
        case 'admin-verifications':
          return <EmployerVerificationPage />;
        case 'admin-job-moderation':
          return <JobModerationPage />;
        case 'admin-reports':
          return <ReportManagementApiPage />;
        case 'admin-user-management':
          return <UserManagementPage />;
        case 'admin-skills':
          return <SkillManagementPage />;
        case 'admin-roadmaps':
          return <RoadmapManagementPage />;
        default:
          return <AdminDashboard />;
      }
    }

    return <HomePage />;
  };

  return (
    <div className={`min-h-screen ${['home', 'login'].includes(activePage) && !currentUser ? 'bg-white' : 'bg-slate-50'} text-slate-800 flex flex-col font-sans antialiased`}>
      {/* Top Header Navbar */}
      <Navbar />

      {/* Main Layout Area */}
      {isPublicPage ? (
        <main className={`flex-1 w-full ${['home', 'login'].includes(activePage) ? 'bg-white p-0' : 'max-w-[1440px] mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6'}`}>
          {renderCurrentView()}
        </main>
      ) : (
        <div className="flex-1 flex w-full relative">
          {/* Desktop Sidebar (hidden on mobile, sticky on desktop scroll) */}
          <div className="hidden lg:block shrink-0 sticky top-16 h-[calc(100vh-64px)] z-30">
            <Sidebar />
          </div>

          {/* Mobile Slide-Over Drawer Overlay */}
          <div className={`workspace-mobile-menu ${isMobileDrawerOpen ? 'is-open' : ''}`} aria-hidden={!isMobileDrawerOpen} inert={!isMobileDrawerOpen}>
            <button className="workspace-mobile-backdrop" onClick={() => setIsMobileDrawerOpen(false)} aria-label="Đóng menu" tabIndex={-1} />
            <div className="workspace-mobile-panel" role="dialog" aria-modal="true" aria-label="Menu điều hướng">
              <Sidebar mobile />
            </div>
          </div>

          {/* Main Dashboard Content Offset Area - Centered Max-Width SaaS Layout */}
          <main className="workspace-content flex-1 min-w-0">
            <div className="max-w-[1440px] mx-auto w-full">
              {renderCurrentView()}
            </div>
          </main>
        </div>
      )}

      {/* Modals & Toasts */}
      <AIAnalysisModal />
      <ReportJobModal />
      <CandidateDetailModal
        isOpen={Boolean(viewingCVModalCandidate)}
        onClose={() => setViewingCVModalCandidate(null)}
        candidateData={viewingCVModalCandidate}
      />
      <ToastContainer />
    </div>
  );
}

