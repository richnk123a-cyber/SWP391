import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/Badge';
import {
  Briefcase,
  Users,
  Calendar,
  Layers,
  PlusCircle,
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  Eye,
  Search,
  Check,
  Award,
  Video,
  ExternalLink
} from 'lucide-react';

export function EmployerDashboard() {
  const { employerProfile, jobs, applications, setActivePage, setViewingCVModalCandidate } = useApp();

  const isVerified = employerProfile.verificationStatus === 'Verified';

  // Employer's jobs list
  const employerJobs = useMemo(() => {
    if (!employerProfile) return [];
    return jobs.filter(j => 
      (employerProfile.id && j.employerId === employerProfile.id) || 
      (employerProfile.companyName && j.company === employerProfile.companyName)
    );
  }, [jobs, employerProfile]);

  // Employer's job IDs
  const employerJobIds = useMemo(() => employerJobs.map(j => j.id), [employerJobs]);

  // Employer's applications list
  const employerApplications = useMemo(() => {
    return applications.filter(app => employerJobIds.includes(app.jobId));
  }, [applications, employerJobIds]);

  // DERIVED METRICS FROM REAL DATABASE STATE
  const activeJobsCount = useMemo(() => {
    return employerJobs.filter(j => (j.moderationStatus === 'APPROVED' || (!j.moderationStatus && j.verifiedStatus === 'Verified')) && j.publishStatus !== 'CLOSED').length;
  }, [employerJobs]);

  const totalAppsCount = employerApplications.length;

  const upcomingInterviewsCount = useMemo(() => {
    return employerApplications.filter(a => a.status === 'Phỏng vấn').length;
  }, [employerApplications]);

  const filledPositionsCount = useMemo(() => {
    return employerApplications.filter(a => a.status === 'Offer').length;
  }, [employerApplications]);

  // Recent 4 Applicants
  const recentApplicants = useMemo(() => {
    return [...employerApplications].slice(0, 4);
  }, [employerApplications]);

  // Active Jobs List
  const activeJobs = useMemo(() => {
    return employerJobs.filter(j => j.publishStatus !== 'CLOSED');
  }, [employerJobs]);

  return (
    <div className="employer-workspace employer-employerdashboard space-y-6 mx-auto">
      {/* 1. TOP WELCOME & COMPANY SUMMARY CARD */}
      <div className="employer-dashboard-welcome bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-black text-xl flex items-center justify-center shrink-0">
            <Building2 size={28} strokeWidth={1.6} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <p className="employer-welcome-eyebrow">KHÔNG GIAN TUYỂN DỤNG</p><h1 className="text-2xl font-extrabold text-slate-900">{employerProfile.companyName}</h1>
              <VerificationBadge status={employerProfile.verificationStatus} />
            </div>
            <p className="text-xs font-semibold text-slate-600 mt-1">
              HR Recruiter: <strong>{employerProfile.recruiterName}</strong> ({employerProfile.email}) • {employerProfile.industry} • {employerProfile.location}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActivePage('create-job')}
            disabled={!isVerified}
            className="btn btn-primary shadow-xs text-xs font-bold py-2.5 px-4 flex items-center gap-2"
          >
            <PlusCircle size={16} /> + Đăng tin tuyển dụng mới
          </button>
        </div>
      </div>

      {/* 2. UNVERIFIED WARNING BANNER IF PENDING / REJECTED */}
      {!isVerified && (
        <div className="card bg-amber-50/90 border-2 border-amber-300 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <AlertTriangle className="text-amber-600 shrink-0 mt-0.5 sm:mt-0" size={24} />
            <div>
              <h4 className="font-bold text-amber-950 text-sm">Tài khoản Doanh nghiệp Chưa Xác Minh (Pending Verification)</h4>
              <p className="text-xs text-amber-900 mt-0.5">
                Chức năng Đăng tin tuyển dụng công khai hiện đang được tạm khóa. Ban Quản trị sẽ xem xét Giấy phép kinh doanh để cấp quyền tuyển dụng.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActivePage('employer-register')}
            className="btn btn-secondary text-xs border-amber-400 text-amber-950 bg-white hover:bg-amber-100 font-bold shrink-0"
          >
            Cập nhật Giấy phép kinh doanh
          </button>
        </div>
      )}

      {/* 3. DYNAMIC 4 METRIC CARDS DERIVED FROM DATABASE */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 space-y-2 border-l-4 border-l-blue-600 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">TIN ĐANG HOẠT ĐỘNG</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Briefcase size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{activeJobsCount}</p>
        </div>

        <div className="card p-4 space-y-2 border-l-4 border-l-indigo-600 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">TỔNG HỒ SƠ ỨNG TUYỂN</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <Users size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{totalAppsCount}</p>
        </div>

        <div className="card p-4 space-y-2 border-l-4 border-l-amber-500 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">LỊCH PHỎNG VẤN SẮP TỚI</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Calendar size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{upcomingInterviewsCount}</p>
        </div>

        <div className="card p-4 space-y-2 border-l-4 border-l-emerald-600 bg-white rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">VỊ TRÍ ĐÃ TUYỂN THÀNH CÔNG</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Award size={16} />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">{filledPositionsCount}</p>
        </div>
      </div>

      {/* 4. MAIN DASHBOARD GRID: LEFT 70% + RIGHT 30% */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT 70%: ACTIVE JOBS TABLE */}
        <div className="lg:col-span-8 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Briefcase className="text-blue-600" size={18} /> Tin tuyển dụng đang hoạt động
              </h3>
              <p className="text-[11px] text-slate-500">Danh sách các vị trí đang mở tiếp nhận ứng viên nộp CV</p>
            </div>
            <button
              onClick={() => setActivePage('job-management')}
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              Quản lý tất cả tin <ChevronRight size={14} />
            </button>
          </div>

          {activeJobs.length === 0 ? (
            /* SECTION 22: EMPTY STATE */
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 space-y-3">
              <Briefcase size={36} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-800 text-sm">Bạn chưa có tin tuyển dụng nào đang mở.</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Tạo bài đăng tuyển dụng mới để tiếp cận hàng nghìn ứng viên IT tài năng trên CareerFit.
              </p>
              <button
                onClick={() => setActivePage('create-job')}
                disabled={!isVerified}
                className="btn btn-primary text-xs font-bold py-2 px-4 inline-flex items-center gap-1.5"
              >
                + Tạo tin tuyển dụng đầu tiên
              </button>
            </div>
          ) : (
            <div className="employer-dashboard-jobs">
  {activeJobs.map(job => {
    const appsCount = applications.filter(a => a.jobId === job.id).length;
    const isApproved = job.moderationStatus === 'APPROVED' || (!job.moderationStatus && job.verifiedStatus === 'Verified');
    return <article key={job.id} className="employer-job-summary">
      <div className="employer-job-summary-top"><span className="employer-job-icon"><Briefcase size={20} /></span><div><h3>{job.title}</h3><p>{job.category} <span>·</span> {job.jobType}</p></div><span className="employer-job-status">{isApproved ? 'Đã duyệt' : 'Chờ kiểm duyệt'}</span></div>
      <div className="employer-job-summary-bottom"><strong>{job.salary}</strong><span className="employer-applicant-count"><Users size={15} />{appsCount} hồ sơ</span><button onClick={() => setActivePage('applicant-management')} className="btn btn-secondary btn-sm"><Users size={15} />Ứng viên<ChevronRight size={14} /></button></div>
    </article>;
  })}
</div>
          )}
        </div>

        {/* RIGHT 30%: RECENT APPLICANTS + UPCOMING INTERVIEWS */}
        <div className="lg:col-span-4 space-y-6">
          {/* RECENT APPLICANTS CARD */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="text-indigo-600" size={18} /> Ứng viên mới nhất
              </h3>
              <button
                onClick={() => setActivePage('applicant-management')}
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                Xem tất cả
              </button>
            </div>

            {recentApplicants.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Chưa có ứng viên nộp hồ sơ.
              </div>
            ) : (
              <div className="space-y-3">
                {recentApplicants.map(app => {
                  const job = jobs.find(j => j.id === app.jobId) || { title: 'Tin tuyển dụng', requiredSkills: [] };

                  return (
                    <div
                      key={app.id}
                      onClick={() => setViewingCVModalCandidate(app)}
                      className="p-3 bg-slate-50 hover:bg-blue-50/50 rounded-xl border border-slate-200 cursor-pointer transition-colors space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 text-xs">{app.candidateName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          app.status === 'Offer'
                            ? 'bg-emerald-100 text-emerald-800'
                            : app.status === 'Phỏng vấn'
                            ? 'bg-indigo-100 text-indigo-800'
                            : app.status === 'Từ chối'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {app.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 truncate">{job.title}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>{app.candidateUniversity || app.candidateEmail}</span>
                        <span>{app.appliedDate}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* UPCOMING INTERVIEWS WIDGET */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-200 shadow-xs space-y-3">
            <h3 className="font-bold text-amber-950 text-sm flex items-center gap-2">
              <Calendar className="text-amber-600" size={18} /> Lịch phỏng vấn đã lên
            </h3>

            {employerApplications.filter(a => a.status === 'Phỏng vấn').length === 0 ? (
              <p className="text-xs text-amber-800">Chưa có lịch phỏng vấn nào được xếp trong tuần này.</p>
            ) : (
              <div className="space-y-2">
                {employerApplications.filter(a => a.status === 'Phỏng vấn').map(app => (
                  <div key={app.id} className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <strong className="text-slate-900">{app.candidateName}</strong>
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                        {app.interviewDetails?.time || '14:00'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">{app.interviewDetails?.date || 'Thứ 5, 27/03/2026'}</p>
                    {app.interviewDetails?.meetingLink && (
                      <a
                        href={app.interviewDetails.meetingLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline pt-0.5"
                      >
                        <Video size={12} /> Google Meet Link
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


