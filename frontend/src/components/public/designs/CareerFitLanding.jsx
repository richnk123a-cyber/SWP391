import React from 'react';
import { useDesignInteractions } from './useDesignInteractions';
import './CareerFitLanding.css';

// Converted from the original design; sample content is preserved for preview.
export function CareerFitLanding() {
  const designRef = useDesignInteractions('landing');
  return (
    <div ref={designRef} className="careerfit-design--landing">


  {/* ============================================================
       HEADER
  ============================================================ */}
  <header className="site-header">
    <div className="container">
      <div className="site-header__inner">
        <a href="/" className="site-header__logo">Career<span>Fit</span></a>
        <nav className="site-header__nav" aria-label="Điều hướng chính">
          <a href="#how-it-works">Cách hoạt động</a>
          <a href="#jobs">Việc làm</a>
          <a href="#trust">Về chúng tôi</a>
        </nav>
        <div className="site-header__actions">
          <a href="/login" className="btn btn--ghost">Đăng nhập</a>
          <a href="/register" className="btn btn--primary">Tạo hồ sơ miễn phí</a>
        </div>
      </div>
    </div>
  </header>

  <main>

    {/* ============================================================
         HERO
    ============================================================ */}
    <section className="hero" aria-labelledby="hero-heading">
      <div className="container">
        <div className="hero__inner">

          <div className="hero__content">
            <span className="hero__eyebrow">Dành cho sinh viên & fresher IT</span>
            <h1 className="hero__title" id="hero-heading">
              Việc làm IT<br />
              <em>đúng với</em> bạn,<br />
              không phải ngẫu nhiên
            </h1>
            <p className="hero__desc">
              CareerFit phân tích kỹ năng thực tế của bạn và gợi ý những vị trí phù hợp nhất —
              kèm lộ trình phát triển rõ ràng để bạn biết cần học thêm gì.
            </p>
            <div className="hero__actions">
              <a href="/register" className="btn btn--primary">Bắt đầu miễn phí</a>
              <a href="#how-it-works" className="btn btn--ghost">Xem cách hoạt động</a>
            </div>
            <p className="hero__note">Không cần thẻ tín dụng. Hoàn toàn miễn phí cho sinh viên.</p>
          </div>

          <div className="hero__visual">
            <div className="match-card">
              <div className="match-card__header">
                <div>
                  <p className="match-card__company">Tiki Corporation</p>
                  <p className="match-card__role">Frontend Developer (Intern)</p>
                </div>
                <span className="match-card__badge">62% phù hợp</span>
              </div>
              <p className="match-card__salary">8 – 12 triệu / tháng</p>
              <div className="match-bar-label">
                <span>Mức độ phù hợp</span>
                <strong>62%</strong>
              </div>
              <div className="match-bar">
                <div className="match-bar__fill" style={{ "width": "62%" }}></div>
              </div>
              <div className="match-card__skills">
                <p className="match-card__skills-label">Kỹ năng yêu cầu</p>
                <div className="skill-row">
                  <span className="skill-row__dot skill-row__dot--have"></span>
                  <span>ReactJS — Bạn đã có</span>
                </div>
                <div className="skill-row">
                  <span className="skill-row__dot skill-row__dot--have"></span>
                  <span>HTML / CSS — Bạn đã có</span>
                </div>
                <div className="skill-row">
                  <span className="skill-row__dot skill-row__dot--miss"></span>
                  <span className="skill-row__text--miss">TypeScript — Cần bổ sung (~3 tuần)</span>
                </div>
                <div className="skill-row">
                  <span className="skill-row__dot skill-row__dot--miss"></span>
                  <span className="skill-row__text--miss">Git Flow — Cần bổ sung (~1 tuần)</span>
                </div>
              </div>
              <div className="match-card__footer">
                <a href="/login" className="btn btn--primary" style={{ "width": "100%", "marginTop": "12px" }}>Ứng tuyển ngay</a>
              </div>
            </div>

            <div className="hero__mini-card">
              <div className="hero__mini-card-icon">
                <svg className="icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 12l2 2 4-4M12 3C7.03 3 3 7.03 3 12s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9z"/>
                </svg>
              </div>
              <div className="hero__mini-card-text">
                <strong>1.240 vị trí đang tuyển</strong>
                Cập nhật hôm nay từ 380 công ty xác minh
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    {/* ============================================================
         STATS BAR
    ============================================================ */}
    <div className="stats-bar">
      <div className="container">
        <ul className="stats-bar__list" aria-label="Thống kê CareerFit">
          <li>
            <div className="stats-bar__item-value">14.800+</div>
            <div className="stats-bar__item-label">Sinh viên đang dùng</div>
          </li>
          <li>
            <div className="stats-bar__item-value">380</div>
            <div className="stats-bar__item-label">Doanh nghiệp xác minh</div>
          </li>
          <li>
            <div className="stats-bar__item-value">73%</div>
            <div className="stats-bar__item-label">Tìm được việc trong 60 ngày</div>
          </li>
          <li>
            <div className="stats-bar__item-value">4,8/5</div>
            <div className="stats-bar__item-label">Đánh giá trung bình</div>
          </li>
        </ul>
      </div>
    </div>

    {/* ============================================================
         HOW IT WORKS
    ============================================================ */}
    <section className="how-it-works" id="how-it-works" aria-labelledby="how-heading">
      <div className="container">
        <div className="section-header">
          <h2 className="section-header__title" id="how-heading">Bốn bước đến việc làm phù hợp</h2>
          <p className="section-header__desc">
            Không cần điền CV dài dòng. CareerFit phân tích kỹ năng thực tế và gợi ý ngay.
          </p>
        </div>

        <div className="steps" role="list">
          <div className="step" role="listitem">
            <div className="step__num" aria-hidden="true">01</div>
            <h3 className="step__title">Tạo hồ sơ kỹ năng</h3>
            <p className="step__desc">
              Điền kỹ năng, dự án thực tế, chứng chỉ đã có. Không cần kinh nghiệm làm việc chính thức.
            </p>
          </div>
          <div className="step" role="listitem">
            <div className="step__num" aria-hidden="true">02</div>
            <h3 className="step__title">Hệ thống phân tích độ phù hợp</h3>
            <p className="step__desc">
              Thuật toán so sánh kỹ năng của bạn với từng JD, tính phần trăm phù hợp và điểm thiếu.
            </p>
          </div>
          <div className="step" role="listitem">
            <div className="step__num" aria-hidden="true">03</div>
            <h3 className="step__title">Nhận gợi ý việc làm cá nhân hoá</h3>
            <p className="step__desc">
              Danh sách việc làm sắp xếp theo mức phù hợp, kèm lý do cụ thể tại sao phù hợp.
            </p>
          </div>
          <div className="step" role="listitem">
            <div className="step__num" aria-hidden="true">04</div>
            <h3 className="step__title">Ứng tuyển & theo dõi trạng thái</h3>
            <p className="step__desc">
              Nộp đơn trực tiếp, theo dõi tiến độ và nhận thông báo phản hồi từ nhà tuyển dụng.
            </p>
          </div>
        </div>
      </div>
    </section>

    {/* ============================================================
         JOB CARDS
    ============================================================ */}
    <section className="job-section" id="jobs" aria-labelledby="jobs-heading">
      <div className="container">
        <div className="job-section__header">
          <div className="section-header" style={{ "marginBottom": "0" }}>
            <h2 className="section-header__title" id="jobs-heading">Việc làm đang tuyển hôm nay</h2>
            <p className="section-header__desc">Cập nhật liên tục từ các công ty đã xác minh thông tin.</p>
          </div>
          <a href="/jobs" className="btn btn--ghost">Xem tất cả việc làm</a>
        </div>

        <div className="job-grid">

          <article className="job-card">
            <div className="job-card__top">
              <div className="job-card__logo" aria-hidden="true">TK</div>
              <span className="job-card__type">Toàn thời gian</span>
            </div>
            <p className="job-card__company">Tiki Corporation</p>
            <h3 className="job-card__title">Frontend Developer (ReactJS)</h3>
            <div className="job-card__meta">
              <span className="job-card__meta-item">
                <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/></svg>
                TP. Hồ Chí Minh
              </span>
              <span className="job-card__meta-item">
                <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Đăng 2 ngày trước
              </span>
            </div>
            <p className="job-card__salary">12 – 18 triệu / tháng</p>
            <div className="job-card__tags">
              <span className="tag">ReactJS</span>
              <span className="tag">TypeScript</span>
              <span className="tag">REST API</span>
              <span className="tag">Git</span>
            </div>
            <div className="job-card__footer">
              <span className="job-card__posted">Còn 14 ngày ứng tuyển</span>
              <a href="/login" className="btn btn--outline-accent btn--sm">Đăng nhập để xem độ phù hợp</a>
            </div>
          </article>

          <article className="job-card">
            <div className="job-card__top">
              <div className="job-card__logo" aria-hidden="true">VT</div>
              <span className="job-card__type">Intern</span>
            </div>
            <p className="job-card__company">VNG Corporation</p>
            <h3 className="job-card__title">Backend Developer Intern (Java)</h3>
            <div className="job-card__meta">
              <span className="job-card__meta-item">
                <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/></svg>
                TP. Hồ Chí Minh
              </span>
              <span className="job-card__meta-item">
                <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Đăng hôm nay
              </span>
            </div>
            <p className="job-card__salary">5 – 8 triệu / tháng</p>
            <div className="job-card__tags">
              <span className="tag">Java</span>
              <span className="tag">Spring Boot</span>
              <span className="tag">MySQL</span>
              <span className="tag">Docker</span>
            </div>
            <div className="job-card__footer">
              <span className="job-card__posted">Còn 21 ngày ứng tuyển</span>
              <a href="/login" className="btn btn--outline-accent btn--sm">Đăng nhập để xem độ phù hợp</a>
            </div>
          </article>

          <article className="job-card">
            <div className="job-card__top">
              <div className="job-card__logo" aria-hidden="true">SP</div>
              <span className="job-card__type">Part-time</span>
            </div>
            <p className="job-card__company">Shopee Vietnam</p>
            <h3 className="job-card__title">Data Analyst (Junior)</h3>
            <div className="job-card__meta">
              <span className="job-card__meta-item">
                <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5 14.5 7.62 14.5 9 13.38 11.5 12 11.5z"/></svg>
                Hà Nội
              </span>
              <span className="job-card__meta-item">
                <svg className="icon" width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                Đăng 1 ngày trước
              </span>
            </div>
            <p className="job-card__salary">10 – 15 triệu / tháng</p>
            <div className="job-card__tags">
              <span className="tag">Python</span>
              <span className="tag">SQL</span>
              <span className="tag">Power BI</span>
              <span className="tag">Excel</span>
            </div>
            <div className="job-card__footer">
              <span className="job-card__posted">Còn 7 ngày ứng tuyển</span>
              <a href="/login" className="btn btn--outline-accent btn--sm">Đăng nhập để xem độ phù hợp</a>
            </div>
          </article>

        </div>
      </div>
    </section>

    {/* ============================================================
         TRUST SECTION
    ============================================================ */}
    <section className="trust-section" id="trust" aria-labelledby="trust-heading">
      <div className="container">
        <div className="section-header" style={{ "marginBottom": "var(--space-5)" }}>
          <h2 className="section-header__title" id="trust-heading">Xây dựng trên sự minh bạch</h2>
          <p className="section-header__desc">
            Chúng tôi chỉ hiển thị thông tin đã xác minh. Không quảng cáo ẩn, không dữ liệu sai lệch.
          </p>
        </div>
        <div className="trust-pillars">

          <div className="trust-pillar">
            <svg className="trust-pillar__icon icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
            </svg>
            <h3 className="trust-pillar__title">Doanh nghiệp xác minh</h3>
            <p className="trust-pillar__desc">
              Mọi tin tuyển dụng đều đến từ doanh nghiệp đã cung cấp giấy phép kinh doanh và email doanh nghiệp.
              Không có tin ảo, không có bên thứ ba không rõ nguồn gốc.
            </p>
          </div>

          <div className="trust-pillar">
            <svg className="trust-pillar__icon icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <h3 className="trust-pillar__title">Minh bạch về mức lương</h3>
            <p className="trust-pillar__desc">
              Lương luôn hiển thị dạng khoảng cụ thể, không có dạng "Thoả thuận" chung chung.
              Doanh nghiệp cam kết đúng với mức đã đăng.
            </p>
          </div>

          <div className="trust-pillar">
            <svg className="trust-pillar__icon icon" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <h3 className="trust-pillar__title">Báo cáo kỹ năng thực tế</h3>
            <p className="trust-pillar__desc">
              Sau mỗi lần ứng tuyển, bạn nhận báo cáo rõ ràng: thiếu kỹ năng gì, cần bao lâu để bổ sung,
              tài nguyên học tập nào phù hợp.
            </p>
          </div>

        </div>
      </div>
    </section>

    {/* ============================================================
         TESTIMONIALS
    ============================================================ */}
    <section className="testimonials" aria-labelledby="testimonials-heading">
      <div className="container">
        <div className="section-header">
          <h2 className="section-header__title" id="testimonials-heading">Sinh viên nói gì về CareerFit</h2>
          <p className="section-header__desc">
            Hơn 14.000 sinh viên đã tìm được việc làm phù hợp qua nền tảng của chúng tôi.
          </p>
        </div>

        <div className="testimonial-grid">

          <article className="testimonial-card">
            <p className="testimonial-card__quote">
              "Trước đây tôi cứ nộp đơn bừa, không biết mình thiếu gì. CareerFit chỉ rõ tôi cần học thêm TypeScript và Git Flow — sau 3 tuần tự học, tôi ứng tuyển được ngay vị trí Frontend Intern tại Tiki."
            </p>
            <div className="testimonial-card__author">
              <div className="testimonial-card__avatar" aria-hidden="true">NT</div>
              <div>
                <p className="testimonial-card__name">Nguyễn Tuấn Anh</p>
                <p className="testimonial-card__role">Frontend Intern tại Tiki — năm 3 HCMUT</p>
              </div>
            </div>
          </article>

          <article className="testimonial-card">
            <p className="testimonial-card__quote">
              "Tôi thích nhất là phần lương hiển thị rõ ràng từ đầu. Không còn bị bất ngờ khi phỏng vấn xong mới biết lương thấp hơn kỳ vọng rất nhiều."
            </p>
            <div className="testimonial-card__author">
              <div className="testimonial-card__avatar" aria-hidden="true">LM</div>
              <div>
                <p className="testimonial-card__name">Lê Minh Phương</p>
                <p className="testimonial-card__role">Data Analyst tại Shopee — fresher 6 tháng</p>
              </div>
            </div>
          </article>

          <article className="testimonial-card">
            <p className="testimonial-card__quote">
              "Tính năng báo cáo kỹ năng sau mỗi lần ứng tuyển rất hữu ích. Tôi biết cụ thể mình đang ở đâu và cần làm gì tiếp theo, thay vì chỉ nhận email từ chối chung chung."
            </p>
            <div className="testimonial-card__author">
              <div className="testimonial-card__avatar" aria-hidden="true">VH</div>
              <div>
                <p className="testimonial-card__name">Võ Thị Hương</p>
                <p className="testimonial-card__role">Backend Developer tại VNG — sinh viên năm 4 UIT</p>
              </div>
            </div>
          </article>

        </div>
      </div>
    </section>

    {/* ============================================================
         CTA
    ============================================================ */}
    <section className="cta-section" aria-labelledby="cta-heading">
      <div className="container">
        <div className="cta-section__inner">
          <div>
            <h2 className="cta-section__title" id="cta-heading">Bắt đầu hành trình<br />tìm việc đúng hướng</h2>
            <p className="cta-section__desc">
              Tạo hồ sơ kỹ năng trong 10 phút. Nhận gợi ý việc làm ngay lập tức.
            </p>
          </div>
          <div className="cta-section__actions">
            <a href="/register" className="btn btn--primary">Tạo hồ sơ miễn phí</a>
            <p className="cta-section__note">Miễn phí cho sinh viên. Không yêu cầu thẻ tín dụng.</p>
          </div>
        </div>
      </div>
    </section>

  </main>

  {/* ============================================================
       FOOTER
  ============================================================ */}
  <footer className="site-footer">
    <div className="container">
      <div className="site-footer__inner">

        <div>
          <p className="site-footer__brand-name">Career<span>Fit</span></p>
          <p className="site-footer__brand-desc">
            Nền tảng gợi ý việc làm IT dành cho sinh viên và fresher Việt Nam.
            Phân tích kỹ năng thực tế, kết nối đúng cơ hội.
          </p>
        </div>

        <div>
          <p className="site-footer__col-title">Sản phẩm</p>
          <ul className="site-footer__links">
            <li><a href="/jobs">Tìm việc làm</a></li>
            <li><a href="/profile">Hồ sơ kỹ năng</a></li>
            <li><a href="/report">Báo cáo kỹ năng</a></li>
            <li><a href="/learning">Lộ trình học tập</a></li>
          </ul>
        </div>

        <div>
          <p className="site-footer__col-title">Dành cho</p>
          <ul className="site-footer__links">
            <li><a href="/students">Sinh viên</a></li>
            <li><a href="/freshers">Fresher</a></li>
            <li><a href="/employers">Nhà tuyển dụng</a></li>
          </ul>
        </div>

        <div>
          <p className="site-footer__col-title">Hỗ trợ</p>
          <ul className="site-footer__links">
            <li><a href="/about">Về CareerFit</a></li>
            <li><a href="/blog">Blog nghề nghiệp</a></li>
            <li><a href="/faq">Câu hỏi thường gặp</a></li>
            <li><a href="/contact">Liên hệ</a></li>
          </ul>
        </div>

      </div>

      <div className="site-footer__bottom">
        <p className="site-footer__copy">© 2024 CareerFit. Được xây dựng tại Việt Nam.</p>
        <div style={{ "display": "flex", "gap": "var(--space-3)" }}>
          <a href="/privacy" style={{ "fontSize": "var(--fs-xs)", "color": "var(--color-dark-muted)" }}>Chính sách bảo mật</a>
          <a href="/terms" style={{ "fontSize": "var(--fs-xs)", "color": "var(--color-dark-muted)" }}>Điều khoản sử dụng</a>
        </div>
      </div>
    </div>
  </footer>

  


    </div>
  );
}
