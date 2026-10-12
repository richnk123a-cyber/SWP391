import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateSkillMatch } from '../../utils/matching';
import { ArrowUpRight, ArrowRight, Bookmark, BriefcaseBusiness, Check, CheckCircle2, ChevronRight, FileText, MapPin, Send, Eye, CalendarDays, Trophy, BookOpen, ShieldAlert } from 'lucide-react';
import './CandidateDashboard.css';
import { CandidateCareerBanner } from './CandidateCareerBanner';
import { CandidateReportHistoryModal } from './CandidateReportHistoryModal';

const EMPTY_SKILLS = [];

export function CandidateDashboard() {
  const { currentUser, candidateProfile, jobs = [], applications = [], roadmaps = [], setActivePage, setSelectedJobId, setIsAIModalOpen, savedJobIds = [], toggleSaveJob } = useApp();
  const [isReportHistoryOpen, setIsReportHistoryOpen] = useState(false);
  const profile = candidateProfile || {};
  const skills = profile.skills || EMPTY_SKILLS;
  const name = profile.name || currentUser?.fullName || currentUser?.username || 'bạn';
  const myApplications = useMemo(() => {
    if (!currentUser || currentUser.role !== 'CANDIDATE') return [];
    const items = currentUser.id === 'user-cand-1' ? applications : applications.filter(item => item.candidateId === currentUser.id || item.candidateId === profile.id);
    return items.map(item => {
      const job = jobs.find(entry => entry.id === item.jobId);
      return { ...item, jobTitle: item.jobTitle || job?.title || 'Vị trí đã ứng tuyển', companyName: item.companyName || job?.company || 'Doanh nghiệp' };
    });
  }, [applications, currentUser, jobs, profile.id]);
  const recommended = useMemo(() => jobs.filter(job => !job.moderationStatus || job.moderationStatus === 'APPROVED').map(job => ({ ...job, match: calculateSkillMatch(skills, job.requiredSkills || [], profile.extractedCvText) }))
    .sort((a, b) => b.match.percentage - a.match.percentage).slice(0, 4), [jobs, skills, profile.extractedCvText]);
  const profileChecks = [
    { label: 'Thông tin cá nhân', done: Boolean(profile.name && profile.email && profile.phone) },
    { label: 'Kỹ năng chuyên môn', done: skills.length > 0 },
    { label: 'CV đính kèm', done: Boolean(profile.hasCV) },
    { label: 'Mục tiêu nghề nghiệp', done: Boolean(profile.preferences?.desiredRole) },
  ];
  const completion = Math.round(profileChecks.filter(item => item.done).length / profileChecks.length * 100);
  const roadmap = roadmaps[0];
  const topics = roadmap?.topics || [];
  const completed = topics.filter(topic => topic.completed).length;
  const progress = topics.length ? Math.round(completed / topics.length * 100) : 0;
  const nextTopic = topics.find(topic => !topic.completed);
  const bestJob = recommended[0];
  const stats = [
    { label: 'Đã ứng tuyển', value: myApplications.length, icon: Send, note: 'Tổng hồ sơ đã gửi' },
    { label: 'Nhà tuyển dụng đã xem', value: myApplications.filter(item => ['Đã xem', 'Phỏng vấn', 'Offer'].includes(item.status)).length, icon: Eye, note: 'Hồ sơ được quan tâm' },
    { label: 'Lịch phỏng vấn', value: myApplications.filter(item => item.status === 'Phỏng vấn').length, icon: CalendarDays, note: 'Đang ở vòng phỏng vấn' },
    { label: 'Lời mời nhận việc', value: myApplications.filter(item => item.status === 'Offer').length, icon: Trophy, note: 'Bước tiến tiếp theo' },
  ];
  const openJob = (id) => { setSelectedJobId(id); setActivePage('job-detail'); };
  const openAnalysis = () => { if (bestJob) { setSelectedJobId(bestJob.id); setIsAIModalOpen(true); } };
  const date = new Intl.DateTimeFormat('vi-VN', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());

  return (
    <div className="candidate-overview">
      <header className="overview-heading">
        <div><p className="overview-eyebrow">KHÔNG GIAN CỦA BẠN</p><h1>Tổng quan sự nghiệp</h1><p>Mỗi bước nhỏ hôm nay, một cơ hội mới ngày mai.</p></div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsReportHistoryOpen(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 font-medium bg-white text-slate-700 shadow-xs transition-colors cursor-pointer"
          >
            <ShieldAlert size={14} className="text-amber-600" /> Báo cáo của tôi
          </button>
          <span className="overview-date"><CalendarDays size={15} />{date}</span>
        </div>
      </header>

      <CandidateCareerBanner name={name} targetRole={profile.preferences?.desiredRole || 'Fresher Developer'} skills={skills} jobCount={recommended.length} hasCV={profile.hasCV} onNavigate={setActivePage} />

      <section className="overview-stats" aria-label="Thống kê ứng tuyển">
        {stats.map(({ label, value, icon: Icon, note }) => <button key={label} className="overview-stat" onClick={() => setActivePage('application-kanban')}><span className="stat-top"><span>{label}</span><Icon size={17} strokeWidth={1.6} /></span><strong>{value.toString().padStart(2, '0')}</strong><span className="stat-note">{note}<ArrowUpRight size={14} /></span></button>)}
      </section>

      <div className="overview-columns">
        <div className="overview-main">
          <section className="overview-panel recommended-panel">
            <div className="panel-heading"><div><h2>Việc làm dành cho bạn <span className="panel-count">{recommended.length}</span></h2><p>Ưu tiên những vị trí phù hợp với kỹ năng hiện có.</p></div><button className="overview-link" onClick={() => setActivePage('job-search')}>Xem tất cả <ArrowRight size={15} /></button></div>
            <div className="recommended-list">
              {recommended.map(job => <article key={job.id} className="overview-job">
                <div className="company-monogram" aria-hidden="true">{(job.company || 'IT').slice(0, 1).toUpperCase()}</div>
                <div className="overview-job-content"><div className="job-title-row"><button className="job-title" onClick={() => openJob(job.id)}>{job.title}</button><button className={`job-bookmark ${savedJobIds.includes(job.id) ? 'is-saved' : ''}`} aria-label={savedJobIds.includes(job.id) ? `Bỏ lưu ${job.title}` : `Lưu ${job.title}`} aria-pressed={savedJobIds.includes(job.id)} onClick={() => toggleSaveJob(job.id)}><Bookmark size={17} fill={savedJobIds.includes(job.id) ? 'currentColor' : 'none'} /></button></div><p className="job-company">{job.company}{(job.isVerified || ['VERIFIED', 'Verified'].includes(job.verificationStatus || job.verifiedStatus)) && <CheckCircle2 size={13} aria-label="Doanh nghiệp đã xác minh" />}</p><div className="job-meta"><span><MapPin size={13} />{job.location || 'Chưa cập nhật địa điểm'}</span><span className="job-salary">{job.salary || 'Lương thỏa thuận'}</span></div><div className="job-bottom"><div className="job-skill-tags">{(job.requiredSkills || []).slice(0, 3).map(skill => <span key={skill}>{skill}</span>)}</div><button className="job-match" onClick={() => openJob(job.id)}><span className="match-dot" />{job.match.percentage}% khớp kỹ năng<ChevronRight size={14} /></button></div></div>
              </article>)}
              {!recommended.length && <div className="overview-empty"><BriefcaseBusiness size={28} /><h3>Chưa có công việc đề xuất</h3><p>Khám phá danh sách tuyển dụng hoặc cập nhật kỹ năng của bạn.</p><button className="overview-link" onClick={() => setActivePage('job-search')}>Tìm việc làm <ArrowRight size={15} /></button></div>}
            </div>
            <div className="panel-footnote">Gợi ý dựa trên kỹ năng trong hồ sơ và yêu cầu tuyển dụng.</div>
          </section>

          <section className="overview-panel">
            <div className="panel-heading"><div><h2>Hoạt động ứng tuyển</h2><p>Theo dõi những cơ hội bạn đang theo đuổi.</p></div>{myApplications.length > 0 && <button className="overview-link" onClick={() => setActivePage('application-kanban')}>Quản lý <ArrowRight size={15} /></button>}</div>
            {myApplications.length ? <div className="overview-application-list">{myApplications.slice(0, 3).map(application => <button key={application.id} className="overview-application" onClick={() => setActivePage('application-kanban')}><span className="application-icon"><FileText size={18} /></span><span><strong>{application.jobTitle}</strong><small>{application.companyName}</small></span><span className="application-status">{application.status}</span><ChevronRight size={15} /></button>)}</div> : (
              <div className="application-empty">
                <span className="empty-icon" aria-hidden="true"><Send size={21} strokeWidth={1.5} /></span>
                <div className="application-empty-copy">
                  <h3>Chưa có đơn ứng tuyển</h3>
                  <p>Các hồ sơ bạn gửi sẽ được cập nhật tại đây.</p>
                </div>
                <button className="application-empty-action" onClick={() => setActivePage('job-search')}>Khám phá việc làm <ArrowUpRight size={15} /></button>
              </div>
            )}
          </section>
        </div>

        <aside className="overview-rail" aria-label="Hồ sơ và phát triển kỹ năng">
          <section className="overview-panel profile-panel"><div className="panel-heading"><h2>Hồ sơ của bạn</h2><span className="profile-percentage">{completion}%</span></div><div className="overview-progress" role="progressbar" aria-label="Mức độ hoàn thiện hồ sơ" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${completion}%` }} /></div><p className="rail-description">{completion === 100 ? 'Hồ sơ đã sẵn sàng. Hãy giữ thông tin luôn cập nhật.' : 'Hoàn thiện hồ sơ để có những gợi ý chính xác hơn.'}</p><ul className="profile-checklist">{profileChecks.map(item => <li key={item.label}><span>{item.label}</span>{item.done ? <Check size={15} className="check-complete" aria-label="Đã hoàn thành" /> : <span className="check-pending">Bổ sung</span>}</li>)}</ul><button className="overview-button secondary full-width" onClick={() => setActivePage('candidate-profile')}>Cập nhật hồ sơ <ArrowUpRight size={15} /></button></section>

          <section className="overview-panel roadmap-panel"><div className="panel-heading"><h2>Lộ trình học tập</h2><BookOpen size={17} /></div>{roadmap ? <><p className="roadmap-target">{roadmap.targetRole}</p><div className="roadmap-progress-label"><span>{completed}/{topics.length} chủ đề hoàn thành</span><strong>{progress}%</strong></div><div className="overview-progress" role="progressbar" aria-label="Tiến độ học tập" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><div className="next-topic"><span>{nextTopic ? 'TIẾP THEO' : 'ĐÃ HOÀN THÀNH'}</span><h3>{nextTopic ? nextTopic.title.replace(/^\d+\.\s*/, '') : 'Bạn đã hoàn thành các chủ đề'}</h3>{nextTopic?.estimatedTime && <p>{nextTopic.estimatedTime} học tập</p>}</div></> : <p className="rail-description">Chọn mục tiêu để bắt đầu lộ trình phát triển kỹ năng của bạn.</p>}<button className="overview-button secondary full-width" onClick={() => setActivePage('learning-roadmap')}>{roadmap ? 'Tiếp tục học' : 'Khám phá lộ trình'}<ArrowRight size={15} /></button></section>

          <section className="overview-insight"><span className="insight-label">GÓC NHÌN KỸ NĂNG</span><h2>Biết mình phù hợp ở đâu.</h2><p>{bestJob ? `Đối chiếu hồ sơ với “${bestJob.title}” để hiểu điểm mạnh và kỹ năng cần bổ sung.` : 'Khám phá việc làm để đối chiếu yêu cầu với kỹ năng hiện tại.'}</p><button className="overview-link" onClick={bestJob ? openAnalysis : () => setActivePage('job-search')}>{bestJob ? 'Xem phân tích kỹ năng' : 'Khám phá việc làm'}<ArrowUpRight size={16} /></button></section>
        </aside>
      </div>
      <footer className="overview-footer"><span>CareerFit <span> / </span> Hành trình nghề nghiệp của bạn</span></footer>
      <CandidateReportHistoryModal isOpen={isReportHistoryOpen} onClose={() => setIsReportHistoryOpen(false)} />
    </div>
  );
}


