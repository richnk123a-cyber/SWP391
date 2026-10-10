import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Building2, GraduationCap, ArrowRight, Check } from 'lucide-react';
import './RegisterRoleModal.css';

const roles = [
  {
    page: 'candidate-onboarding',
    Icon: GraduationCap,
    label: 'Dành cho ứng viên',
    title: 'Tôi là Ứng viên IT',
    description: 'Tìm kiếm cơ hội việc làm Fresher & Junior, kết nối trực tiếp với doanh nghiệp công nghệ uy tín.',
    benefits: ['Khám phá việc làm phù hợp kỹ năng', 'Lộ trình phát triển sự nghiệp bài bản'],
    action: 'Đăng ký tìm việc ngay',
  },
  {
    page: 'employer-register',
    Icon: Building2,
    label: 'Dành cho doanh nghiệp',
    title: 'Tôi là Nhà tuyển dụng',
    description: 'Đăng tin tuyển dụng IT, tiếp nhận hồ sơ chất lượng và quản lý phỏng vấn ứng viên hiệu quả.',
    benefits: ['Đăng tin việc làm IT chuẩn hóa', 'Xét duyệt hồ sơ & kết nối phỏng vấn'],
    action: 'Đăng ký tuyển dụng ngay',
  },
];

export function RegisterRoleModal({ isOpen, onClose, onSelectRole }) {
  const dialogRef = useRef(null);
  const closeRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus({ preventScroll: true });
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const selectRole = (page) => {
    onClose();
    onSelectRole(page);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.stopPropagation();
      onClose();
    }
    if (event.key === 'Tab') {
      const buttons = dialogRef.current.querySelectorAll('button:not([disabled])');
      const first = buttons[0];
      const last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  return createPortal(
    <div className="register-role-overlay" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
      <section ref={dialogRef} className="register-role-dialog" role="dialog" aria-modal="true" aria-labelledby="register-role-title" aria-describedby="register-role-description" onKeyDown={handleKeyDown}>
        <button ref={closeRef} type="button" className="register-role-close" onClick={onClose} aria-label="Đóng hộp đăng ký"><X aria-hidden="true" /></button>
        <div className="register-role-heading">
          <p className="register-role-eyebrow">Tham gia cùng cộng đồng CareerFit</p>
          <h2 id="register-role-title">Chọn loại tài khoản đăng ký</h2>
          <p id="register-role-description">Lựa chọn vai trò phù hợp để bắt đầu trải nghiệm dịch vụ</p>
        </div>
        <div className="register-role-grid">
          {roles.map(({ page, Icon, label, title, description, benefits, action }) => (
            <button key={page} type="button" className="register-role-card" onClick={() => selectRole(page)}>
              <span className="register-role-icon"><Icon aria-hidden="true" /></span>
              <span className="register-role-label">{label}</span>
              <span className="register-role-name">{title}</span>
              <span className="register-role-summary">{description}</span>
              <span className="register-role-benefits">
                {benefits.map(benefit => <span key={benefit}><Check aria-hidden="true" /><span>{benefit}</span></span>)}
              </span>
              <span className="register-role-action"><span>{action}</span><ArrowRight aria-hidden="true" /></span>
            </button>
          ))}
        </div>
        <div className="register-role-footer">Đã có tài khoản CareerFit? <button type="button" onClick={() => selectRole('login')}>Đăng nhập ngay</button></div>
      </section>
    </div>,
    document.body,
  );
}
