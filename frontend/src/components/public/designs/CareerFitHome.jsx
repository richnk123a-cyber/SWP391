import React from 'react';
import { useDesignInteractions } from './useDesignInteractions';
import './CareerFitHome.css';

// Converted from the original design; sample content is preserved for preview.
export function CareerFitHome() {
  const designRef = useDesignInteractions('home');
  return (
    <div ref={designRef} className="careerfit-design--home">


  {/* HEADER */}
  <header className="site-header">
    <div className="container">
      <div className="site-header__inner">
        <div className="site-header__left">
          <a href="/" className="brand-logo">
            <div className="brand-logo__badge">/</div>
            <span>DevCareer.io</span>
          </a>
          <nav className="nav-links">
            <a href="/jobs" className="nav-link">Việc làm</a>
            <a href="#" className="nav-link">Doanh nghiệp</a>
          </nav>
        </div>
        <div className="site-header__right">
          <a href="#" className="btn-login">Đăng nhập</a>
          <a href="#" className="btn-register">Đăng ký</a>
        </div>
      </div>
    </div>
  </header>

  {/* HERO */}
  <section className="hero">
    <div className="container">
      <div className="hero-badge">
        <span className="hero-badge__dot"></span>
        <span>Hệ thống đối chiếu kỹ năng thực tế</span>
      </div>

      <h1 className="hero__title">
        Tìm việc IT theo đúng năng lực<br />của bạn
      </h1>

      <p className="hero__subtitle">
        Đối chiếu kỹ năng với yêu cầu tuyển dụng thực tế, biết rõ tỷ lệ đáp ứng trước khi nộp CV.
      </p>

      <div className="search-box-wrap">
        <div className="search-box">
          <div className="search-box__input-wrap">
            <svg className="search-box__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input type="text" className="search-box__input" placeholder="Vị trí hoặc kỹ năng: Java, React, Golang, QA..." />
          </div>

          <div className="search-box__divider"></div>

          <div className="search-box__select-wrap">
            <select className="search-box__select">
              <option value="">Toàn quốc</option>
              <option value="hn">Hà Nội</option>
              <option value="hcm">TP. Hồ Chí Minh</option>
              <option value="dn">Đà Nẵng</option>
              <option value="remote">Remote</option>
            </select>
            <svg className="search-box__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 12 15 18 9"></polyline>
            </svg>
          </div>

          <button className="search-box__button" type="button">Tìm việc</button>
        </div>

        <p className="hero__alt-cta">
          Hoặc: <a href="#">Tải CV lên để nhận báo cáo phân tích phù hợp</a>
        </p>
      </div>
    </div>
  </section>

  {/* VALUE PROPOSITIONS */}
  <section className="value-props">
    <div className="container">
      <div className="value-props__grid">
        <div className="value-prop-item">
          <h3 className="value-prop-item__title">1,000+ Việc làm IT</h3>
          <p className="value-prop-item__desc">Cập nhật liên tục từ các team công nghệ, không tin ảo, không spam.</p>
        </div>
        <div className="value-prop-item">
          <h3 className="value-prop-item__title">Xác minh doanh nghiệp</h3>
          <p className="value-prop-item__desc">100% công ty được thẩm định thông tin pháp lý và văn hóa kỹ thuật trước khi đăng bài.</p>
        </div>
        <div className="value-prop-item">
          <h3 className="value-prop-item__title">Minh bạch JD &amp; Lương</h3>
          <p className="value-prop-item__desc">Công khai dải lương, công nghệ cốt lõi và lộ trình phỏng vấn chuẩn hóa.</p>
        </div>
      </div>
    </div>
  </section>

  {/* JOBS LIST SECTION */}
  <section className="jobs-section">
    <div className="container">
      <div className="jobs-section__header">
        <div>
          <h2 className="jobs-section__title">Việc làm mới nhất</h2>
          <p className="jobs-section__subtitle">Vị trí kỹ thuật được tuyển trực tiếp từ nhà phát triển</p>
        </div>
        <div className="category-tabs">
          <button className="category-tab is-active" type="button" data-cat="all">Tất cả</button>
          <button className="category-tab" type="button" data-cat="backend">Backend</button>
          <button className="category-tab" type="button" data-cat="frontend">Frontend</button>
          <button className="category-tab" type="button" data-cat="qa">QA</button>
        </div>
      </div>

      <div className="jobs-card">
        {/* Job 1 */}
        <article className="job-row" data-category="backend">
          <div className="job-row__left">
            <div className="job-row__title-wrap">
              <h3 className="job-row__title">Backend Developer (Golang / Java)</h3>
              <span className="job-badge job-badge--blue">Fresher / Junior</span>
            </div>
            <p className="job-row__meta">
              <span>FPT Software</span>
              <span className="dot">•</span>
              <span>Hà Nội (Cầu Giấy)</span>
              <span className="dot">•</span>
              <span className="job-row__salary">12 - 18 triệu VNĐ</span>
            </p>
            <div className="job-row__tags">
              <span className="skill-tag">Golang</span>
              <span className="skill-tag">PostgreSQL</span>
              <span className="skill-tag">Docker</span>
            </div>
          </div>
          <div className="job-row__right">
            <span className="job-row__time">2h trước</span>
            <a href="/jobs" className="btn-detail">Xem chi tiết</a>
          </div>
        </article>

        {/* Job 2 */}
        <article className="job-row" data-category="frontend">
          <div className="job-row__left">
            <div className="job-row__title-wrap">
              <h3 className="job-row__title">Frontend Engineer (React / Next.js)</h3>
              <span className="job-badge job-badge--green">Junior</span>
            </div>
            <p className="job-row__meta">
              <span>VNG Corporation</span>
              <span className="dot">•</span>
              <span>TP. Hồ Chí Minh (Q7)</span>
              <span className="dot">•</span>
              <span className="job-row__salary">15 - 22 triệu VNĐ</span>
            </p>
            <div className="job-row__tags">
              <span className="skill-tag">React</span>
              <span className="skill-tag">TypeScript</span>
              <span className="skill-tag">TailwindCSS</span>
            </div>
          </div>
          <div className="job-row__right">
            <span className="job-row__time">Hôm qua</span>
            <a href="/jobs" className="btn-detail">Xem chi tiết</a>
          </div>
        </article>

        {/* Job 3 */}
        <article className="job-row" data-category="qa">
          <div className="job-row__left">
            <div className="job-row__title-wrap">
              <h3 className="job-row__title">QA / Automation Engineer</h3>
              <span className="job-badge job-badge--blue">Fresher / Junior</span>
            </div>
            <p className="job-row__meta">
              <span>CMC Global</span>
              <span className="dot">•</span>
              <span>Đà Nẵng &amp; Remote</span>
              <span className="dot">•</span>
              <span className="job-row__salary">10 - 16 triệu VNĐ</span>
            </p>
            <div className="job-row__tags">
              <span className="skill-tag">Selenium</span>
              <span className="skill-tag">Python</span>
              <span className="skill-tag">Postman</span>
            </div>
          </div>
          <div className="job-row__right">
            <span className="job-row__time">2 ngày trước</span>
            <a href="/jobs" className="btn-detail">Xem chi tiết</a>
          </div>
        </article>

        {/* Job 4 */}
        <article className="job-row" data-category="backend">
          <div className="job-row__left">
            <div className="job-row__title-wrap">
              <h3 className="job-row__title">Node.js API Engineer</h3>
              <span className="job-badge job-badge--purple">Junior</span>
            </div>
            <p className="job-row__meta">
              <span>KMS Technology</span>
              <span className="dot">•</span>
              <span>TP. Hồ Chí Minh</span>
              <span className="dot">•</span>
              <span className="job-row__salary">14 - 20 triệu VNĐ</span>
            </p>
            <div className="job-row__tags">
              <span className="skill-tag">Node.js</span>
              <span className="skill-tag">NestJS</span>
              <span className="skill-tag">MongoDB</span>
            </div>
          </div>
          <div className="job-row__right">
            <span className="job-row__time">3 ngày trước</span>
            <a href="/jobs" className="btn-detail">Xem chi tiết</a>
          </div>
        </article>
      </div>

      <div className="jobs-footer-cta">
        <a href="/jobs" className="btn-all-jobs">
          <span>Xem tất cả 1,000+ vị trí đang tuyển</span>
          <span>&rarr;</span>
        </a>
      </div>
    </div>
  </section>

  {/* FOOTER */}
  <footer className="site-footer">
    <div className="container">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>DevCareer.io</strong>
          <span style={{ "color": "#CBD5E1" }}>/</span>
          <span>Hệ thống tuyển dụng IT minh bạch</span>
        </div>

        <div className="site-footer__links">
          <a href="#">Quy định bảo mật</a>
          <a href="#">Điều khoản sử dụng</a>
          <a href="#">Dành cho nhà tuyển dụng</a>
        </div>

        <div>
          &copy; 2025 DevCareer
        </div>
      </div>
    </div>
  </footer>

  

    </div>
  );
}
