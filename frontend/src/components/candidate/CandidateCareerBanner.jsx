import React from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import './CandidateCareerBanner.css';

const SIGNAL_SKILLS = [
  { name: 'Java', color: 'amber', position: 'top-left', x: 46.8, y: 31.5 },
  { name: 'REST API', color: 'blue', position: 'top-right', x: 180, y: 16.8 },
  { name: 'SQL', color: 'purple', position: 'middle-right', x: 313.2, y: 31.5 },
  { name: 'Git', color: 'amber', position: 'bottom-left', x: 43.2, y: 180.6 },
  { name: 'Spring Boot', color: 'green', position: 'bottom-right', x: 291.6, y: 180.6 },
];

export function CandidateCareerBanner({ name, targetRole, skills, jobCount, hasCV, onNavigate }) {
  // Retain the original banner's illustrative market-fit indicator.
  const marketFit = hasCV ? 85 : 72;
  return (
    <section className="candidate-career-banner" aria-label="CareerFit Candidate — AI Command Hub">
      <div className="career-banner-copy">
        <span className="career-banner-label"><span /> CAREERFIT CANDIDATE <span className="label-divider">·</span> AI Command Hub</span>
        <h2>{name}</h2>
        <p className="career-banner-description">{jobCount ? `${jobCount} vị trí phù hợp đang chờ bạn hôm nay.` : 'Cập nhật hồ sơ để khám phá cơ hội phù hợp với bạn.'}</p>
        <div className="career-banner-badges"><span>Target: {targetRole}</span><span className="market-fit" title="Chỉ số minh họa của banner, không phải kết quả phân tích hồ sơ">{marketFit}% Market Fit</span><span>{skills.length} kỹ năng đã đồng bộ</span></div>
        <div className="career-banner-actions"><button onClick={() => onNavigate('job-search')}>Tìm việc phù hợp <ArrowUpRight size={16} /></button><button onClick={() => onNavigate('learning-roadmap')}>Tiếp tục lộ trình <ArrowRight size={16} /></button></div>
      </div>
      <div className="career-signal-network" aria-label="Sơ đồ kỹ năng và mục tiêu nghề nghiệp">
        <svg viewBox="0 0 360 210" preserveAspectRatio="none" aria-hidden="true"><ellipse cx="180" cy="96.6" rx="68" ry="54" />{SIGNAL_SKILLS.map(skill => <line key={skill.name} x1={skill.x} y1={skill.y} x2="180" y2="96.6" className={skills.some(item => item.toLowerCase() === skill.name.toLowerCase()) ? 'signal-matched' : ''} />)}</svg>
        {SIGNAL_SKILLS.map(skill => <span key={skill.name} className={`signal-skill signal-${skill.color} signal-${skill.position}`} style={{ left: `${skill.x / 360 * 100}%`, top: `${skill.y / 210 * 100}%` }} title={skills.some(item => item.toLowerCase() === skill.name.toLowerCase()) ? 'Kỹ năng đã có trong hồ sơ' : 'Kỹ năng tham khảo cho mục tiêu nghề nghiệp'}>{skill.name}</span>)}
        <div className="signal-target"><span>TARGET ROLE</span><strong>{targetRole}</strong><small>{marketFit}% Fit</small></div>
        <div className="signal-network-footer"><span><i /> Live Career Signal Active</span><span>Khớp dữ liệu thị trường</span></div>
      </div>
    </section>
  );
}


