import React, { lazy, Suspense, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EmployerPageHeader } from '../employer/EmployerPageHeader';
import { getCandidateAvatar } from '../../utils/candidateAvatar';
import { getCompanyLogoUrl, isImageLogo } from '../../utils/logoUtils';
import './AccountSettingsPage.css';

const PasswordSettings = lazy(() => import('./SecuritySettingsPage').then(module => ({ default: module.SecuritySettingsPage })));
const DeleteAccountModal = lazy(() => import('./DeleteAccountModal').then(module => ({ default: module.DeleteAccountModal })));
const sections = [
  { id: 'account', label: 'Thông tin tài khoản', note: 'Danh tính & hồ sơ' },
  { id: 'security', label: 'Đăng nhập & bảo mật', note: 'Mật khẩu & xác thực' },
  { id: 'management', label: 'Quản lý tài khoản', note: 'Đăng xuất & quyền tài khoản' },
];

export function AccountSettingsPage() {
  const { currentUser, candidateProfile, employerProfile, setActivePage, logout } = useApp();
  const [section, setSection] = useState('account');
  const [deleteOpen, setDeleteOpen] = useState(false);
  const role = currentUser?.role;
  const isEmployer = role === 'EMPLOYER';
  const roleLabel = { EMPLOYER: 'Nhà tuyển dụng', CANDIDATE: 'Ứng viên', ADMIN: 'Quản trị viên' }[role] || 'Thành viên';
  const name = (isEmployer ? employerProfile?.recruiterName : role === 'CANDIDATE' ? candidateProfile?.name : '') || currentUser?.fullName || currentUser?.username || 'Tài khoản của bạn';
  const phone = (isEmployer ? employerProfile?.phone : role === 'CANDIDATE' ? candidateProfile?.phone : '') || currentUser?.phone;
  const avatar = isEmployer ? (isImageLogo(employerProfile?.logo) ? getCompanyLogoUrl(employerProfile.logo) : '') : role === 'CANDIDATE' ? getCandidateAvatar(candidateProfile, currentUser) : currentUser?.avatarUrl || '';
  const profilePage = isEmployer ? 'company-profile' : role === 'CANDIDATE' ? 'candidate-profile' : null;

  return (
    <div className="employer-page account-settings-page">
      <EmployerPageHeader eyebrow="KHÔNG GIAN RIÊNG CỦA BẠN" title="Cài đặt tài khoản" description="Thông tin cá nhân, đăng nhập và quyền quản lý — trong cùng một nơi." />
      <div className="account-settings-layout">
        <aside className="account-settings-nav">
          <div className="account-settings-identity">
            <div className={`account-settings-avatar ${isEmployer ? 'is-company' : ''}`}>
              <span>{name.charAt(0).toUpperCase()}</span>
              {avatar && <img src={avatar} alt="Ảnh tài khoản" onError={event => { event.currentTarget.hidden = true; }} />}
            </div>
            <strong>{name}</strong>
            <span className="account-settings-role">{roleLabel}</span>
          </div>
          <nav aria-label="Các mục cài đặt tài khoản">
            {sections.map(item => <button type="button" key={item.id} aria-current={section === item.id ? 'page' : undefined} onClick={() => setSection(item.id)} aria-controls="account-settings-panel">
              <span>{item.label}<small>{item.note}</small></span><span aria-hidden="true">↗</span>
            </button>)}
          </nav>
          <p className="account-settings-nav-note">Hồ sơ đầy đủ giúp mỗi kết nối trở nên có ý nghĩa hơn.</p>
        </aside>
        <div id="account-settings-panel" className="account-settings-panel" role="region" aria-label={sections.find(item => item.id === section)?.label}>
          {section === 'account' && <>
            <section className="account-settings-card">
              <div className="account-settings-card-heading"><div><p>01 / DANH TÍNH</p><h2>Thông tin tài khoản</h2><span>Thông tin gắn với tài khoản CareerFit của bạn.</span></div><span className="account-settings-small-tag">{roleLabel}</span></div>
              <dl className="account-settings-details">
                <div><dt>Tên hiển thị</dt><dd>{name}</dd></div>
                <div><dt>Email đăng nhập</dt><dd>{currentUser?.email || 'Chưa cập nhật'}</dd></div>
                <div><dt>Số điện thoại liên hệ</dt><dd>{phone || 'Chưa cập nhật'}</dd></div>
                <div><dt>{isEmployer ? 'Doanh nghiệp' : 'Vai trò tài khoản'}</dt><dd>{isEmployer ? employerProfile?.companyName || 'Chưa cập nhật' : roleLabel}</dd></div>
              </dl>
              {profilePage && <div className="account-settings-card-footer"><p>{isEmployer ? 'Tên công ty, logo và thông tin HR được cập nhật trong hồ sơ công ty.' : 'Ảnh đại diện, thông tin cá nhân và CV được cập nhật trong hồ sơ của bạn.'}</p><button type="button" className="btn btn-secondary" onClick={() => setActivePage(profilePage)}>{isEmployer ? 'Chỉnh sửa hồ sơ công ty' : 'Chỉnh sửa hồ sơ'} <span aria-hidden="true">↗</span></button></div>}
            </section>
            <section className="account-settings-security-intro"><div><p>02 / AN TÂM KẾT NỐI</p><h2>Chủ động bảo vệ tài khoản.</h2><span>Kiểm tra phương thức đăng nhập, thiết lập hoặc thay đổi mật khẩu của bạn.</span></div><button type="button" onClick={() => setSection('security')}>Cài đặt bảo mật <span aria-hidden="true">↗</span></button></section>
          </>}
          {section === 'security' && <Suspense fallback={<div className="account-settings-card" role="status">Đang tải cài đặt bảo mật...</div>}><PasswordSettings embedded /></Suspense>}
          {section === 'management' && <>
            <section className="account-settings-card">
              <div className="account-settings-card-heading"><div><p>03 / QUẢN LÝ</p><h2>Quản lý tài khoản</h2><span>Chọn thao tác phù hợp với nhu cầu của bạn.</span></div></div>
              <div className="account-settings-action-row"><div><h3>Đăng xuất khỏi thiết bị này</h3><p>Kết thúc phiên đăng nhập CareerFit trên trình duyệt hiện tại.</p></div><button type="button" className="btn btn-secondary" onClick={logout}>Đăng xuất</button></div>
            </section>
            <section className="account-settings-delete"><div><span>QUYỀN QUẢN LÝ TÀI KHOẢN</span><h2>Xóa tài khoản</h2><p>Xóa vĩnh viễn tài khoản và dữ liệu liên quan. Hệ thống sẽ yêu cầu bạn xác nhận trước khi thực hiện.</p></div><button type="button" onClick={() => setDeleteOpen(true)}>Yêu cầu xóa tài khoản</button></section>
          </>}
        </div>
      </div>
      {deleteOpen && <Suspense fallback={null}><DeleteAccountModal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} /></Suspense>}
    </div>
  );
}
