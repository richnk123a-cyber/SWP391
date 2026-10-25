import React, { lazy, Suspense, useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { TechnologyBackdrop } from '../common/TechnologyBackdrop';
import { getCompanyLogoUrl, isImageLogo } from '../../utils/logoUtils';
import './EmployerDashboard.css';

const JobApplicantsModal = lazy(() => import('./JobApplicantsModal').then(module => ({ default: module.JobApplicantsModal })));
const formatCount = value => String(value).padStart(2, '0');
const EMPTY_PROFILE = {};
const EMPTY_ITEMS = [];
function meetingUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}

export function EmployerDashboard() {
  const { currentUser, employerProfile, companies = EMPTY_ITEMS, jobs = EMPTY_ITEMS, applications = EMPTY_ITEMS, setActivePage, setViewingCVModalCandidate } = useApp();
  const [viewingApplicantsJob, setViewingApplicantsJob] = useState(null);
  const profile = useMemo(() => employerProfile || EMPTY_PROFILE, [employerProfile]);
  const isVerified = profile.verificationStatus === 'Verified';
  const companyName = profile.companyName || 'Doanh nghiệp';
  const employerJobs = useMemo(() => {
    const validIds = new Set([currentUser?.id, profile.ownerUserId, profile.id].filter(Boolean));
    const validNames = new Set([profile.companyName, currentUser?.username, currentUser?.fullName].filter(Boolean).map(name => name.toLowerCase().trim()));
    companies.forEach(company => {
      if ((currentUser?.id && company.ownerUserId === currentUser.id) || (currentUser?.email && company.email?.toLowerCase() === currentUser.email.toLowerCase())) {
        if (company.id) validIds.add(company.id);
        if (company.ownerUserId) validIds.add(company.ownerUserId);
        if (company.companyName) validNames.add(company.companyName.toLowerCase().trim());
      }
    });
    return jobs.filter(job => (job.employerId && validIds.has(job.employerId)) || (job.company && validNames.has(job.company.toLowerCase().trim())));
  }, [jobs, profile, currentUser, companies]);
  const employerJobIds = useMemo(() => new Set(employerJobs.map(job => job.id)), [employerJobs]);
  const employerApplications = useMemo(() => applications.filter(application => employerJobIds.has(application.jobId)), [applications, employerJobIds]);
  const activeJobs = useMemo(() => employerJobs.filter(job => job.publishStatus !== 'CLOSED'), [employerJobs]);
  const approvedCount = activeJobs.filter(job => job.moderationStatus === 'APPROVED' || (!job.moderationStatus && job.verifiedStatus === 'Verified')).length;
  const interviews = employerApplications.filter(application => application.status === 'Phỏng vấn');
  const recentApplicants = employerApplications.slice(0, 4);
  const metrics = [
    { label: 'Tin đang hoạt động', value: approvedCount, note: 'Vị trí đang tiếp nhận hồ sơ', page: 'job-management' },
    { label: 'Tổng hồ sơ ứng tuyển', value: employerApplications.length, note: 'Ứng viên kết nối với doanh nghiệp', page: 'applicant-management' },
    { label: 'Lịch phỏng vấn sắp tới', value: interviews.length, note: 'Cuộc hẹn đang được theo dõi', page: 'recruitment-pipeline' },
    { label: 'Vị trí đã tuyển thành công', value: employerApplications.filter(application => application.status === 'Offer').length, note: 'Hồ sơ đã nhận offer', page: 'recruitment-pipeline' },
  ];

  return <div className="hiring-studio">
    <section className="hiring-hero" aria-labelledby="hiring-company-heading">
      <div className="hiring-hero-copy">
        <p className="hiring-eyebrow">KHÔNG GIAN TUYỂN DỤNG</p>
        <div className="hiring-company-heading">
          {isImageLogo(profile.logo) && <button type="button" className="hiring-company-logo" onClick={() => setActivePage('company-profile')} aria-label="Cập nhật logo công ty"><img src={getCompanyLogoUrl(profile.logo)} alt={companyName} onError={event => { event.currentTarget.parentElement.hidden = true; }} /></button>}
          <h1 id="hiring-company-heading">{companyName}</h1>
        </div>
        <span className={`hiring-verification ${isVerified ? 'is-verified' : ''}`}>{isVerified ? 'Đã xác minh' : profile.verificationStatus === 'Rejected' ? 'Chưa được xác minh' : 'Chờ xác minh'}</span>
        <p className="hiring-recruiter">HR Recruiter: <strong>{profile.recruiterName || currentUser?.fullName || currentUser?.username || 'Nhà tuyển dụng'}</strong>{profile.email && <span>{profile.email}</span>}</p>
        {(profile.industry || profile.location) && <p className="hiring-company-meta">{[profile.industry, profile.location].filter(Boolean).join(' · ')}</p>}
        <div className="hiring-hero-actions"><button type="button" className="hiring-button hiring-button--light" disabled={!isVerified} onClick={() => setActivePage('create-job')}>Đăng tin tuyển dụng mới</button><button type="button" className="hiring-button hiring-button--outline" onClick={() => setActivePage('company-profile')}>Hồ sơ công ty</button></div>
      </div>
      <div className="hiring-hero-art"><TechnologyBackdrop /><p className="hiring-hero-message">Đội ngũ tốt,<br />bắt đầu từ<br /><span>cơ hội đúng.</span></p><span className="hiring-hero-caption">Kết nối năng lực. Xây dựng đội ngũ.</span></div>
    </section>

    {!isVerified && <section className="hiring-verification-notice" aria-label="Xác minh doanh nghiệp"><div><h2>Tài khoản Doanh nghiệp Chưa Xác Minh (Pending Verification)</h2><p>Chức năng Đăng tin tuyển dụng công khai hiện đang được tạm khóa. Ban Quản trị sẽ xem xét Giấy phép kinh doanh để cấp quyền tuyển dụng.</p></div><button type="button" className="hiring-button hiring-button--secondary" onClick={() => setActivePage('employer-register')}>Cập nhật Giấy phép kinh doanh</button></section>}
    <section className="hiring-metrics" aria-label="Thống kê tuyển dụng">{metrics.map(metric => <button type="button" className="hiring-metric" key={metric.label} onClick={() => setActivePage(metric.page)}><span className="hiring-metric-label">{metric.label}</span><strong>{formatCount(metric.value)}</strong><span className="hiring-metric-note">{metric.note}</span></button>)}</section>

    <div className="hiring-columns">
      <section className="hiring-panel hiring-jobs" aria-labelledby="hiring-jobs-heading">
        <div className="hiring-panel-heading"><div><span className="hiring-kicker">CƠ HỘI ĐANG MỞ</span><h2 id="hiring-jobs-heading">Tin tuyển dụng đang hoạt động</h2><p>Danh sách các vị trí đang mở tiếp nhận ứng viên nộp CV</p></div><button type="button" className="hiring-text-link" onClick={() => setActivePage('job-management')}>Quản lý tất cả tin</button></div>
        {!activeJobs.length ? <div className="hiring-empty"><span className="hiring-empty-index" aria-hidden="true">01 / BẮT ĐẦU</span><h3>Bạn chưa có tin tuyển dụng nào đang mở.</h3><p>Tạo bài đăng tuyển dụng mới để tiếp cận hàng nghìn ứng viên IT tài năng trên CareerFit.</p><button type="button" className="hiring-button hiring-button--primary" disabled={!isVerified} onClick={() => setActivePage('create-job')}>Tạo tin tuyển dụng đầu tiên</button></div> : <div className="hiring-job-list">{activeJobs.map(job => {
          const approved = job.moderationStatus === 'APPROVED' || (!job.moderationStatus && job.verifiedStatus === 'Verified');
          const rejected = job.moderationStatus === 'REJECTED';
          const count = employerApplications.filter(application => application.jobId === job.id).length;
          return <article className="hiring-job" key={job.id}><div className="hiring-job-top"><div><h3>{job.title}</h3><p>{[job.category, job.jobType].filter(Boolean).join(' · ')}</p></div><button type="button" className="hiring-job-status" data-status={approved ? 'approved' : rejected ? 'rejected' : 'pending'} onClick={() => setActivePage('job-management')} title={rejected && job.rejectionReason ? `Lý do: ${job.rejectionReason}` : undefined}>{approved ? 'Đã duyệt' : rejected ? 'Bị từ chối' : 'Chờ kiểm duyệt'}</button></div>{rejected && job.rejectionReason && <button type="button" className="hiring-rejection" onClick={() => setActivePage('job-management')}>Lý do: {job.rejectionReason}</button>}<div className="hiring-job-bottom"><span>{job.salary}</span><button type="button" className="hiring-applicant-count" onClick={() => setViewingApplicantsJob(job)}>{count} hồ sơ</button><button type="button" className="hiring-button hiring-button--secondary" onClick={() => setViewingApplicantsJob(job)}>Ứng viên</button></div></article>;
        })}</div>}
      </section>
      <aside className="hiring-rail">
        <section className="hiring-panel" aria-labelledby="hiring-applicants-heading"><div className="hiring-panel-heading"><div><span className="hiring-kicker">KẾT NỐI MỚI</span><h2 id="hiring-applicants-heading">Ứng viên mới nhất</h2></div><button type="button" className="hiring-text-link" onClick={() => setActivePage('applicant-management')}>Xem tất cả</button></div>{!recentApplicants.length ? <p className="hiring-rail-empty">Chưa có ứng viên nộp hồ sơ.</p> : <div className="hiring-applicant-list">{recentApplicants.map(application => <button type="button" className="hiring-applicant" key={application.id} onClick={() => setViewingCVModalCandidate(application)}><span className="hiring-applicant-top"><strong>{application.candidateName || 'Ứng viên'}</strong><span className="hiring-application-status" data-status={application.status}>{application.status}</span></span><span className="hiring-applicant-role">{jobs.find(job => job.id === application.jobId)?.title || 'Tin tuyển dụng'}</span><span className="hiring-applicant-meta"><span>{application.candidateUniversity || application.candidateEmail}</span><time>{application.appliedDate}</time></span></button>)}</div>}</section>
        <section className="hiring-interviews" aria-labelledby="hiring-interviews-heading"><span className="hiring-kicker">BƯỚC TIẾP THEO</span><h2 id="hiring-interviews-heading">Lịch phỏng vấn đã lên</h2>{!interviews.length ? <p className="hiring-rail-empty">Chưa có lịch phỏng vấn nào được xếp trong tuần này.</p> : <div className="hiring-interview-list">{interviews.map(application => <article className="hiring-interview" key={application.id}><div><strong>{application.candidateName || 'Ứng viên'}</strong><span>{application.interviewDetails?.time || 'Chờ xác nhận giờ'}</span></div><p>{application.interviewDetails?.date || application.interviewDate || 'Chờ xác nhận ngày'}</p>{meetingUrl(application.interviewDetails?.meetingLink) && <a href={meetingUrl(application.interviewDetails.meetingLink)} target="_blank" rel="noreferrer">Google Meet Link</a>}</article>)}</div>}</section>
      </aside>
    </div>
    {viewingApplicantsJob && <Suspense fallback={null}><JobApplicantsModal job={viewingApplicantsJob} isOpen onClose={() => setViewingApplicantsJob(null)} /></Suspense>}
  </div>;
}
