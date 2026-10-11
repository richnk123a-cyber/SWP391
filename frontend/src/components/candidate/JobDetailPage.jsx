import React from 'react';
import { useApp } from '../../context/AppContext';
import { MatchBadge, VerificationBadge } from '../common/Badge';
import { calculateSkillMatch } from '../../utils/matching';
import { getCompanyLogoUrl, isImageLogo } from '../../utils/logoUtils';
import {
  MapPin,
  Briefcase,
  Clock,
  ArrowLeft,
  Bookmark,
  ShieldAlert
} from 'lucide-react';

export function JobDetailPage() {
  const {
    selectedJob,
    jobs = [],
    applications = [],
    candidateProfile,
    currentUser,
    applyForJob,
    cancelApplication,
    savedJobIds = [],
    toggleSaveJob,
    setIsAIModalOpen,
    setIsReportModalOpen,
    setSelectedJobId,
    companies = [],
    setActivePage,
    showToast
  } = useApp();

  if (!selectedJob) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-slate-500 text-sm">Không tìm thấy thông tin công việc yêu cầu.</p>
        <button
          onClick={() => setActivePage('job-search')}
          className="btn btn-primary text-xs font-bold"
        >
          Quay lại danh sách việc làm
        </button>
      </div>
    );
  }

  const isSaved = savedJobIds.includes(selectedJob.id);
  const candidateSkills = candidateProfile?.skills || [];

  // Kiểm tra ứng viên đã nộp đơn vào công việc này chưa
  const hasApplied = currentUser?.role === 'CANDIDATE' && applications.some(a =>
    a.jobId === selectedJob.id &&
    (a.candidateEmail === candidateProfile?.email ||
     a.candidateId === candidateProfile?.id ||
     a.candidateId === currentUser?.id)
  );

  const safeRequiredSkills = Array.isArray(selectedJob.requiredSkills)
    ? selectedJob.requiredSkills
    : (typeof selectedJob.requiredSkills === 'string'
        ? selectedJob.requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);
  const match = calculateSkillMatch(candidateSkills, safeRequiredSkills);

  const matchedSkillsList = safeRequiredSkills.filter(sk =>
    candidateSkills.map(s => String(s || '').toLowerCase()).includes(String(sk || '').toLowerCase())
  );
  const missingSkillsList = safeRequiredSkills.filter(sk =>
    !candidateSkills.map(s => String(s || '').toLowerCase()).includes(String(sk || '').toLowerCase())
  );

  const similarJobs = jobs
    .filter(j => j.id !== selectedJob.id && (j.category === selectedJob.category || j.company === selectedJob.company))
    .slice(0, 3);

  return (
    <div className="w-full max-w-[1280px] mx-auto space-y-6 pb-12 animate-in fade-in duration-200">
      
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5 flex-wrap">
          <button onClick={() => setActivePage('home')} className="hover:text-blue-600 transition-colors cursor-pointer">Trang chủ</button>
          <span>/</span>
          <button onClick={() => setActivePage('job-search')} className="hover:text-blue-600 transition-colors cursor-pointer">Việc làm IT</button>
          <span>/</span>
          <span className="font-semibold text-slate-700">{selectedJob.company}</span>
          <span>/</span>
          <span className="text-slate-900 font-bold truncate max-w-xs">{selectedJob.title}</span>
        </div>

        <button
          onClick={() => setActivePage('job-search')}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> Quay lại danh sách
        </button>
      </nav>

      {/* 2. TOP JOB HEADER CARD */}
      <div className="bg-white border border-slate-200/80 shadow-md rounded-3xl overflow-hidden relative">
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600" />
        
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              {(() => {
                const companyLogo = selectedJob.logo || companies.find(c => (c.id && c.id === selectedJob.employerId) || (c.companyName && c.companyName === selectedJob.company))?.logo;
                const hasImgLogo = isImageLogo(companyLogo);
                return (
                  <div className={`shrink-0 mt-1 ${hasImgLogo
                    ? 'w-16 h-16 flex items-center justify-center'
                    : 'w-16 h-16 rounded-2xl bg-white text-blue-700 flex items-center justify-center font-black text-2xl shadow-md border border-slate-200 overflow-hidden'
                  }`}>
                    {hasImgLogo ? (
                      <img
                        src={getCompanyLogoUrl(companyLogo)}
                        alt={selectedJob.company}
                        className="w-full h-full object-contain"
                        style={{ background: 'transparent' }}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      style={{ display: hasImgLogo ? 'none' : 'flex' }}
                      className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-700 text-white items-center justify-center font-black text-2xl"
                    >
                      {selectedJob.company ? selectedJob.company.charAt(0) : '🏢'}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 min-w-0">
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-extrabold text-slate-800 text-sm tracking-tight">{selectedJob.company}</span>
                  <VerificationBadge status={selectedJob.verifiedStatus} />
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Thường phản hồi nhanh
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {selectedJob.title}
                </h1>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-3.5 py-1.5 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 rounded-xl text-xs font-extrabold border border-blue-200 shadow-2xs flex items-center gap-1">
                    💰 {selectedJob.salary}
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1">
                    <MapPin size={13} className="text-slate-400" /> {selectedJob.location}
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1">
                    <Briefcase size={13} className="text-slate-400" /> {selectedJob.jobType}
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1">
                    <Clock size={13} className="text-slate-400" /> Hạn nộp: {selectedJob.deadline || '30/04/2026'}
                  </span>
                </div>
              </div>
            </div>

              {/* Top Action CTAs */}
            <div className="flex items-center gap-3 shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100 flex-wrap">
              <button
                onClick={() => toggleSaveJob(selectedJob.id)}
                className={`p-3 rounded-2xl border transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold ${
                  isSaved 
                    ? 'bg-blue-50 text-blue-600 border-blue-200' 
                    : 'text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Bookmark size={18} className={isSaved ? 'fill-blue-600' : ''} />
                <span>{isSaved ? 'Đã lưu tin' : 'Lưu tin'}</span>
              </button>

              {hasApplied ? (
                <button
                  onClick={() => cancelApplication(selectedJob.id)}
                  className="px-7 py-3 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-rose-500/25 hover:shadow-xl transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>✓ Đã ứng tuyển</span>
                  <span className="text-rose-200 font-normal">— Hủy</span>
                </button>
              ) : (
                <button
                  onClick={() => applyForJob(selectedJob.id)}
                  className="px-7 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs sm:text-sm font-black shadow-lg shadow-blue-500/25 hover:shadow-xl transition-all cursor-pointer"
                >
                  Ứng tuyển ngay
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* 3. MAIN CONTENT GRID (LEFT 65% / RIGHT 35%) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COLUMN: JOB DETAILS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Job Overview & Description */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            <div className="space-y-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Mô tả công việc
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {selectedJob.description || 'Tham gia vào các dự án phần mềm quy mô lớn, xây dựng hệ thống backend và tối ưu hóa hiệu năng theo tiêu chuẩn doanh nghiệp.'}
              </p>
            </div>

            {/* Responsibilities */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Trách nhiệm công việc
              </h3>
              <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                {(Array.isArray(selectedJob.responsibilities)
                  ? selectedJob.responsibilities
                  : (typeof selectedJob.responsibilities === 'string'
                      ? selectedJob.responsibilities.split(selectedJob.responsibilities.includes(';') ? ';' : '\n')
                      : ['Lập trình các mô-đun chức năng Spring Boot RESTful Web Services', 'Viết Unit Test và tài liệu API Swagger', 'Phối hợp với nhóm Frontend và QA để hoàn thành các sprint Agile'])
                )
                  .map(r => (typeof r === 'string' ? r.trim() : String(r || '')))
                  .filter(Boolean)
                  .map((resp, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-2 shrink-0" />
                      <span>{resp}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Yêu cầu ứng viên
              </h3>
              <div className="space-y-2 text-xs sm:text-sm text-slate-600">
                {(Array.isArray(selectedJob.requirements)
                  ? selectedJob.requirements
                  : (typeof selectedJob.requirements === 'string'
                      ? selectedJob.requirements.split(selectedJob.requirements.includes(';') ? ';' : '\n')
                      : ['Nắm vững kiến thức Lập trình hướng đối tượng (OOP) và cấu trúc dữ liệu', 'Có kiến thức về Java Core, SQL Server / PostgreSQL', 'Tinh thần học hỏi cao, sẵn sàng tiếp thu công nghệ mới'])
                )
                  .map(r => (typeof r === 'string' ? r.trim() : String(r || '')))
                  .filter(Boolean)
                  .map((req, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 shrink-0" />
                      <span>{req}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Required Technologies Chips */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h3 className="text-base font-black text-slate-900 tracking-tight">
                Kỹ năng & Công nghệ yêu cầu
              </h3>
              <div className="flex flex-wrap gap-2 pt-1">
                {(Array.isArray(selectedJob.requiredSkills)
                  ? selectedJob.requiredSkills
                  : (typeof selectedJob.requiredSkills === 'string'
                      ? selectedJob.requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
                      : ['Java', 'SQL'])
                ).map(sk => {
                  const isMatch = candidateSkills.map(s => String(s || '').toLowerCase()).includes(String(sk || '').toLowerCase());
                  return (
                    <span
                      key={sk}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                        isMatch
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {isMatch ? '✓ ' : ''}{sk}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Report Job Trigger Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
              <span>Mã tin: #{selectedJob.id}</span>
              {(!currentUser || currentUser.role === 'CANDIDATE') && (
                <button
                  onClick={() => {
                    if (!currentUser) {
                      showToast('Vui lòng đăng nhập bằng tài khoản Candidate để gửi báo cáo.', 'info');
                      setActivePage('login');
                      return;
                    }
                    setIsReportModalOpen(true);
                  }}
                  className="text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <ShieldAlert size={14} /> Báo cáo tin đăng không phù hợp
                </button>
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: AI MATCH ANALYSIS & COMPANY INFO */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* AI MATCH ANALYSIS CARD */}
          <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/40 p-6 rounded-3xl border-2 border-blue-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">AI Evaluation</span>
                <h3 className="font-black text-slate-900 text-base">CareerFit AI Match</h3>
              </div>
              <MatchBadge score={match.percentage} label={match.label} badgeClass={match.badgeClass} />
            </div>

            {/* Score Progress Bar */}
            <div className="space-y-1.5 p-3.5 bg-white rounded-2xl border border-blue-100 shadow-2xs">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Độ phù hợp kỹ thuật:</span>
                <span className="font-black text-blue-600 text-sm">{match.percentage}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${match.percentage}%` }}
                />
              </div>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <span className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider">
                  Kỹ năng bạn đã đáp ứng ({matchedSkillsList.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {matchedSkillsList.length > 0 ? (
                    matchedSkillsList.map(sk => (
                      <span key={sk} className="px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200">
                        ✓ {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">Chưa có kỹ năng khớp</span>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="font-extrabold text-amber-800 text-[11px] uppercase tracking-wider">
                  Kỹ năng cần trau dồi ({missingSkillsList.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkillsList.length > 0 ? (
                    missingSkillsList.map(sk => (
                      <span key={sk} className="px-2.5 py-1 bg-amber-50 text-amber-900 rounded-lg text-xs font-semibold border border-amber-200">
                        + {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-emerald-700 font-bold">Bạn đã đáp ứng 100% kỹ năng yêu cầu!</span>
                  )}
                </div>
              </div>
            </div>

            {/* Deep AI Analysis Action */}
            <button
              onClick={() => setIsAIModalOpen && setIsAIModalOpen(true)}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Phân tích CV chuyên sâu bằng AI
            </button>
          </div>

          {/* COMPANY INFO CARD */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-black text-slate-900 text-base tracking-tight">
              Về công ty
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Tên doanh nghiệp:</span>
                <span className="font-bold text-slate-900">{selectedJob.company}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Địa điểm:</span>
                <span className="font-bold text-slate-900">{selectedJob.location}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-slate-500">Trạng thái GPKD:</span>
                <VerificationBadge status={selectedJob.verifiedStatus} />
              </div>
            </div>
          </div>

          {/* SIMILAR JOBS */}
          {similarJobs.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-black text-slate-900 text-base tracking-tight">Việc làm tương tự</h3>
              <div className="space-y-3">
                {similarJobs.map(sj => (
                  <div
                    key={sj.id}
                    onClick={() => {
                      setSelectedJobId(sj.id);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-3 bg-slate-50 hover:bg-blue-50/60 rounded-2xl border border-slate-200/80 hover:border-blue-200 cursor-pointer transition-all space-y-1"
                  >
                    <h4 className="font-extrabold text-slate-900 text-xs hover:text-blue-600 transition-colors truncate">
                      {sj.title}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{sj.company}</span>
                      <span className="font-bold text-blue-700">{sj.salary}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
