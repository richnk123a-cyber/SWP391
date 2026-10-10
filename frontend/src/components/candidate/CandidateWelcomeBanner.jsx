import React from 'react';
import { ArrowUpRight, ArrowRight, BriefcaseBusiness } from 'lucide-react';
import './CandidateDashboard.css';

// Alternative light banner retained for future use; the dashboard uses CandidateCareerBanner.
export function CandidateWelcomeBanner({ name, profile, skills, recommended, setActivePage }) {
  const firstName = name.trim().split(/\s+/).at(-1);
  return (
    <section className="overview-welcome" aria-label="Lời chào và hành động tiếp theo">
      <div className="welcome-copy"><span className="welcome-kicker">Chào {firstName}, rất vui khi bạn quay lại</span><h2>Sẵn sàng cho bước tiến mới?</h2><p>{recommended.length ? `Có ${recommended.length} công việc được đề xuất từ những kỹ năng của bạn.` : 'Cập nhật hồ sơ để khám phá những cơ hội phù hợp với bạn.'}</p><div className="welcome-actions"><button className="overview-button primary" onClick={() => setActivePage('job-search')}>Khám phá việc làm <ArrowUpRight size={17} /></button><button className="welcome-secondary" onClick={() => setActivePage('candidate-profile')}>Xem hồ sơ của tôi <ArrowRight size={16} /></button></div></div>
      <div className="welcome-focus"><span className="welcome-focus-label">MỤC TIÊU NGHỀ NGHIỆP</span><BriefcaseBusiness size={25} strokeWidth={1.5} /><h3>{profile.preferences?.desiredRole || 'Chọn vị trí bạn hướng tới'}</h3><p>{skills.length} kỹ năng trong hồ sơ</p><div className="welcome-skill-list">{skills.slice(0, 3).map(skill => <span key={skill}>{skill}</span>)}{skills.length > 3 && <span>+{skills.length - 3}</span>}</div></div>
    </section>
  );
}
