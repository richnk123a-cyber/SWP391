import React from 'react';
import { useApp } from '../../context/AppContext';
import { MatchBadge, VerificationBadge } from '../common/Badge';
import { calculateSkillMatch, synchronizeMatchedSkills } from '../../utils/matching';
import { getCompanyLogoUrl, isImageLogo } from '../../utils/logoUtils';
import './JobDetailPage.css';
import { cvEvaluationKey } from '../../utils/cvEvaluation';
import {
  MapPin,
  Briefcase,
  Clock,
  ArrowLeft,
  Bookmark,
  ShieldAlert,
  Sparkles,
  AlertTriangle
} from 'lucide-react';

export function JobDetailPage() {
  const {
    selectedJob,
    jobs = [],
    applications = [],
    candidateProfile,
    cvEvaluations = {},
    currentUser,
    applyForJob,
    cancelApplication,
    savedJobIds = [],
    toggleSaveJob,
    setIsAIModalOpen,
    setIsReportModalOpen,
    setSelectedJobId,
    setSelectedJobOverride,
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
  const match = calculateSkillMatch(candidateSkills, safeRequiredSkills, candidateProfile?.extractedCvText);
  const evalKey = cvEvaluationKey(candidateProfile || {}, selectedJob, currentUser || {});
  let evaluation = cvEvaluations[evalKey];
  // Chỉ fallback theo ID công việc nếu đánh giá đó hợp lệ và không phải là cảnh báo văn bản phi IT cũ
  if (!evaluation && cvEvaluations[`job_${selectedJob?.id}`]) {
    const candidateFallback = cvEvaluations[`job_${selectedJob?.id}`];
    if (candidateFallback?.analysis?.isValidCv !== false && !candidateFallback?.analysis?.unrelatedDocumentWarning) {
      evaluation = candidateFallback;
    }
  }
  const aiAnalysis = evaluation?.analysis;

  const isEvaluated = Boolean(aiAnalysis);
  const isCvInvalid = Boolean(
    aiAnalysis && (aiAnalysis.isValidCv === false || aiAnalysis.unrelatedDocumentWarning)
  );

  const rawMatched = aiAnalysis?.matchedSkills || match.matchedSkills || [];
  const rawMissing = aiAnalysis?.missingSkills || match.missingSkills || [];
  const syncedSkills = synchronizeMatchedSkills(rawMatched, rawMissing, candidateProfile, selectedJob);

  const matchedSkillsList = syncedSkills.matchedSkills;
  const missingSkillsList = syncedSkills.missingSkills;

  const similarJobs = jobs
    .filter(j => j.id !== selectedJob.id && (j.category === selectedJob.category || j.company === selectedJob.company))
    .slice(0, 3);

  return (
    <div className="job-detail-page animate-in fade-in duration-200">
      
      {/* 1. BREADCRUMB NAVIGATION */}
      <nav className="job-detail-breadcrumb flex items-center justify-between text-xs text-slate-500" aria-label="Điều hướng việc làm">
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
      <div className="job-detail-card job-detail-header bg-white border overflow-hidden relative">
        
        <div className="job-detail-header-content">
          <div className="job-detail-header-layout">
            <div className="job-detail-identity flex items-start gap-4">
              {(() => {
                const companyLogo = selectedJob.logo || companies.find(c => (c.id && c.id === selectedJob.employerId) || (c.companyName && c.companyName === selectedJob.company))?.logo;
                const hasImgLogo = isImageLogo(companyLogo);
                return (
                  <div className={`job-detail-logo shrink-0 mt-1 ${hasImgLogo
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
                      className="job-detail-monogram w-full h-full items-center justify-center text-2xl"
                    >
                      {selectedJob.company ? selectedJob.company.charAt(0) : '🏢'}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-2 min-w-0">
                <div className="job-detail-company-line flex items-center gap-2 flex-wrap text-xs">
                  <span className="font-extrabold text-slate-800 text-sm tracking-tight">{selectedJob.company}</span>
                  <span className="job-detail-verification"><VerificationBadge status={selectedJob.verifiedStatus} /></span>
                  <span className="job-detail-response inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full border">
                    <span className="job-detail-response-dot w-1.5 h-1.5 rounded-full"></span>
                    Thường phản hồi nhanh
                  </span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {selectedJob.title}
                </h1>

                <div className="job-detail-facts flex flex-wrap items-center gap-2 pt-1">
                  <span className="job-detail-salary px-3.5 py-1.5 rounded-xl text-xs border flex items-center gap-1">
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
            <div className="job-detail-actions">
              <button
                onClick={() => toggleSaveJob(selectedJob.id)}
                aria-pressed={isSaved}
                className={`job-detail-save p-3 border transition-colors cursor-pointer flex items-center gap-1.5 text-xs ${isSaved ? 'is-saved' : ''}`}
              >
                <Bookmark size={18} className={isSaved ? 'fill-current' : ''} />
                <span>{isSaved ? 'Đã lưu tin' : 'Lưu tin'}</span>
              </button>

              {hasApplied ? (
                <button
                  onClick={() => cancelApplication(selectedJob.id)}
                  className="job-detail-primary px-7 py-3 text-xs sm:text-sm transition-colors cursor-pointer flex items-center gap-2"
                >
                  <span>✓ Đã ứng tuyển</span>
                  <span className="job-detail-cancel font-normal">— Hủy</span>
                </button>
              ) : (
                <button
                  onClick={() => applyForJob(selectedJob.id)}
                  className="job-detail-primary px-7 py-3 text-xs sm:text-sm transition-colors cursor-pointer"
                >
                  Ứng tuyển ngay
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Description and company insights share one balanced row. */}
      <div className="job-detail-main">
        
        {/* LEFT COLUMN: JOB DETAILS */}
        <div className="job-detail-main-column">
          
          {/* Job Overview & Description */}
          <div className="job-detail-card job-detail-description border">
            <div className="job-detail-section space-y-3">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">
                Mô tả công việc
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {selectedJob.description || 'Tham gia vào các dự án phần mềm quy mô lớn, xây dựng hệ thống backend và tối ưu hóa hiệu năng theo tiêu chuẩn doanh nghiệp.'}
              </p>
            </div>

            {/* Responsibilities */}
            <div className="job-detail-section space-y-3 border-t border-slate-100">
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
            <div className="job-detail-section space-y-3 border-t border-slate-100">
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
            <div className="job-detail-section space-y-3 border-t border-slate-100">
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
                  const isMatch = matchedSkillsList.some(ms => ms.toLowerCase() === String(sk || '').toLowerCase());
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
            <div className="job-detail-footer border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
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
        <aside className="job-detail-aside" aria-label="Độ phù hợp và thông tin công ty">
          
          {/* AI MATCH ANALYSIS CARD */}
          <div className="job-detail-card job-detail-ai p-6 border space-y-5">
            <div className="job-detail-ai-heading flex items-center justify-between">
              <div>
                <span className="job-detail-eyebrow text-[10px] uppercase tracking-wider">AI Evaluation</span>
                <h3 className="font-black text-slate-900 text-base">CareerFit AI Match</h3>
              </div>
              {isCvInvalid ? (
                <span className="px-2.5 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-lg border border-rose-300 flex items-center gap-1 shadow-sm">
                  <ShieldAlert size={13} className="text-rose-600 shrink-0" />
                  CV có vấn đề
                </span>
              ) : isEvaluated ? (
                <MatchBadge score={aiAnalysis?.overallMatch ?? 0} label="AI Match" />
              ) : (
                <span className="text-xs text-slate-400">Chưa đánh giá</span>
              )}
            </div>

            {/* Score Progress Bar */}
            <div className={`job-detail-score space-y-1.5 p-3.5 bg-white border ${isCvInvalid ? 'border-rose-200 bg-rose-50/20' : ''}`}>
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700">Độ phù hợp theo CV:</span>
                {isCvInvalid ? (
                  <span className="font-black text-rose-600 text-xs sm:text-sm flex items-center gap-1">
                    0% <span className="font-semibold text-[10px] text-rose-500">(Không hợp lệ)</span>
                  </span>
                ) : isEvaluated ? (
                  <span className="font-black text-blue-600 text-sm">{aiAnalysis?.overallMatch ?? 0}%</span>
                ) : (
                  <span className="font-black text-slate-400 text-sm">—</span>
                )}
              </div>
              <div className="job-detail-progress w-full rounded-full h-2.5 overflow-hidden bg-slate-100">
                <div
                  className={`h-2.5 rounded-full transition-all duration-500 ${isCvInvalid ? 'bg-rose-500' : 'job-detail-progress-fill'}`}
                  style={{ width: `${isCvInvalid ? 0 : (aiAnalysis?.overallMatch || 0)}%` }}
                />
              </div>
            </div>

            {isCvInvalid ? (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
                <p className="text-xs font-bold flex items-center gap-1.5 text-rose-900">
                  <AlertTriangle size={14} className="text-rose-600 shrink-0" />
                  Tài liệu: {aiAnalysis.documentType || 'Biên bản cuộc họp / Phi IT'}
                </p>
                <p className="text-[11px] text-rose-700 leading-relaxed font-medium">
                  {aiAnalysis.unrelatedDocumentWarning || 'Tệp tải lên không phải là CV cá nhân ngành CNTT nên hệ thống từ chối tính điểm (0%). Bấm nút bên dưới để xem chi tiết.'}
                </p>
              </div>
            ) : isEvaluated ? (
              <p className="text-xs text-slate-500">
                Đã đánh giá bằng {evaluation?.modelName || 'CareerFit AI'}.
              </p>
            ) : (
              <p className="text-xs text-slate-500">
                Bấm phân tích để AI đọc CV và thiết kế lộ trình. Danh sách bên dưới chỉ đối chiếu từ khóa sơ bộ.
              </p>
            )}

            {/* Matched vs Missing Skills */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1.5">
                <span className="font-extrabold text-emerald-800 text-[11px] uppercase tracking-wider">
                  {aiAnalysis ? 'Kỹ năng bạn đã đáp ứng' : 'Kỹ năng trùng từ khóa'} ({matchedSkillsList.length})
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
                  {aiAnalysis ? 'Kỹ năng cần trau dồi' : 'Kỹ năng chưa thấy trong hồ sơ'} ({missingSkillsList.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {missingSkillsList.length > 0 ? (
                    missingSkillsList.map(sk => (
                      <span key={sk} className="px-2.5 py-1 bg-amber-50 text-amber-900 rounded-lg text-xs font-semibold border border-amber-200">
                        + {sk}
                      </span>
                    ))
                  ) : (
                    <span className="text-emerald-700 font-bold">{aiAnalysis ? 'AI chưa xác định kỹ năng cần bổ sung.' : 'Đã thấy các từ khóa kỹ năng yêu cầu.'}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Deep AI Analysis Action */}
            <button
              onClick={() => {
                if (setSelectedJobOverride && selectedJob) {
                  setSelectedJobOverride(selectedJob);
                }
                if (setSelectedJobId && selectedJob?.id) {
                  setSelectedJobId(selectedJob.id);
                }
                if (setIsAIModalOpen) {
                  setIsAIModalOpen(true);
                }
              }}
              className={`w-full py-3 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 ${
                isCvInvalid
                  ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 text-white shadow-rose-500/20'
                  : isEvaluated
                  ? 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-blue-500/20'
                  : 'job-detail-primary'
              }`}
            >
              {isCvInvalid ? (
                <>
                  <ShieldAlert size={14} />
                  Xem cảnh báo CV & Phân tích chi tiết
                </>
              ) : isEvaluated ? (
                <>
                  <Sparkles size={14} />
                  Xem lại kết quả phân tích AI ({aiAnalysis?.overallMatch ?? 0}%)
                </>
              ) : (
                'Phân tích CV chuyên sâu bằng AI'
              )}
            </button>
          </div>

          {/* COMPANY INFO CARD */}
          <div className="job-detail-card job-detail-company bg-white p-6 border space-y-4">
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
                <span className="job-detail-verification"><VerificationBadge status={selectedJob.verifiedStatus} /></span>
              </div>
            </div>
          </div>

        </aside>
      </div>

      {similarJobs.length > 0 && (
        <section className="job-detail-related" aria-labelledby="job-detail-related-title">
          <h3 id="job-detail-related-title">Việc làm tương tự</h3>
          <div className="job-detail-related-grid">
            {similarJobs.map(sj => (
              <button
                type="button"
                key={sj.id}
                onClick={() => {
                  setSelectedJobId(sj.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="job-detail-similar border cursor-pointer transition-colors"
              >
                <span className="job-detail-similar-company">{sj.company}</span>
                <span className="job-detail-similar-title">{sj.title}</span>
                <span className="job-detail-similar-salary">{sj.salary}</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
