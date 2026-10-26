import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ArrowRight, ArrowUpRight, Sun, Moon } from 'lucide-react';
import { CinematicHero } from './CinematicHero';
import { BrandLogo } from '../common/BrandLogo';
import './HomePage.css';

export function HomePage() {
  const { setActivePage, jobs, setSelectedJobId, setGlobalSearchQuery } = useApp();
  const [activeCategory, setActiveCategory] = useState('Tất cả');
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('careerfit_home_theme') === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const changeTheme = (nextTheme) => {
    setTheme(nextTheme);
    try {
      localStorage.setItem('careerfit_home_theme', nextTheme);
    } catch {
      // Switching themes still works when browser storage is unavailable.
    }
  };

  // 4 Featured Jobs matching the design spec
  const featuredJobs = [
    {
      id: 'job-1',
      title: 'Backend Developer (Golang / Java)',
      badge: 'Fresher / Junior',
      badgeColor: 'bg-blue-50 text-blue-600 border-blue-200',
      company: 'FPT Software',
      location: 'Hà Nội (Cầu Giấy)',
      salary: '12 - 18 triệu VNĐ',
      tags: ['Golang', 'PostgreSQL', 'Docker'],
      postedTime: '2h trước',
      category: 'Backend'
    },
    {
      id: 'job-2',
      title: 'Frontend Engineer (React / Next.js)',
      badge: 'Junior',
      badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      company: 'VNG Corporation',
      location: 'TP. Hồ Chí Minh (Q7)',
      salary: '15 - 22 triệu VNĐ',
      tags: ['React', 'TypeScript', 'TailwindCSS'],
      postedTime: 'Hôm qua',
      category: 'Frontend'
    },
    {
      id: 'job-3',
      title: 'QA / Automation Engineer',
      badge: 'Fresher / Junior',
      badgeColor: 'bg-sky-50 text-sky-600 border-sky-200',
      company: 'CMC Global',
      location: 'Đà Nẵng & Remote',
      salary: '10 - 16 triệu VNĐ',
      tags: ['Selenium', 'Python', 'Postman'],
      postedTime: '2 ngày trước',
      category: 'QA'
    },
    {
      id: 'job-4',
      title: 'Node.js API Engineer',
      badge: 'Junior',
      badgeColor: 'bg-purple-50 text-purple-600 border-purple-200',
      company: 'KMS Technology',
      location: 'TP. Hồ Chí Minh',
      salary: '14 - 20 triệu VNĐ',
      tags: ['Node.js', 'NestJS', 'MongoDB'],
      postedTime: '3 ngày trước',
      category: 'Backend'
    }
  ];

  const filteredJobs = featuredJobs.filter((job) => {
    if (activeCategory === 'Tất cả') return true;
    return job.category === activeCategory;
  });

  const handleSearchSubmit = (keyword, location) => {
    setGlobalSearchQuery(keyword);
    setActivePage('job-search', { query: { keyword, location } });
  };

  const handleJobClick = (jobItem) => {
    // If job exists in DB, use its id; otherwise fallback to first job
    const matched = jobs?.find(j => j.title.toLowerCase().includes(jobItem.category.toLowerCase())) || jobs?.[0];
    if (matched) {
      setSelectedJobId(matched.id);
    }
    setActivePage('job-detail');
  };

  return (
    <div className="getting-started-page">
      <CinematicHero onBegin={() => setActivePage('login')} onSearch={handleSearchSubmit} />

      <div className="getting-started-body" data-theme={theme}>
        <div className="getting-started-container getting-started-theme-bar">
          <span>Giao diện</span>
          <div className="getting-started-theme-control" role="group" aria-label="Chọn giao diện">
            <button type="button" onClick={() => changeTheme('light')} aria-label="Giao diện sáng" aria-pressed={theme === 'light'} title="Giao diện sáng">
              <Sun size={18} aria-hidden="true" />
            </button>
            <button type="button" onClick={() => changeTheme('dark')} aria-label="Giao diện tối" aria-pressed={theme === 'dark'} title="Giao diện tối">
              <Moon size={18} aria-hidden="true" />
            </button>
          </div>
        </div>
        <section className="getting-started-values" aria-label="Lợi ích của CareerFit">
          <div className="getting-started-container getting-started-values-grid">
            <div>
              <h3>1,000+ Việc làm IT</h3>
              <p>Cập nhật liên tục từ các team công nghệ, không tin ảo, không spam.</p>
            </div>
            <div>
              <h3>Xác minh doanh nghiệp</h3>
              <p>100% công ty được thẩm định thông tin pháp lý và văn hóa kỹ thuật trước khi đăng bài.</p>
            </div>
            <div>
              <h3>Minh bạch JD & Lương</h3>
              <p>Công khai dải lương, công nghệ cốt lõi và lộ trình phỏng vấn chuẩn hóa.</p>
            </div>
          </div>
        </section>

        <section id="careerfit-opportunities" className="getting-started-jobs getting-started-container" aria-labelledby="getting-started-jobs-heading">
          <div className="getting-started-section-heading">
            <div>
              <h2 id="getting-started-jobs-heading">Việc làm mới nhất</h2>
              <p>Vị trí kỹ thuật được tuyển trực tiếp từ nhà phát triển</p>
            </div>
            <nav className="getting-started-categories" aria-label="Nhóm việc làm">
              {['Tất cả', 'Backend', 'Frontend', 'QA'].map((category) => (
                <button key={category} type="button" onClick={() => setActiveCategory(category)} aria-pressed={activeCategory === category}>
                  {category}
                </button>
              ))}
            </nav>
          </div>

          <div className="getting-started-job-list">
            {filteredJobs.map((job) => (
              <article key={job.id} className="getting-started-job">
                <div className="getting-started-job-content">
                  <div className="getting-started-job-title">
                    <h3>{job.title}</h3>
                    <span className="getting-started-job-badge">{job.badge}</span>
                  </div>
                  <p className="getting-started-job-details">
                    <span>{job.company}</span><span aria-hidden="true">•</span>
                    <span>{job.location}</span><span aria-hidden="true">•</span>
                    <strong>{job.salary}</strong>
                  </p>
                  <div className="getting-started-job-tags">
                    {job.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                </div>
                <div className="getting-started-job-actions">
                  <span>{job.postedTime}</span>
                  <button type="button" onClick={() => handleJobClick(job)}>
                    Xem chi tiết <ArrowUpRight size={16} aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="getting-started-jobs-more">
            <button type="button" onClick={() => setActivePage('job-search')} className="getting-started-outline">
              Xem tất cả 1,000+ vị trí đang tuyển <ArrowRight size={18} aria-hidden="true" />
            </button>
          </div>
        </section>

        <footer className="getting-started-footer">
          <div className="getting-started-container getting-started-footer-inner">
            <div className="getting-started-footer-brand"><BrandLogo /><span>/</span><span>Hệ thống tuyển dụng IT minh bạch</span></div>
            <div className="getting-started-footer-links">
              <button type="button" onClick={() => {}}>Quy định bảo mật</button>
              <button type="button" onClick={() => {}}>Điều khoản sử dụng</button>
              <span>Dành cho nhà tuyển dụng</span>
            </div>
            <span>© 2025 CareerFit</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
