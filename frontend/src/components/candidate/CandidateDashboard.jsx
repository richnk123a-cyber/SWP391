import React, { lazy, Suspense, useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { calculateSkillMatch } from '../../utils/matching';
import { ArrowUpRight, ArrowRight, Bookmark, BriefcaseBusiness, Check, CheckCircle2, ChevronRight, FileText, MapPin, Send, Eye, CalendarDays, Trophy, BookOpen, ShieldAlert, Sparkles, Compass, Plus } from 'lucide-react';
import { TechnologyBackdrop } from '../common/TechnologyBackdrop';
import './CandidateDashboard.css';

const CandidateReportHistoryModal = lazy(() => import('./CandidateReportHistoryModal').then(module => ({ default: module.CandidateReportHistoryModal })));

const EMPTY_SKILLS = [];
const skillList = value => Array.isArray(value) ? value : typeof value === 'string' ? value.split(/[,;\n]/).map(item => item.trim()).filter(Boolean) : [];

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
  const recommended = useMemo(() => jobs.filter(job => !job.moderationStatus || job.moderationStatus === 'APPROVED').map(job => ({ ...job, requiredSkills: skillList(job.requiredSkills), match: calculateSkillMatch(skills, skillList(job.requiredSkills), profile.extractedCvText) }))
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
    <div className="candidate-studio">
      <header className="studio-heading">
        <div>
          <p className="studio-eyebrow"><span />KHÔNG GIAN CỦA BẠN</p>
          <h1>Tổng quan sự nghiệp<span>.</span></h1>
          <p className="studio-heading-description">Mỗi bước nhỏ hôm nay, một cơ hội mới ngày mai.</p>
        </div>
        <div className="studio-heading-tools">
          <time className="studio-date" dateTime={new Date().toISOString()}><CalendarDays size={15} aria-hidden="true" />{date}</time>
          <button type="button" className="studio-report-button" onClick={() => setIsReportHistoryOpen(true)}><ShieldAlert size={16} aria-hidden="true" />Báo cáo của tôi</button>
        </div>
      </header>
      <section className="studio-hero studio-hero--technology" aria-labelledby="studio-welcome-heading">
        <div className="studio-hero-layout">
        <div className="studio-hero-copy">
          <p className="studio-hello">Chào {name},</p>
          <h2 id="studio-welcome-heading">Sự nghiệp của bạn,<br />đang tiến về phía trước.</h2>
          <p className="studio-hero-description">{recommended.length ? `${recommended.length} vị trí phù hợp đang chờ bạn hôm nay.` : 'Cập nhật hồ sơ để khám phá cơ hội phù hợp với bạn.'}</p>
          <div className="studio-hero-actions">
            <button type="button" className="studio-hero-primary" onClick={() => setActivePage('job-search')}>Tìm việc phù hợp <ArrowUpRight size={18} aria-hidden="true" /></button>
            <button type="button" className="studio-hero-secondary" onClick={() => setActivePage('learning-roadmap')}>Tiếp tục lộ trình <ArrowRight size={17} aria-hidden="true" /></button>
          </div>
        </div>
        <div className="studio-hero-visual">
          <TechnologyBackdrop animated />
          <div className="studio-goal-stack">
          <div className="studio-goal-card">
            <span className="studio-goal-label"><Compass size={15} aria-hidden="true" />MỤC TIÊU HIỆN TẠI</span>
            <h3>{profile.preferences?.desiredRole || 'Fresher Developer'}</h3>
            <div className="studio-goal-divider" />
            <div className="studio-goal-details"><span><strong>{skills.length}</strong> kỹ năng đã đồng bộ</span><span className="studio-cv-status"><span />{profile.hasCV ? 'CV đã sẵn sàng' : 'Cần bổ sung CV'}</span></div>
          </div>
          </div>
          <span className="studio-orbit-caption">Định hướng rõ ràng. Tiến xa hơn.</span>
        </div>
        </div>
      </section>

      <section className="studio-stats" aria-label="Thống kê ứng tuyển">
        {stats.map(({ label, value, icon: Icon, note }, index) => (
          <button key={label} type="button" className="studio-stat" onClick={() => setActivePage('application-kanban')}>
            <span className="studio-stat-top"><span className={`studio-stat-icon studio-stat-icon--${index}`}><Icon size={19} strokeWidth={1.6} aria-hidden="true" /></span><ArrowUpRight size={16} className="studio-stat-arrow" aria-hidden="true" /></span>
            <span className="studio-stat-value">{value.toString().padStart(2, '0')}</span>
            <span className="studio-stat-label">{label}</span>
            <span className="studio-stat-note">{note}</span>
          </button>
        ))}
      </section>

      <div className="studio-columns">
        <div className="studio-main">
          <section className="studio-recommendations" aria-labelledby="studio-jobs-heading">
            <div className="studio-section-heading">
              <div><span className="studio-section-kicker">CƠ HỘI TIẾP THEO</span><h2 id="studio-jobs-heading">Việc làm dành cho bạn <span className="studio-count">{recommended.length}</span></h2><p>Ưu tiên những vị trí phù hợp với kỹ năng hiện có.</p></div>
              <button type="button" className="studio-text-link" onClick={() => setActivePage('job-search')}>Xem tất cả <ArrowUpRight size={16} aria-hidden="true" /></button>
            </div>
            <div className="studio-job-grid">
              {recommended.map(job => (
                <article key={job.id} className="studio-job">
                  <div className="studio-job-company-row">
                    <span className="studio-company-mark" aria-hidden="true">{(job.company || 'IT').slice(0, 1).toUpperCase()}</span>
                    <div className="studio-company-copy"><p>{job.company || 'Doanh nghiệp'}{(job.isVerified || ['VERIFIED', 'Verified'].includes(job.verificationStatus || job.verifiedStatus)) && <CheckCircle2 size={13} aria-label="Doanh nghiệp đã xác minh" />}</p><span><MapPin size={12} aria-hidden="true" />{job.location || 'Chưa cập nhật địa điểm'}</span></div>
                    <button type="button" className="studio-bookmark" aria-label={savedJobIds.includes(job.id) ? `Bỏ lưu ${job.title}` : `Lưu ${job.title}`} aria-pressed={savedJobIds.includes(job.id)} onClick={() => toggleSaveJob(job.id)}><Bookmark size={17} fill={savedJobIds.includes(job.id) ? 'currentColor' : 'none'} /></button>
                  </div>
                  <h3><button type="button" onClick={() => openJob(job.id)}>{job.title}</button></h3>
                  <p className="studio-job-salary">{job.salary || 'Lương thỏa thuận'}</p>
                  <div className="studio-job-skills">{job.requiredSkills.slice(0, 3).map(skill => <span key={skill}>{skill}</span>)}</div>
                  <div className="studio-job-footer"><button type="button" className="studio-match" onClick={() => openJob(job.id)}><span />{job.match.percentage}% khớp kỹ năng</button><button type="button" className="studio-job-open" onClick={() => openJob(job.id)} aria-label={`Xem chi tiết ${job.title}`}><ArrowUpRight size={18} /></button></div>
                </article>
              ))}
            </div>
            {!recommended.length && <div className="studio-empty"><BriefcaseBusiness size={28} aria-hidden="true" /><h3>Chưa có công việc đề xuất</h3><p>Khám phá danh sách tuyển dụng hoặc cập nhật kỹ năng của bạn.</p><button type="button" className="studio-text-link" onClick={() => setActivePage('job-search')}>Tìm việc làm <ArrowRight size={15} aria-hidden="true" /></button></div>}
            <p className="studio-job-footnote"><Sparkles size={13} aria-hidden="true" />Gợi ý dựa trên kỹ năng trong hồ sơ và yêu cầu tuyển dụng.</p>
          </section>

          <section className="studio-panel studio-activity" aria-labelledby="studio-activity-heading">
            <div className="studio-panel-heading"><div><h2 id="studio-activity-heading">Hoạt động ứng tuyển</h2><p>Theo dõi những cơ hội bạn đang theo đuổi.</p></div>{myApplications.length > 0 && <button type="button" className="studio-text-link" onClick={() => setActivePage('application-kanban')}>Quản lý <ArrowUpRight size={16} aria-hidden="true" /></button>}</div>
            {myApplications.length ? (
              <div className="studio-application-list">{myApplications.slice(0, 3).map(application => <button type="button" key={application.id} className="studio-application" onClick={() => setActivePage('application-kanban')}><span className="studio-application-icon"><FileText size={18} aria-hidden="true" /></span><span className="studio-application-copy"><strong>{application.jobTitle}</strong><small>{application.companyName}</small></span><span className="studio-application-status" data-status={application.status}>{application.status}</span><ChevronRight size={16} aria-hidden="true" /></button>)}</div>
            ) : (
              <div className="studio-application-empty"><span className="studio-empty-icon"><Send size={22} aria-hidden="true" /></span><div><h3>Chưa có đơn ứng tuyển</h3><p>Các hồ sơ bạn gửi sẽ được cập nhật tại đây.</p></div><button type="button" className="studio-secondary-button" onClick={() => setActivePage('job-search')}>Khám phá việc làm <ArrowUpRight size={16} aria-hidden="true" /></button></div>
            )}
          </section>
        </div>

        <aside className="studio-rail" aria-label="Hồ sơ và phát triển kỹ năng">
          <section className="studio-panel studio-profile" aria-labelledby="studio-profile-heading">
            <div className="studio-profile-heading">
              <div className="studio-completion-ring" role="progressbar" aria-label="Mức độ hoàn thiện hồ sơ" aria-valuenow={completion} aria-valuemin={0} aria-valuemax={100} style={{ '--completion': `${completion}%` }}><span>{completion}<small>%</small></span></div>
              <div><span className="studio-section-kicker">NỀN TẢNG SỰ NGHIỆP</span><h2 id="studio-profile-heading">Hồ sơ của bạn</h2></div>
            </div>
            <p className="studio-profile-description">{completion === 100 ? 'Hồ sơ đã sẵn sàng. Hãy giữ thông tin luôn cập nhật.' : 'Hoàn thiện hồ sơ để có những gợi ý chính xác hơn.'}</p>
            <ul className="studio-profile-checklist">{profileChecks.map(item => <li key={item.label}><span className={`studio-check-icon ${item.done ? 'is-complete' : ''}`}>{item.done ? <Check size={12} aria-hidden="true" /> : <Plus size={12} aria-hidden="true" />}</span><span>{item.label}</span><small>{item.done ? 'Hoàn tất' : 'Bổ sung'}</small></li>)}</ul>
            <button type="button" className="studio-primary-button" onClick={() => setActivePage('candidate-profile')}>Cập nhật hồ sơ <ArrowUpRight size={16} aria-hidden="true" /></button>
          </section>

          <section className="studio-panel studio-roadmap" aria-labelledby="studio-roadmap-heading">
            <div className="studio-roadmap-heading"><span className="studio-roadmap-icon"><BookOpen size={20} aria-hidden="true" /></span><div><span className="studio-section-kicker">MỖI NGÀY MỘT BƯỚC</span><h2 id="studio-roadmap-heading">Lộ trình học tập</h2></div></div>
            {roadmap ? <><p className="studio-roadmap-target">{roadmap.targetRole}</p><div className="studio-roadmap-progress-label"><span>{completed}/{topics.length} chủ đề hoàn thành</span><strong>{progress}%</strong></div><div className="studio-progress" role="progressbar" aria-label="Tiến độ học tập" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${progress}%` }} /></div><div className="studio-next-topic"><span>{nextTopic ? 'TIẾP THEO' : 'ĐÃ HOÀN THÀNH'}</span><h3>{nextTopic ? nextTopic.title.replace(/^\d+\.\s*/, '') : 'Bạn đã hoàn thành các chủ đề'}</h3>{nextTopic?.estimatedTime && <p>{nextTopic.estimatedTime} học tập</p>}</div></> : <p className="studio-profile-description">Chọn mục tiêu để bắt đầu lộ trình phát triển kỹ năng của bạn.</p>}
            <button type="button" className="studio-secondary-button" onClick={() => setActivePage('learning-roadmap')}>{roadmap ? 'Tiếp tục học' : 'Khám phá lộ trình'}<ArrowRight size={16} aria-hidden="true" /></button>
          </section>

          <section className="studio-insight" aria-labelledby="studio-insight-heading">
            <span className="studio-insight-icon"><Sparkles size={20} strokeWidth={1.5} aria-hidden="true" /></span><span className="studio-section-kicker">GÓC NHÌN KỸ NĂNG</span>
            <h2 id="studio-insight-heading">Biết mình phù hợp<br />ở đâu.</h2>
            <p>{bestJob ? `Đối chiếu hồ sơ với “${bestJob.title}” để hiểu điểm mạnh và kỹ năng cần bổ sung.` : 'Khám phá việc làm để đối chiếu yêu cầu với kỹ năng hiện tại.'}</p>
            <button type="button" className="studio-insight-button" onClick={bestJob ? openAnalysis : () => setActivePage('job-search')}>{bestJob ? 'Xem phân tích kỹ năng' : 'Khám phá việc làm'}<ArrowUpRight size={16} aria-hidden="true" /></button>
          </section>
        </aside>
      </div>
      <footer className="studio-footer"><span>CareerFit <span>/</span> Hành trình nghề nghiệp của bạn</span><span><span className="studio-footer-dot" />Phát triển từ những bước nhỏ.</span></footer>
      {isReportHistoryOpen && <Suspense fallback={null}><CandidateReportHistoryModal isOpen onClose={() => setIsReportHistoryOpen(false)} /></Suspense>}
    </div>
  );
}
