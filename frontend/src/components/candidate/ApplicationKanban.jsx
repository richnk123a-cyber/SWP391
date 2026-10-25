import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { ArrowRight, BriefcaseBusiness, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3, Eye, FileText, LayoutGrid, List, Search, Send, Video, X } from 'lucide-react';
import './ApplicationKanban.css';

const stages = [
  { value: 'Đã nộp', label: 'Đã nộp hồ sơ', hint: 'Chờ nhà tuyển dụng xem', color: 'blue', icon: Send },
  { value: 'Đã xem', label: 'Đã được xem', hint: 'Hồ sơ đang được cân nhắc', color: 'violet', icon: Eye },
  { value: 'Phỏng vấn', label: 'Phỏng vấn', hint: 'Chuẩn bị cho cuộc hẹn', color: 'amber', icon: CalendarDays },
  { value: 'Offer', label: 'Nhận offer', hint: 'Trao đổi bước tiếp theo', color: 'green', icon: Check },
  { value: 'Từ chối', label: 'Chưa phù hợp', hint: 'Tiếp tục cơ hội khác', color: 'rose', icon: X },
];
function dateValue(value) {
  if (!value) return 0;
  const match = String(value).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return match ? new Date(+match[3], +match[2] - 1, +match[1]).getTime() : (Date.parse(value) || 0);
}
function meetingUrl(value) {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : null; } catch { return null; }
}
function Status({ status }) {
  const stage = stages.find(item => item.value === status);
  return <span className={`applications-status tone-${stage?.color || 'blue'}`}><i />{stage?.label || status}</span>;
}

export function ApplicationKanban() {
  const { applications = [], jobs = [], candidateProfile, currentUser, setActivePage, setSelectedJobId, refreshApplications } = useApp();
  const [detailId, setDetailId] = useState(null);

  useEffect(() => {
    if (typeof refreshApplications === 'function') {
      refreshApplications();
    }
  }, [refreshApplications]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('All');
  const [sort, setSort] = useState('updated');
  const [view, setView] = useState('list');
  const boardRef = useRef(null);
  const ownApps = useMemo(() => {
    if (currentUser?.role !== 'CANDIDATE') return [];
    const ids = [currentUser.id, candidateProfile?.id].filter(Boolean);
    const emails = [currentUser.email, candidateProfile?.email].filter(Boolean).map(email => email.toLowerCase());
    return applications.filter(app => ids.includes(app.candidateId) || (app.candidateEmail && emails.includes(app.candidateEmail.toLowerCase()))).map(app => {
      const job = jobs.find(item => item.id === app.jobId);
      return { ...app, jobTitle: app.jobTitle || job?.title || 'Vị trí tuyển dụng', companyName: app.companyName || job?.company || 'Thông tin doanh nghiệp chưa có', jobAvailable: !!job };
    });
  }, [applications, jobs, currentUser, candidateProfile]);
  const filtered = useMemo(() => ownApps.filter(app => (status === 'All' || app.status === status) && `${app.jobTitle} ${app.companyName}`.toLocaleLowerCase('vi').includes(search.trim().toLocaleLowerCase('vi'))).sort((a, b) => sort === 'company' ? a.companyName.localeCompare(b.companyName, 'vi') : dateValue(sort === 'applied' ? b.appliedDate : b.lastUpdate || b.appliedDate) - dateValue(sort === 'applied' ? a.appliedDate : a.lastUpdate || a.appliedDate)), [ownApps, search, status, sort]);
  const interviews = ownApps.filter(app => app.status === 'Phỏng vấn' && (app.interviewDetails || app.interviewDate || app.interviewTime));
  const detail = ownApps.find(app => app.id === detailId);
  const reset = () => { setSearch(''); setStatus('All'); };
  const openJob = app => { setDetailId(null); setSelectedJobId(app.jobId); setActivePage('job-detail'); };
  const interviewInfo = app => {
    const info = app.interviewDetails || {};
    const displayDate = info.date || app.interviewDate || app.interviewTime || 'Chờ xác nhận ngày';
    const displayType = info.type || (app.interviewNote && app.interviewNote.startsWith('[') ? app.interviewNote.slice(1, app.interviewNote.indexOf(']')) : 'Phỏng vấn trực tuyến');
    const displayNote = info.note || (app.interviewNote && app.interviewNote.startsWith('[') ? app.interviewNote.slice(app.interviewNote.indexOf(']') + 1).trim() : app.interviewNote);
    const displayLink = info.meetingLink || app.meetingLink;
    return <div className="applications-interview-info"><span><CalendarDays size={15} />{displayDate}{info.time && info.time !== displayDate ? ` · ${info.time}` : ''}</span><span><Video size={15} />{displayType}</span>{displayNote && <p>{displayNote}</p>}{meetingUrl(displayLink) && <a className="applications-link" href={meetingUrl(displayLink)} target="_blank" rel="noopener noreferrer">Mở phòng phỏng vấn <ArrowRight size={14} /></a>}</div>;
  };
  return <div className="applications-page">
    <header className="applications-hero"><div><span className="applications-eyebrow">RECRUITMENT INTELLIGENCE</span><h1>Mỗi hồ sơ, một bước tiến.</h1><p>Theo dõi đơn ứng tuyển, phản hồi và lịch phỏng vấn trong cùng một không gian.</p><div className="applications-hero-meta"><span><BriefcaseBusiness size={15} />{ownApps.length} đơn ứng tuyển</span><span><Clock3 size={15} />{ownApps.filter(app => !['Offer', 'Từ chối'].includes(app.status)).length} đơn đang theo dõi</span></div></div><button className="applications-primary" onClick={() => setActivePage('job-search')}>Tìm thêm việc làm <ArrowRight size={16} /></button></header>
    <section className="applications-metrics" aria-label="Trạng thái đơn ứng tuyển">{stages.map(stage => { const Icon = stage.icon; return <button key={stage.value} className={`applications-metric tone-${stage.color} ${status === stage.value ? 'is-selected' : ''}`} aria-pressed={status === stage.value} onClick={() => setStatus(status === stage.value ? 'All' : stage.value)}><span>{stage.label}<Icon size={17} /></span><strong>{ownApps.filter(app => app.status === stage.value).length}</strong><small>{stage.hint}</small></button>; })}</section>
    {interviews.length > 0 && <section className="applications-interviews"><div className="applications-section-heading"><div><span className="applications-kicker">CHUẨN BỊ BƯỚC TIẾP THEO</span><h2>Lịch phỏng vấn của bạn <span>{interviews.length}</span></h2></div><CalendarDays size={23} /></div><div className="applications-interview-grid">{interviews.map(app => <article key={app.id}><h3>{app.jobTitle}</h3><p>{app.companyName}</p>{interviewInfo(app)}<button className="applications-link" onClick={() => setDetailId(app.id)}>Xem hồ sơ ứng tuyển <ArrowRight size={14} /></button></article>)}</div></section>}
    <section className="applications-workspace"><div className="applications-section-heading"><div><span className="applications-kicker">KHÔNG GIAN THEO DÕI</span><h2>Đơn ứng tuyển <span>{ownApps.length}</span></h2></div>{ownApps.length > 0 && <div className="applications-view-switch" aria-label="Kiểu hiển thị"><button aria-pressed={view === 'list'} onClick={() => setView('list')}><List size={16} />Danh sách</button><button aria-pressed={view === 'board'} onClick={() => setView('board')}><LayoutGrid size={16} />Bảng</button></div>}</div>
    {ownApps.length === 0 ? <div className="applications-empty-layout"><div className="applications-empty"><span className="applications-empty-icon"><Send size={28} /></span><h3>Cơ hội tiếp theo bắt đầu từ hồ sơ đầu tiên.</h3><p>Bạn chưa gửi đơn ứng tuyển. Chọn một vị trí phù hợp; các phản hồi của nhà tuyển dụng sẽ được tập hợp tại đây.</p><button className="applications-primary" onClick={() => setActivePage('job-search')}>Khám phá việc làm <ArrowRight size={16} /></button></div><aside className="applications-preparation"><span className="applications-kicker">TRƯỚC KHI GỬI HỒ SƠ</span><h3>Chuẩn bị một chút,<br />tự tin hơn một bước.</h3><p><Check size={16} />Cập nhật CV mới nhất</p><p><Check size={16} />Bổ sung kỹ năng chuyên môn</p><p><Check size={16} />Kiểm tra thông tin liên hệ</p><button className="applications-link" onClick={() => setActivePage('candidate-profile')}>Cập nhật CV & kỹ năng <ArrowRight size={15} /></button></aside></div> : <>
    <div className="applications-toolbar"><label className="applications-search"><Search size={17} /><input aria-label="Tìm đơn ứng tuyển" placeholder="Tìm vị trí hoặc công ty…" value={search} onChange={event => setSearch(event.target.value)} /></label><select aria-label="Lọc trạng thái" value={status} onChange={event => setStatus(event.target.value)}><option value="All">Tất cả trạng thái</option>{stages.map(stage => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select><select aria-label="Sắp xếp đơn" value={sort} onChange={event => setSort(event.target.value)}><option value="updated">Cập nhật gần nhất</option><option value="applied">Ngày nộp mới nhất</option><option value="company">Tên công ty A–Z</option></select></div><div className="applications-result-info"><span>Hiển thị {filtered.length} / {ownApps.length} đơn</span>{(search || status !== 'All') && <button onClick={reset}>Xóa bộ lọc <X size={13} /></button>}{view === 'board' && <div className="applications-board-arrows"><button aria-label="Cuộn bảng sang trái" onClick={() => boardRef.current?.scrollBy({ left: -290, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}><ChevronLeft size={17} /></button><button aria-label="Cuộn bảng sang phải" onClick={() => boardRef.current?.scrollBy({ left: 290, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })}><ChevronRight size={17} /></button></div>}</div>
    {filtered.length === 0 ? <div className="applications-no-results"><Search size={25} /><h3>Chưa tìm thấy đơn phù hợp</h3><p>Thử tên công ty khác hoặc bỏ lọc trạng thái.</p><button className="applications-link" onClick={reset}>Xem tất cả đơn <ArrowRight size={15} /></button></div> : view === 'list' ? <div className="applications-list">{filtered.map(app => <button key={app.id} className="applications-row" onClick={() => setDetailId(app.id)}><span className="applications-company-mark">{app.companyName.charAt(0)}</span><span className="applications-row-title"><strong>{app.jobTitle}</strong><small>{app.companyName}</small></span><Status status={app.status} /><span className="applications-row-date"><small>Ngày nộp</small>{app.appliedDate || 'Chưa có ngày'}</span><ChevronRight size={17} /></button>)}</div> : <div className="applications-board" ref={boardRef} tabIndex={0} aria-label="Bảng trạng thái đơn ứng tuyển">{stages.filter(stage => status === 'All' || status === stage.value).map(stage => <section className={`applications-column tone-${stage.color}`} key={stage.value}><h3><i />{stage.label}<span>{filtered.filter(app => app.status === stage.value).length}</span></h3>{filtered.filter(app => app.status === stage.value).map(app => <button className="applications-board-card" key={app.id} onClick={() => setDetailId(app.id)}><span className="applications-company-mark">{app.companyName.charAt(0)}</span><strong>{app.jobTitle}</strong><p>{app.companyName}</p><footer><span>{app.appliedDate || 'Chưa có ngày'}</span><ArrowRight size={14} /></footer></button>)}{!filtered.some(app => app.status === stage.value) && <p className="applications-column-empty">Chưa có hồ sơ ở giai đoạn này</p>}</section>)}</div>}
    </>}
    <div className="applications-guide"><FileText size={17} /><p>Nhà tuyển dụng cập nhật trạng thái hồ sơ. Kết quả có thể là nhận offer hoặc chưa phù hợp, tùy từng quy trình tuyển dụng.</p></div></section>
    {detail && <Modal isOpen onClose={() => setDetailId(null)} title="Chi tiết đơn ứng tuyển"><div className="applications-detail"><Status status={detail.status} /><h2>{detail.jobTitle}</h2><p>{detail.companyName}</p><dl><div><dt>Ngày nộp hồ sơ</dt><dd>{detail.appliedDate || 'Chưa có thông tin'}</dd></div><div><dt>Cập nhật gần nhất</dt><dd>{detail.lastUpdate || detail.appliedDate || 'Chưa có thông tin'}</dd></div><div><dt>CV đã gửi</dt><dd>{detail.cvFileName || 'Chưa có thông tin tệp đính kèm'}</dd></div></dl>{detail.status === 'Phỏng vấn' && <section><h3>Thông tin phỏng vấn</h3>{interviewInfo(detail)}</section>}{detail.coverLetter && <section><h3>Thư giới thiệu</h3><p className="applications-letter">{detail.coverLetter}</p></section>}<div className="applications-detail-actions">{detail.jobAvailable && <button className="applications-primary" onClick={() => openJob(detail)}>Xem tin tuyển dụng <ArrowRight size={15} /></button>}<button className="applications-secondary" onClick={() => setDetailId(null)}>Đóng</button></div></div></Modal>}
  </div>;
}

