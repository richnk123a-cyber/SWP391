import React from 'react';
import { useDesignInteractions } from './useDesignInteractions';
import './CareerFitJobs.css';

// Converted from the original design; sample content is preserved for preview.
export function CareerFitJobs() {
  const designRef = useDesignInteractions('jobs');
  return (
    <div ref={designRef} className="careerfit-design--jobs">


  <header className="site-header">
    <div className="container">
      <div className="site-header__inner">
        <a href="/" className="site-header__logo">Career<span>Fit</span></a>
        <nav className="site-header__nav" aria-label="Điều hướng chính">
          <a href="/">Trang chủ</a>
          <a href="/jobs" className="is-active">Việc làm IT</a>
          <a href="#">Lộ trình học</a>
          <a href="#">Blog</a>
        </nav>
        <div className="site-header__actions">
          <a href="#" className="btn btn--ghost">Đăng nhập</a>
          <a href="#" className="btn btn--primary">Tạo hồ sơ miễn phí</a>
        </div>
      </div>
    </div>
  </header>

  <main>

    {/* SEARCH HERO */}
    <section className="jobs-hero" aria-labelledby="jobs-hero-title">
      <div className="container">
        <h1 className="jobs-hero__title" id="jobs-hero-title">Tìm việc làm IT phù hợp với bạn</h1>
        <p className="jobs-hero__desc">Kết quả được sắp xếp theo mức độ phù hợp với hồ sơ kỹ năng của bạn.</p>
        <div className="search-bar" role="search">
          <label htmlFor="search-keyword" className="visually-hidden">Tên vị trí hoặc kỹ năng</label>
          <input
            className="search-bar__input"
            id="search-keyword"
            type="search"
            placeholder="Tên vị trí, kỹ năng (VD: ReactJS, Java...)"
            autoComplete="off" />
          <div className="search-bar__divider" aria-hidden="true"></div>
          <label htmlFor="search-location" className="visually-hidden">Địa điểm</label>
          <select className="search-bar__select" id="search-location">
            <option value="">Tất cả địa điểm</option>
            <option value="hcm">TP. Hồ Chí Minh</option>
            <option value="hn">Hà Nội</option>
            <option value="dn">Đà Nẵng</option>
            <option value="remote">Remote</option>
          </select>
          <button className="search-bar__btn" type="button" aria-label="Tìm kiếm">
            <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            Tìm kiếm
          </button>
        </div>
      </div>
    </section>

    {/* JOBS LAYOUT */}
    <div className="container">

      {/* TOP MATCH BANNER (only shown when user has CV / match data) */}
      {/* Hidden by default (no login); remove hidden attr when logged in */}
      <div className="top-match-banner" hidden aria-label="Vị trí phù hợp nhất hôm nay">
        <div className="top-match-banner__left">
          <p className="top-match-banner__label">Phù hợp nhất với hồ sơ của bạn hôm nay</p>
          <p className="top-match-banner__role">Senior Frontend Engineer (ReactJS)</p>
          <p className="top-match-banner__company">Tiki Corporation &mdash; TP. Hồ Chí Minh &mdash; 78% phù hợp</p>
        </div>
        <a href="#" className="btn btn--ghost btn--md">Xem vị trí hàng đầu</a>
      </div>

      <div className="jobs-layout">

        {/* FILTER SIDEBAR */}
        <aside className="filter-sidebar" aria-label="Bộ lọc tìm kiếm">
          <div className="filter-sidebar__topbar">
            <p className="filter-sidebar__heading">Bộ lọc</p>
            <button className="filter-sidebar__clear" type="button" id="clear-filters">Xóa tất cả</button>
          </div>

          <div className="filter-group">
            <p className="filter-group__title" id="filter-type-label">Hình thức làm việc</p>
            <ul className="filter-list" role="group" aria-labelledby="filter-type-label">
              <li>
                <label className="filter-item">
                  <input type="checkbox" name="type" value="fulltime" />
                  <span className="filter-item__label">Toàn thời gian</span>
                  <span className="filter-item__count">42</span>
                </label>
              </li>
              <li>
                <label className="filter-item">
                  <input type="checkbox" name="type" value="parttime" />
                  <span className="filter-item__label">Part-time</span>
                  <span className="filter-item__count">15</span>
                </label>
              </li>
              <li>
                <label className="filter-item">
                  <input type="checkbox" name="type" value="intern" />
                  <span className="filter-item__label">Intern / Thực tập</span>
                  <span className="filter-item__count">28</span>
                </label>
              </li>
              <li>
                <label className="filter-item">
                  <input type="checkbox" name="type" value="remote" />
                  <span className="filter-item__label">Remote</span>
                  <span className="filter-item__count">19</span>
                </label>
              </li>
            </ul>
          </div>

          <div className="filter-group">
            <p className="filter-group__title" id="filter-field-label">Lĩnh vực</p>
            <label className="visually-hidden" htmlFor="filter-field-select">Chọn lĩnh vực</label>
            <select className="filter-select" id="filter-field-select" aria-labelledby="filter-field-label">
              <option value="">Tất cả lĩnh vực</option>
              <option value="frontend">Frontend Development</option>
              <option value="backend">Backend Development</option>
              <option value="fullstack">Full-stack Development</option>
              <option value="mobile">Mobile (iOS / Android)</option>
              <option value="data">Data / Analytics</option>
              <option value="devops">DevOps / Cloud</option>
              <option value="design">UI/UX Design</option>
              <option value="qa">QA / Testing</option>
            </select>
          </div>

          <div className="filter-group">
            <p className="filter-group__title" id="filter-salary-label">Mức lương</p>
            <ul className="filter-list" role="group" aria-labelledby="filter-salary-label">
              <li>
                <label className="filter-item">
                  <input type="radio" name="salary" value="any" />
                  <span className="filter-item__label">Bất kỳ</span>
                </label>
              </li>
              <li>
                <label className="filter-item">
                  <input type="radio" name="salary" value="0-5m" />
                  <span className="filter-item__label">Dưới 5 triệu</span>
                </label>
              </li>
              <li>
                <label className="filter-item">
                  <input type="radio" name="salary" value="5-10m" />
                  <span className="filter-item__label">5 – 10 triệu</span>
                </label>
              </li>
              <li>
                <label className="filter-item">
                  <input type="radio" name="salary" value="10-20m" />
                  <span className="filter-item__label">10 – 20 triệu</span>
                </label>
              </li>
              <li>
                <label className="filter-item">
                  <input type="radio" name="salary" value="20m+" />
                  <span className="filter-item__label">Trên 20 triệu</span>
                </label>
              </li>
            </ul>
          </div>

          <div className="filter-group">
            <p className="filter-group__title">Địa điểm</p>
            <label className="visually-hidden" htmlFor="filter-location-select">Chọn địa điểm</label>
            <select className="filter-select" id="filter-location-select">
              <option value="">Tất cả địa điểm</option>
              <option value="hcm">TP. Hồ Chí Minh</option>
              <option value="hn">Hà Nội</option>
              <option value="dn">Đà Nẵng</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          <div className="filter-group">
            <p className="filter-group__title">Kỹ năng yêu cầu</p>
            <div className="filter-skill-tags" role="group" aria-label="Lọc theo kỹ năng">
              <button className="tag tag--active" type="button" aria-pressed="true">ReactJS</button>
              <button className="tag" type="button" aria-pressed="false">TypeScript</button>
              <button className="tag" type="button" aria-pressed="false">Java</button>
              <button className="tag" type="button" aria-pressed="false">Python</button>
              <button className="tag" type="button" aria-pressed="false">Node.js</button>
              <button className="tag" type="button" aria-pressed="false">SQL</button>
              <button className="tag" type="button" aria-pressed="false">Docker</button>
              <button className="tag" type="button" aria-pressed="false">AWS</button>
              <button className="tag" type="button" aria-pressed="false">Figma</button>
              <button className="tag" type="button" aria-pressed="false">Flutter</button>
            </div>
          </div>

        </aside>

        {/* JOB LIST */}
        <div className="jobs-main">

          {/* Mobile filter toggle */}
          <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "var(--space-2)", "marginBottom": "var(--space-3)" }}>
            <button className="filter-toggle-btn" type="button" id="open-filter" aria-expanded="false" aria-controls="filter-drawer">
              <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M3 6h18M7 12h10M11 18h2"/>
              </svg>
              Bộ lọc
            </button>
            {/* results bar always visible */}
            <div className="results-bar" style={{ "flex": "1", "marginBottom": "0" }}>
              <p className="results-bar__count"><strong>7</strong> vị trí phù hợp</p>
              <div className="results-bar__sort-wrap">
                <span className="results-bar__sort-label">Sắp xếp:</span>
                <label className="visually-hidden" htmlFor="sort-select">Cách sắp xếp</label>
                <select className="results-bar__sort" id="sort-select">
                  <option value="match">Phù hợp nhất</option>
                  <option value="newest">Mới nhất</option>
                  <option value="salary-desc">Lương cao nhất</option>
                  <option value="deadline">Hết hạn sớm</option>
                </select>
              </div>
            </div>
          </div>

          <div className="job-list" role="list">

            {/* Card 1: Verified, no login */}
            <article className="job-card job-card--horizontal" role="listitem">
              <div className="job-card__logo job-card__logo--teal" aria-hidden="true">TK</div>
              <div className="job-card__body">
                <div className="job-card__title-row">
                  <h2 className="job-card__title">Frontend Developer (ReactJS)</h2>
                  <span className="badge-verified" aria-label="Doanh nghiệp đã xác minh">
                    <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/></svg>
                    Đã xác minh
                  </span>
                </div>
                <div className="job-card__inline-meta">
                  <span>Tiki Corporation</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>TP. Hồ Chí Minh</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Toàn thời gian</span>
                </div>
                <p className="job-card__salary">12 – 18 triệu / tháng</p>
                <div className="job-card__tags">
                  <span className="tag">ReactJS</span>
                  <span className="tag">TypeScript</span>
                  <span className="tag">REST API</span>
                  <span className="tag">Git</span>
                  <span className="tag">Agile</span>
                </div>
                <div className="job-card__match-row">
                  <a href="#" className="job-card__login-link">Đăng nhập để xem độ phù hợp</a>
                </div>
                <p className="job-card__deadline">Hạn nộp: còn 14 ngày</p>
                <div className="job-card__actions">
                  <a href="#" className="job-card__why-link">Vì sao bạn phù hợp?</a>
                  <div className="job-card__action-btns">
                    <button className="btn-bookmark" type="button" aria-label="Lưu việc làm">
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                      </svg>
                    </button>
                    <a href="#" className="btn btn--primary btn--md">Xem chi tiết</a>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 2: Verified, logged in with match % */}
            <article className="job-card job-card--horizontal" role="listitem">
              <div className="job-card__logo job-card__logo--amber" aria-hidden="true">VN</div>
              <div className="job-card__body">
                <div className="job-card__title-row">
                  <h2 className="job-card__title">Backend Developer Intern (Java)</h2>
                  <span className="badge-verified" aria-label="Doanh nghiệp đã xác minh">
                    <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/></svg>
                    Đã xác minh
                  </span>
                </div>
                <div className="job-card__inline-meta">
                  <span>VNG Corporation</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>TP. Hồ Chí Minh</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Intern</span>
                </div>
                <p className="job-card__salary">5 – 8 triệu / tháng</p>
                <div className="job-card__tags">
                  <span className="tag">Java</span>
                  <span className="tag">Spring Boot</span>
                  <span className="tag">MySQL</span>
                  <span className="tag">Docker</span>
                  <span className="tag">REST API</span>
                </div>
                <div className="job-card__match-row" aria-label="78% phù hợp với hồ sơ của bạn">
                  <span className="job-card__match-pct">78% phù hợp</span>
                  <div className="match-bar job-card__match-bar" role="presentation">
                    <div className="match-bar__fill" style={{ "width": "78%" }}></div>
                  </div>
                </div>
                <p className="job-card__deadline">Hạn nộp: còn 21 ngày</p>
                <div className="job-card__actions">
                  <a href="#" className="job-card__why-link">Vì sao bạn phù hợp?</a>
                  <div className="job-card__action-btns">
                    <button className="btn-bookmark" type="button" aria-label="Lưu việc làm">
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                      </svg>
                    </button>
                    <a href="#" className="btn btn--primary btn--md">Xem chi tiết</a>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 3: Not verified (no badge shown) */}
            <article className="job-card job-card--horizontal" role="listitem">
              <div className="job-card__logo job-card__logo--slate" aria-hidden="true">SP</div>
              <div className="job-card__body">
                <div className="job-card__title-row">
                  <h2 className="job-card__title">Data Analyst (Junior)</h2>
                </div>
                <div className="job-card__inline-meta">
                  <span>Shopee Vietnam</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Hà Nội</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Part-time</span>
                </div>
                <p className="job-card__salary">10 – 15 triệu / tháng</p>
                <div className="job-card__tags">
                  <span className="tag">Python</span>
                  <span className="tag">SQL</span>
                  <span className="tag">Power BI</span>
                  <span className="tag">Excel</span>
                  <span className="tag">Statistics</span>
                </div>
                <div className="job-card__match-row">
                  <a href="#" className="job-card__login-link">Đăng nhập để xem độ phù hợp</a>
                </div>
                <p className="job-card__deadline">Hạn nộp: còn 7 ngày</p>
                <div className="job-card__actions">
                  <a href="#" className="job-card__why-link">Vì sao bạn phù hợp?</a>
                  <div className="job-card__action-btns">
                    <button className="btn-bookmark" type="button" aria-label="Lưu việc làm">
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                      </svg>
                    </button>
                    <a href="#" className="btn btn--primary btn--md">Xem chi tiết</a>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 4: Pending review */}
            <article className="job-card job-card--horizontal" role="listitem" aria-label="Chờ kiểm duyệt">
              <div className="job-card__logo job-card__logo--rose" aria-hidden="true">MB</div>
              <div className="job-card__body">
                <div style={{ "marginBottom": "6px" }}>
                  <span className="badge-pending">Chờ kiểm duyệt</span>
                </div>
                <div className="job-card__title-row">
                  <h2 className="job-card__title">Mobile Developer (Flutter)</h2>
                </div>
                <div className="job-card__inline-meta">
                  <span>MoMo E-Wallet</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>TP. Hồ Chí Minh</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Toàn thời gian</span>
                </div>
                <p className="job-card__salary">15 – 22 triệu / tháng</p>
                <div className="job-card__tags">
                  <span className="tag">Flutter</span>
                  <span className="tag">Dart</span>
                  <span className="tag">Firebase</span>
                  <span className="tag">REST API</span>
                </div>
                <div className="job-card__match-row">
                  <a href="#" className="job-card__login-link">Đăng nhập để xem độ phù hợp</a>
                </div>
                <p className="job-card__deadline">Hạn nộp: còn 30 ngày</p>
                <div className="job-card__actions">
                  <a href="#" className="job-card__why-link">Vì sao bạn phù hợp?</a>
                  <div className="job-card__action-btns">
                    <button className="btn-bookmark" type="button" aria-label="Lưu việc làm">
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                      </svg>
                    </button>
                    <a href="#" className="btn btn--primary btn--md">Xem chi tiết</a>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 5: Verified, logged in */}
            <article className="job-card job-card--horizontal" role="listitem">
              <div className="job-card__logo job-card__logo--sage" aria-hidden="true">FP</div>
              <div className="job-card__body">
                <div className="job-card__title-row">
                  <h2 className="job-card__title">DevOps Engineer (Junior)</h2>
                  <span className="badge-verified" aria-label="Doanh nghiệp đã xác minh">
                    <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/></svg>
                    Đã xác minh
                  </span>
                </div>
                <div className="job-card__inline-meta">
                  <span>FPT Software</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Đà Nẵng</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Toàn thời gian</span>
                </div>
                <p className="job-card__salary">14 – 20 triệu / tháng</p>
                <div className="job-card__tags">
                  <span className="tag">Docker</span>
                  <span className="tag">Kubernetes</span>
                  <span className="tag">AWS</span>
                  <span className="tag">Linux</span>
                  <span className="tag">CI/CD</span>
                </div>
                <div className="job-card__match-row" aria-label="55% phù hợp với hồ sơ của bạn">
                  <span className="job-card__match-pct">55% phù hợp</span>
                  <div className="match-bar job-card__match-bar" role="presentation">
                    <div className="match-bar__fill" style={{ "width": "55%" }}></div>
                  </div>
                </div>
                <p className="job-card__deadline">Hạn nộp: còn 18 ngày</p>
                <div className="job-card__actions">
                  <a href="#" className="job-card__why-link">Vì sao bạn phù hợp?</a>
                  <div className="job-card__action-btns">
                    <button className="btn-bookmark" type="button" aria-label="Lưu việc làm">
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                      </svg>
                    </button>
                    <a href="#" className="btn btn--primary btn--md">Xem chi tiết</a>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 6: Not verified */}
            <article className="job-card job-card--horizontal" role="listitem">
              <div className="job-card__logo job-card__logo--slate" aria-hidden="true">NV</div>
              <div className="job-card__body">
                <div className="job-card__title-row">
                  <h2 className="job-card__title">UI/UX Designer (Fresher)</h2>
                </div>
                <div className="job-card__inline-meta">
                  <span>NaviSoft Vietnam</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Remote</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Part-time</span>
                </div>
                <p className="job-card__salary">8 – 13 triệu / tháng</p>
                <div className="job-card__tags">
                  <span className="tag">Figma</span>
                  <span className="tag">Prototyping</span>
                  <span className="tag">User Research</span>
                  <span className="tag">Design System</span>
                </div>
                <div className="job-card__match-row">
                  <a href="#" className="job-card__login-link">Đăng nhập để xem độ phù hợp</a>
                </div>
                <p className="job-card__deadline">Hạn nộp: còn 10 ngày</p>
                <div className="job-card__actions">
                  <a href="#" className="job-card__why-link">Vì sao bạn phù hợp?</a>
                  <div className="job-card__action-btns">
                    <button className="btn-bookmark" type="button" aria-label="Lưu việc làm">
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                      </svg>
                    </button>
                    <a href="#" className="btn btn--primary btn--md">Xem chi tiết</a>
                  </div>
                </div>
              </div>
            </article>

            {/* Card 7: Verified, logged in */}
            <article className="job-card job-card--horizontal" role="listitem">
              <div className="job-card__logo job-card__logo--teal" aria-hidden="true">ZL</div>
              <div className="job-card__body">
                <div className="job-card__title-row">
                  <h2 className="job-card__title">Full-stack Developer (Node.js + ReactJS)</h2>
                  <span className="badge-verified" aria-label="Doanh nghiệp đã xác minh">
                    <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 12l2 2 4-4M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/></svg>
                    Đã xác minh
                  </span>
                </div>
                <div className="job-card__inline-meta">
                  <span>Zalo / VNG</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>TP. Hồ Chí Minh</span>
                  <span className="sep" aria-hidden="true">·</span>
                  <span>Toàn thời gian</span>
                </div>
                <p className="job-card__salary">18 – 30 triệu / tháng</p>
                <div className="job-card__tags">
                  <span className="tag">Node.js</span>
                  <span className="tag">ReactJS</span>
                  <span className="tag">PostgreSQL</span>
                  <span className="tag">Redis</span>
                  <span className="tag">Docker</span>
                </div>
                <div className="job-card__match-row" aria-label="65% phù hợp với hồ sơ của bạn">
                  <span className="job-card__match-pct">65% phù hợp</span>
                  <div className="match-bar job-card__match-bar" role="presentation">
                    <div className="match-bar__fill" style={{ "width": "65%" }}></div>
                  </div>
                </div>
                <p className="job-card__deadline">Hạn nộp: còn 25 ngày</p>
                <div className="job-card__actions">
                  <a href="#" className="job-card__why-link">Vì sao bạn phù hợp?</a>
                  <div className="job-card__action-btns">
                    <button className="btn-bookmark" type="button" aria-label="Lưu việc làm">
                      <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z"/>
                      </svg>
                    </button>
                    <a href="#" className="btn btn--primary btn--md">Xem chi tiết</a>
                  </div>
                </div>
              </div>
            </article>

          </div>
        </div>

      </div>
    </div>

    {/* MOBILE FILTER DRAWER */}
    <div className="filter-drawer-overlay" id="filter-overlay" aria-hidden="true"></div>
    <aside className="filter-drawer" id="filter-drawer" aria-label="Bộ lọc tìm kiếm" aria-modal="true" role="dialog">
      <div className="filter-drawer__close">
        <p className="filter-drawer__close-title">Bộ lọc</p>
        <button className="filter-drawer__close-btn" type="button" id="close-filter" aria-label="Đóng bộ lọc">
          <svg className="icon" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Duplicate filter content for drawer */}
      <div className="filter-group">
        <p className="filter-group__title">Hình thức làm việc</p>
        <ul className="filter-list">
          <li><label className="filter-item"><input type="checkbox" name="dtype" value="fulltime" /><span className="filter-item__label">Toàn thời gian</span><span className="filter-item__count">42</span></label></li>
          <li><label className="filter-item"><input type="checkbox" name="dtype" value="parttime" /><span className="filter-item__label">Part-time</span><span className="filter-item__count">15</span></label></li>
          <li><label className="filter-item"><input type="checkbox" name="dtype" value="intern" /><span className="filter-item__label">Intern / Thực tập</span><span className="filter-item__count">28</span></label></li>
          <li><label className="filter-item"><input type="checkbox" name="dtype" value="remote" /><span className="filter-item__label">Remote</span><span className="filter-item__count">19</span></label></li>
        </ul>
      </div>
      <div className="filter-group">
        <p className="filter-group__title">Mức lương</p>
        <ul className="filter-list">
          <li><label className="filter-item"><input type="radio" name="dsalary" value="any" /><span className="filter-item__label">Bất kỳ</span></label></li>
          <li><label className="filter-item"><input type="radio" name="dsalary" value="5-10m" /><span className="filter-item__label">5 – 10 triệu</span></label></li>
          <li><label className="filter-item"><input type="radio" name="dsalary" value="10-20m" /><span className="filter-item__label">10 – 20 triệu</span></label></li>
          <li><label className="filter-item"><input type="radio" name="dsalary" value="20m+" /><span className="filter-item__label">Trên 20 triệu</span></label></li>
        </ul>
      </div>
      <div style={{ "paddingTop": "var(--space-3)" }}>
        <button className="btn btn--primary" type="button" style={{ "width": "100%" }} id="apply-filter-drawer">Áp dụng bộ lọc</button>
      </div>
    </aside>

  </main>

  <footer className="site-footer">
    <div className="container">
      <div className="site-footer__inner">
        <div>
          <p className="site-footer__brand-name">Career<span>Fit</span></p>
          <p className="site-footer__brand-desc">Nền tảng gợi ý việc làm IT dành cho sinh viên và fresher Việt Nam. Phân tích kỹ năng thực tế, kết nối đúng cơ hội.</p>
        </div>
        <div>
          <p className="site-footer__col-title">Sản phẩm</p>
          <ul className="site-footer__links">
            <li><a href="/jobs">Tìm việc làm</a></li>
            <li><a href="#">Hồ sơ kỹ năng</a></li>
            <li><a href="#">Báo cáo kỹ năng</a></li>
            <li><a href="#">Lộ trình học tập</a></li>
          </ul>
        </div>
        <div>
          <p className="site-footer__col-title">Dành cho</p>
          <ul className="site-footer__links">
            <li><a href="#">Sinh viên</a></li>
            <li><a href="#">Fresher</a></li>
            <li><a href="#">Nhà tuyển dụng</a></li>
          </ul>
        </div>
        <div>
          <p className="site-footer__col-title">Hỗ trợ</p>
          <ul className="site-footer__links">
            <li><a href="#">Về CareerFit</a></li>
            <li><a href="#">Blog nghề nghiệp</a></li>
            <li><a href="#">Câu hỏi thường gặp</a></li>
            <li><a href="#">Liên hệ</a></li>
          </ul>
        </div>
      </div>
      <div className="site-footer__bottom">
        <p className="site-footer__copy">© 2024 CareerFit. Được xây dựng tại Việt Nam.</p>
        <div className="site-footer__legal">
          <a href="#">Chính sách bảo mật</a>
          <a href="#">Điều khoản sử dụng</a>
        </div>
      </div>
    </div>
  </footer>

  

  


    </div>
  );
}
