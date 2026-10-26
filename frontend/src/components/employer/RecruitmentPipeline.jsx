import { EmployerPageHeader } from './EmployerPageHeader';
import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MatchBadge } from '../common/Badge';
import { calculateSkillMatch } from '../../utils/matching';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import { Video } from 'lucide-react';

export function RecruitmentPipeline() {
  const {
    currentUser,
    applications,
    jobs,
    employerProfile,
    candidateProfile,
    updateApplicationStatus,
    setViewingCVModalCandidate,
    companies,
    showToast
  } = useApp();

  const [activeInterviewModalAppId, setActiveInterviewModalAppId] = useState(null);
  const [selectedJobFilter, setSelectedJobFilter] = useState('All');
  const [draggedAppId, setDraggedAppId] = useState(null);

  // Filter jobs for current employer
  const employerJobs = useMemo(() => {
    if (!employerProfile && !currentUser) return [];
    const validIds = new Set();
    if (currentUser?.id) validIds.add(currentUser.id);
    if (employerProfile?.ownerUserId) validIds.add(employerProfile.ownerUserId);
    if (employerProfile?.id) validIds.add(employerProfile.id);

    const validNames = new Set();
    if (employerProfile?.companyName) validNames.add(employerProfile.companyName.toLowerCase().trim());
    if (currentUser?.username) validNames.add(currentUser.username.toLowerCase().trim());
    if (currentUser?.fullName) validNames.add(currentUser.fullName.toLowerCase().trim());

    if (Array.isArray(companies)) {
      companies.forEach(c => {
        const matchesUser = (currentUser?.id && c.ownerUserId === currentUser.id) ||
                            (currentUser?.email && c.email?.toLowerCase() === currentUser.email.toLowerCase());
        if (matchesUser) {
          if (c.id) validIds.add(c.id);
          if (c.ownerUserId) validIds.add(c.ownerUserId);
          if (c.companyName) validNames.add(c.companyName.toLowerCase().trim());
        }
      });
    }

    return jobs.filter(j => 
      (j.employerId && validIds.has(j.employerId)) ||
      (j.company && validNames.has(j.company.toLowerCase().trim()))
    );
  }, [jobs, employerProfile, currentUser, companies]);

  const employerJobIds = useMemo(() => {
    return employerJobs.map(j => j.id);
  }, [employerJobs]);

  // Filter applications for current employer
  const employerApps = useMemo(() => {
    return applications.filter(app => {
      const isMyJob = employerJobIds.includes(app.jobId);
      const matchesJobFilter = selectedJobFilter === 'All' || app.jobId === selectedJobFilter;
      return isMyJob && matchesJobFilter;
    });
  }, [applications, employerJobIds, selectedJobFilter]);

  const columns = [
    { id: 'Đã nộp', label: 'Đã nộp (New)', color: 'bg-blue-50 border-blue-200 text-blue-900', badgeColor: 'bg-blue-600 text-white' },
    { id: 'Đã xem', label: 'Đã xem (Viewed)', color: 'bg-slate-100 border-slate-200 text-slate-800', badgeColor: 'bg-slate-600 text-white' },
    { id: 'Phỏng vấn', label: 'Phỏng vấn (Interview)', color: 'bg-indigo-50 border-indigo-200 text-indigo-900', badgeColor: 'bg-indigo-600 text-white' },
    { id: 'Offer', label: 'Offer (Thư mời)', color: 'bg-emerald-50 border-emerald-200 text-emerald-900', badgeColor: 'bg-emerald-600 text-white' },
    { id: 'Từ chối', label: 'Từ chối (Rejected)', color: 'bg-rose-50 border-rose-200 text-rose-900', badgeColor: 'bg-rose-600 text-white' }
  ];

  // Drag and drop handlers
  const handleDragStart = (e, appId) => {
    setDraggedAppId(appId);
    e.dataTransfer.setData('text/plain', appId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const appId = draggedAppId || e.dataTransfer.getData('text/plain');
    if (!appId) return;

    if (targetStatus === 'Phỏng vấn') {
      setActiveInterviewModalAppId(appId);
    } else {
      updateApplicationStatus(appId, targetStatus);
      showToast(`Đã chuyển ứng viên sang cột "${targetStatus}"`, 'success');
    }
    setDraggedAppId(null);
  };

  return (
    <div className="employer-page hiring-pipeline-page space-y-6 mx-auto">
      <EmployerPageHeader eyebrow="TỪ KẾT NỐI ĐẾN ĐỒNG HÀNH" title="Quy trình tuyển dụng" description="Kéo và thả card ứng viên hoặc chọn từ menu để chuyển tiếp trạng thái tuyển dụng." />
      <div className="employer-pipeline-toolbar">
        <label htmlFor="pipeline-job-filter">Vị trí tuyển dụng</label>
        <select id="pipeline-job-filter" className="form-control" value={selectedJobFilter} onChange={e => setSelectedJobFilter(e.target.value)}>
          <option value="All">Tất cả tin tuyển dụng ({employerJobs.length})</option>
          {employerJobs.map(job => <option key={job.id} value={job.id}>{job.title}</option>)}
        </select>
        <span className="employer-pipeline-total"><strong>{employerApps.length}</strong> hồ sơ · 05 giai đoạn</span>
      </div>

      {/* KANBAN BOARD */}
      <div className="hiring-pipeline-board flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {columns.map(col => {
          const colApps = employerApps.filter(a => a.status === col.id);
          return (
            <div
              key={col.id}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col.id)}
              data-stage={col.id} className="hiring-pipeline-column min-w-[300px] w-[300px] bg-slate-50/90 rounded-2xl border border-slate-200 p-3 flex flex-col max-h-[calc(100vh-220px)] shrink-0 transition-colors"
            >
              {/* Column Header */}
              <div className={`p-3 rounded-xl border flex items-center justify-between mb-3 shadow-2xs ${col.color}`}>
                <span className="font-extrabold text-xs">{col.label}</span>
                <span className={`w-5 h-5 rounded-full text-[11px] font-black flex items-center justify-center shadow-xs ${col.badgeColor}`}>
                  {colApps.length}
                </span>
              </div>

              {/* Column Candidates List */}
              <div className="space-y-3 flex-1 overflow-y-auto pr-1">
                {colApps.map(app => {
                  const job = jobs.find(j => j.id === app.jobId) || { title: 'Tin tuyển dụng IT', requiredSkills: [] };
                  const appSkills = app.candidateSkills || [];
                  const match = calculateSkillMatch(appSkills, job.requiredSkills || []);

                  return (
                    <div
                      key={app.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      className="hiring-pipeline-card bg-white p-4 rounded-xl border border-slate-200/90 hover:border-blue-400 shadow-2xs hover:shadow-md transition-all space-y-3 cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-900 text-xs group-hover:text-blue-600 transition-colors truncate">
                            {app.candidateName}
                          </h4>
                          <p className="text-[11px] text-slate-500 truncate">{app.candidateUniversity || app.candidateEmail}</p>
                        </div>
                        <MatchBadge showIcon={false} score={match.percentage} label={match.label} badgeClass={match.badgeClass} />
                      </div>

                      <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <p className="font-semibold text-slate-800 truncate">{job.title}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Nộp ngày: {app.appliedDate || 'Gần đây'}</p>
                      </div>

                      {/* Display Interview Tag if scheduled */}
                      {app.status === 'Phỏng vấn' && app.interviewDetails && (
                        <div className="p-2 bg-indigo-50 rounded-lg border border-indigo-100 text-[10px] text-indigo-900 space-y-0.5">
                          <p className="font-bold flex items-center gap-1">
                            <Video size={11} className="text-indigo-600" /> {app.interviewDetails.time}
                          </p>
                          <p className="text-slate-600 truncate">{app.interviewDetails.date}</p>
                        </div>
                      )}

                      {/* Controls Footer */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setViewingCVModalCandidate(app);
                          }}
                          className="hiring-cv-link"
                          title="Xem CV PDF"
                        >
                          Xem CV
                        </button>

                        <select
                          className="form-control py-1 px-1.5 text-[11px] font-semibold bg-slate-50 border-slate-200 rounded-lg flex-1 cursor-pointer"
                          aria-label={`Trạng thái của ${app.candidateName}`}
                          value={app.status}
                          onChange={e => {
                            const newSt = e.target.value;
                            if (newSt === 'Phỏng vấn') {
                              setActiveInterviewModalAppId(app.id);
                            } else {
                              updateApplicationStatus(app.id, newSt);
                              showToast(`Đã chuyển ứng viên sang trạng thái "${newSt}"`, 'info');
                            }
                          }}
                        >
                          {columns.map(c => (
                            <option key={c.id} value={c.id}>{c.id}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  );
                })}

                {colApps.length === 0 && (
                  <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white/60">
                    Kéo thả ứng viên vào đây
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* SCHEDULE INTERVIEW MODAL */}
      {activeInterviewModalAppId && (
        <ScheduleInterviewModal
          appId={activeInterviewModalAppId}
          onClose={() => setActiveInterviewModalAppId(null)}
        />
      )}
    </div>
  );
}


