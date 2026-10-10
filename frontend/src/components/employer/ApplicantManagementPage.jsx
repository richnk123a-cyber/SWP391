import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MatchBadge } from '../common/Badge';
import { calculateSkillMatch } from '../../utils/matching';
import { Modal } from '../common/Modal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { SegmentedControl } from '../common/SegmentedControl';
import {
  Users,
  Eye,
  FileText,
  Calendar,
  CheckCircle2,
  Search,
  Filter,
  RotateCcw,
  X,
  ShieldAlert,
  Sparkles,
  MapPin,
  GraduationCap,
  Briefcase,
  Check,
  AlertTriangle,
  Send,
  XCircle,
  Award,
  ChevronRight,
  UserCheck
} from 'lucide-react';

export function ApplicantManagementPage() {
  const {
    applications,
    jobs,
    employerProfile,
    candidateProfile,
    updateApplicationStatus,
    setViewingCVModalCandidate,
    viewingCVModalCandidate,
    showToast
  } = useApp();

  const employerJobIds = useMemo(() => {
    if (!employerProfile) return [];
    return jobs
      .filter(j => (employerProfile.id && j.employerId === employerProfile.id) || (employerProfile.companyName && j.company === employerProfile.companyName))
      .map(j => j.id);
  }, [jobs, employerProfile]);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobFilter, setSelectedJobFilter] = useState('All');
  const [statusTab, setStatusTab] = useState('All');
  const [selectedSkill, setSelectedSkill] = useState('All');
  const [minMatchScore, setMinMatchScore] = useState(0);

  // Candidate Side Drawer State
  const [drawerApplicant, setDrawerApplicant] = useState(null);

  // Interview Modal State
  const [activeInterviewAppId, setActiveInterviewAppId] = useState(null);

  // Filtered Applications
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      // Must belong to current employer's job postings
      if (!employerJobIds.includes(app.jobId)) return false;

      // Job filter
      if (selectedJobFilter !== 'All' && app.jobId !== selectedJobFilter) return false;

      // Status tab
      if (statusTab !== 'All' && app.status !== statusTab) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = app.candidateName.toLowerCase().includes(q);
        const matchesEmail = (app.candidateEmail || '').toLowerCase().includes(q);
        const matchesUni = (app.candidateUniversity || '').toLowerCase().includes(q);
        const job = jobs.find(j => j.id === app.jobId);
        const matchesJobTitle = job ? job.title.toLowerCase().includes(q) : false;
        if (!matchesName && !matchesEmail && !matchesUni && !matchesJobTitle) return false;
      }

      // Skill Filter
      if (selectedSkill !== 'All') {
        const skills = app.candidateSkills || candidateProfile.skills;
        const hasSkill = skills.some(s => s.toLowerCase() === selectedSkill.toLowerCase());
        if (!hasSkill) return false;
      }

      // Match Score Threshold
      if (minMatchScore > 0) {
        const job = jobs.find(j => j.id === app.jobId) || { title: 'Tin tuyển dụng', requiredSkills: [] };
        const match = calculateSkillMatch(app.candidateSkills || (candidateProfile ? candidateProfile.skills : []), job.requiredSkills || []);

        if (match.percentage < minMatchScore) return false;
      }

      return true;
    });
  }, [applications, selectedJobFilter, statusTab, searchQuery, selectedSkill, minMatchScore, jobs, candidateProfile.skills]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedJobFilter('All');
    setStatusTab('All');
    setSelectedSkill('All');
    setMinMatchScore(0);
  };

  const hasFilters = Boolean(searchQuery || selectedJobFilter !== 'All' || statusTab !== 'All' || selectedSkill !== 'All' || minMatchScore > 0);

  return (
    <div className="employer-workspace employer-applicantmanagementpage space-y-6 mx-auto">
      {/* 1. HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Users size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Quản lý Hồ sơ & Sàng lọc Ứng viên</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi, so khớp Match Score, mở CV và lên lịch phỏng vấn với các ứng viên IT.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Tổng số ứng viên: <strong className="text-blue-600 font-bold">{filteredApps.length}</strong>
          </span>
        </div>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        {/* Top Search & Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          <div className="md:col-span-6 relative">
            <div className="search-input-wrapper">
              <Search className="search-input-icon text-slate-400" size={18} />
              <input
                type="text"
                className="form-control search-input-control text-xs font-medium bg-slate-50 border-slate-200 focus:bg-white h-10"
                placeholder="Tìm ứng viên theo tên, email, trường hoặc vị trí nộp..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <div className="md:col-span-3">
            <select
              className="form-control text-xs bg-slate-50 border-slate-200 font-medium h-10"
              value={selectedJobFilter}
              onChange={(e) => setSelectedJobFilter(e.target.value)}
            >
              <option value="All">Tất cả bài đăng ({jobs.length})</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-3">
            <select
              className="form-control text-xs bg-slate-50 border-slate-200 font-medium h-10"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
            >
              <option value="All">Tất cả Kỹ năng ứng viên</option>
              <option value="Java">Java</option>
              <option value="Spring Boot">Spring Boot</option>
              <option value="React">React</option>
              <option value="SQL">SQL</option>
              <option value="Docker">Docker</option>
              <option value="Git">Git</option>
            </select>
          </div>
        </div>

        {/* Status Tabs Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <SegmentedControl
            activeTab={statusTab}
            onChange={setStatusTab}
            tabs={[
              { id: 'All', label: 'Tất cả', activeColor: 'bg-blue-600 shadow-xs' },
              { id: 'Đã nộp', label: 'Mới nộp (New)', activeColor: 'bg-indigo-600 shadow-xs' },
              { id: 'Đã xem', label: 'Đã xem hồ sơ', activeColor: 'bg-sky-600 shadow-xs' },
              { id: 'Phỏng vấn', label: 'Lịch Phỏng vấn', activeColor: 'bg-amber-600 shadow-xs' },
              { id: 'Offer', label: 'Đã gửi Offer', activeColor: 'bg-emerald-600 shadow-xs' },
              { id: 'Từ chối', label: 'Từ chối', activeColor: 'bg-rose-600 shadow-xs' }
            ]}
          />

          <div className="flex items-center gap-3">
            {/* Match Score Threshold buttons */}
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400 font-bold mr-1">Match:</span>
              {[0, 60, 80].map(sc => (
                <button
                  key={sc}
                  onClick={() => setMinMatchScore(sc)}
                  className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
                    minMatchScore === sc ? 'bg-blue-600 text-white border-blue-600' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  {sc === 0 ? 'Tất cả' : `${sc}%+`}
                </button>
              ))}
            </div>

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-rose-600 hover:underline flex items-center gap-1"
              >
                <RotateCcw size={13} /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. APPLICANTS TABLE */}
      <div className="card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-60">Ứng viên</th>
                <th>Vị trí ứng tuyển</th>
                <th>Kỹ năng</th>
                <th>Match Score</th>
                <th>Ngày nộp</th>
                <th>Trạng thái</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-xs">
                    Không tìm thấy ứng viên nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredApps.map(app => {
                  const job = jobs.find(j => j.id === app.jobId) || jobs[0];
                  const appSkills = app.candidateSkills || candidateProfile.skills;
                  const match = calculateSkillMatch(appSkills, job.requiredSkills);

                  return (
                    <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                      <td>
                        <div
                          onClick={() => setDrawerApplicant({ app, job, match })}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs overflow-hidden shrink-0 border border-blue-200">
                            {app.candidateName.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors truncate">
                              {app.candidateName}
                            </p>
                            <p className="text-[11px] text-slate-500 truncate">{app.candidateUniversity || app.candidateEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="font-semibold text-slate-800 text-xs max-w-[180px] truncate">{job.title}</td>
                      <td>
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {appSkills.slice(0, 3).map(sk => (
                            <span key={sk} className="skill-tag text-[10px] py-0.5 px-1.5">{sk}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <MatchBadge score={match.percentage} label={match.label} badgeClass={match.badgeClass} />
                      </td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">{app.appliedDate}</td>
                      <td>
                        <select
                          className={`form-control py-1 px-2 text-xs font-semibold rounded-lg border ${
                            app.status === 'Offer'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : app.status === 'Phỏng vấn'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                              : app.status === 'Từ chối'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-blue-50 text-blue-700 border-blue-300'
                          }`}
                          value={app.status}
                          onChange={e => {
                            const newSt = e.target.value;
                            if (newSt === 'Phỏng vấn') {
                              setActiveInterviewAppId(app.id);
                            } else {
                              updateApplicationStatus(app.id, newSt);
                            }
                          }}
                        >
                          <option value="Đã nộp">Đã nộp</option>
                          <option value="Đã xem">Đã xem</option>
                          <option value="Phỏng vấn">Phỏng vấn</option>
                          <option value="Offer">Offer</option>
                          <option value="Từ chối">Từ chối</option>
                        </select>
                      </td>
                      <td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setDrawerApplicant({ app, job, match })}
                            className="btn btn-secondary btn-sm text-xs font-semibold"
                            title="Xem chi tiết hồ sơ ứng viên"
                          >
                            <UserCheck size={13} /> Hồ sơ
                          </button>
                          <button
                            onClick={() => setViewingCVModalCandidate(app)}
                            className="btn btn-secondary btn-sm text-xs"
                            title="Xem bản CV PDF"
                          >
                            <FileText size={13} /> CV
                          </button>
                          <button
                            onClick={() => setActiveInterviewAppId(app.id)}
                            className="btn btn-primary btn-sm text-xs font-bold"
                            title="Lên lịch phỏng vấn"
                          >
                            <Calendar size={13} /> Lịch PV
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. CANDIDATE SIDE DRAWER / DETAIL MODAL */}
      {drawerApplicant && (
        <Modal
          isOpen={!!drawerApplicant}
          onClose={() => setDrawerApplicant(null)}
          title={`Hồ sơ chi tiết Ứng viên - ${drawerApplicant.app.candidateName}`}
        >
          <div className="space-y-5 text-xs">
            {/* Candidate Header Card */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white text-blue-700 font-black text-lg flex items-center justify-center border-2 border-white shadow-sm overflow-hidden shrink-0">
                  {drawerApplicant.app.candidateName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold">{drawerApplicant.app.candidateName}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">{drawerApplicant.app.candidateUniversity} • {drawerApplicant.app.candidateEmail}</p>
                </div>
              </div>
              <MatchBadge score={drawerApplicant.match.percentage} label={drawerApplicant.match.label} badgeClass={drawerApplicant.match.badgeClass} />
            </div>

            {/* Application Meta */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3 text-slate-700">
              <p>Vị trí ứng tuyển: <strong>{drawerApplicant.job.title}</strong></p>
              <p>Ngày nộp hồ sơ: <strong>{drawerApplicant.app.appliedDate}</strong></p>
              <p>Trạng thái hiện tại: <strong className="text-blue-600">{drawerApplicant.app.status}</strong></p>
              <p>Lương kỳ vọng: <strong>8.000.000 - 12.000.000 VNĐ</strong></p>
            </div>

            {/* Matched vs Missing Skills breakdown */}
            <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Phân tích kỹ năng so khớp Level 1</h4>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check size={14} /> Kỹ năng đã đáp ứng ({drawerApplicant.match.matchedSkills.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {drawerApplicant.match.matchedSkills.map(sk => (
                    <span key={sk} className="skill-chip skill-chip-emerald">✓ {sk}</span>
                  ))}
                </div>
              </div>

              {drawerApplicant.match.missingSkills.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                    <AlertTriangle size={14} /> Kỹ năng còn thiếu ({drawerApplicant.match.missingSkills.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {drawerApplicant.match.missingSkills.map(sk => (
                      <span key={sk} className="skill-chip skill-chip-amber">! {sk}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Drawer Action CTAs */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setDrawerApplicant(null);
                  setViewingCVModalCandidate(drawerApplicant.app);
                }}
                className="btn btn-secondary text-xs font-semibold"
              >
                <FileText size={14} /> Xem PDF CV
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    updateApplicationStatus(drawerApplicant.app.id, 'Từ chối');
                    setDrawerApplicant(null);
                  }}
                  className="btn btn-danger text-xs font-bold"
                >
                  <XCircle size={14} /> Từ chối
                </button>
                <button
                  onClick={() => {
                    const id = drawerApplicant.app.id;
                    setDrawerApplicant(null);
                    setActiveInterviewAppId(id);
                  }}
                  className="btn btn-primary text-xs font-bold"
                >
                  <Calendar size={14} /> Mời Phỏng vấn
                </button>
                <button
                  onClick={() => {
                    updateApplicationStatus(drawerApplicant.app.id, 'Offer');
                    setDrawerApplicant(null);
                    showToast('Đã chuyển trạng thái ứng viên sang OFFER!', 'success');
                  }}
                  className="btn btn-success text-xs font-bold"
                >
                  <Award size={14} /> Gửi Offer
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* VIEW CV MODAL */}
      {viewingCVModalCandidate && (
        <Modal
          isOpen={!!viewingCVModalCandidate}
          onClose={() => setViewingCVModalCandidate(null)}
          title={`Chi tiết Hồ sơ & CV - ${viewingCVModalCandidate.candidateName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center border-2 border-white shadow-md overflow-hidden shrink-0">
                {viewingCVModalCandidate.candidateName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">{viewingCVModalCandidate.candidateName}</h4>
                <p className="text-slate-600">Trường: {viewingCVModalCandidate.candidateUniversity || 'Đại học FPT'} • Email: {viewingCVModalCandidate.candidateEmail}</p>
                <p className="text-slate-600">Kỹ năng: {(viewingCVModalCandidate.candidateSkills || candidateProfile.skills).join(', ')}</p>
              </div>
            </div>

            <div className="border-2 border-slate-200 rounded-xl p-6 text-center bg-white space-y-3">
              <FileText size={44} className="mx-auto text-blue-600" />
              <h4 className="font-bold text-slate-800 text-sm">{candidateProfile.cvFileName || 'Nguyen_Van_A_CV_2026.pdf'}</h4>
              <p className="text-slate-500 text-xs">Bản xem trước tài liệu PDF trực tuyến</p>
              <div className="p-4 bg-slate-50 rounded-lg text-left font-mono text-[11px] text-slate-700 space-y-1 border border-slate-200">
                <p className="font-bold text-blue-700">=== TÓM TẮT NỘI DUNG CV ===</p>
                <p>- Họ tên: {viewingCVModalCandidate.candidateName}</p>
                <p>- Mục tiêu: Thực tập / Fresher Backend Developer</p>
                <p>- Dự án: REST API Spring Boot + MySQL + React</p>
                <p>- Skill: Java Core, OOP, SQL, Git, RESTful API</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setViewingCVModalCandidate(null)} className="btn btn-secondary text-xs">Đóng</button>
            </div>
          </div>
        </Modal>
      )}

      {/* SCHEDULE INTERVIEW MODAL */}
      {activeInterviewAppId && (
        <ScheduleInterviewModal
          appId={activeInterviewAppId}
          onClose={() => setActiveInterviewAppId(null)}
        />
      )}
    </div>
  );
}

