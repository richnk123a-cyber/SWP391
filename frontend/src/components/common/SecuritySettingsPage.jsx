import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { authApi } from '../../services/apiService';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Loader2,
  HelpCircle,
  Mail,
  Shield,
  Trash2
} from 'lucide-react';
import { Modal } from './Modal';
import { DeleteAccountModal } from './DeleteAccountModal';
import './SecuritySettingsPage.css';
import { EmployerPageHeader } from '../employer/EmployerPageHeader';

export function SecuritySettingsPage({ embedded = false }) {
  const { currentUser, showToast, resetPassword } = useApp();

  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [hasPassword, setHasPassword] = useState(false);
  const [statusError, setStatusError] = useState(false);
  const [authProvider, setAuthProvider] = useState('LOCAL');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password Visibility
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Status & Loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Forgot Password Modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Load password status on mount
  useEffect(() => {
    fetchPasswordStatus();
  }, [currentUser]);

  const fetchPasswordStatus = async () => {
    setIsLoadingStatus(true);
    setStatusError(false);
    try {
      const res = await authApi.getPasswordStatus();
      const statusData = res?.data || res;
      if (statusData && typeof statusData.hasPassword !== 'undefined') {
        setHasPassword(statusData.hasPassword === true);
        const resolvedProv = statusData.authProvider || 
          (currentUser?.authProvider || 'LOCAL');
        setAuthProvider(resolvedProv);
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err) {
      console.warn('Could not fetch password status from API, using strict fallback estimation:', err);
      // Fallback estimation from currentUser
      setStatusError(true);
      const prov = currentUser?.authProvider?.toUpperCase() || 'UNKNOWN';
      setAuthProvider(prov);
      // STRICT: hasPassword is ONLY true if currentUser.hasCustomPassword is strictly true.
      // NEVER default to true just because provider is LOCAL or if unconfigured.
      setHasPassword(currentUser?.hasCustomPassword === true);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (isLoadingStatus || statusError || isSubmitting) return;
    setErrorMessage('');
    setSuccessMessage('');

    if (hasPassword && !oldPassword) {
      setErrorMessage('Vui lòng nhập mật khẩu hiện tại.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Mật khẩu xác nhận không khớp.');
      return;
    }

    if (hasPassword && oldPassword === newPassword) {
      setErrorMessage('Mật khẩu mới không được trùng với mật khẩu hiện tại.');
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.changePassword({
        oldPassword: hasPassword ? oldPassword : '',
        newPassword,
        confirmPassword
      });

      const msg = hasPassword 
        ? 'Đổi mật khẩu thành công! Hãy ghi nhớ mật khẩu mới của bạn.' 
        : 'Thiết lập mật khẩu thành công! Bây giờ bạn có thể đăng nhập bằng cả mật khẩu lẫn tài khoản liên kết.';
      
      setSuccessMessage(msg);
      showToast(msg, 'success');
      setHasPassword(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Update cached session
      if (currentUser) {
        const updated = { ...currentUser, hasCustomPassword: true };
        localStorage.setItem('careerfit_current_user', JSON.stringify(updated));
      }
    } catch (err) {
      let msg = err?.message || err?.response?.data?.message || 'Không thể thay đổi mật khẩu. Vui lòng thử lại.';
      if (typeof msg === 'string' && (msg.includes('No static resource') || msg.includes('404'))) {
        msg = 'Backend chưa nhận được API mới (/api/auth/change-password). Vui lòng Tắt và Chạy lại (Restart) Spring Boot Backend để áp dụng code mới.';
      }
      setErrorMessage(msg);
      showToast(msg, 'danger');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetEmail = (e) => {
    e.preventDefault();
    if (resetPassword && resetPassword(forgotEmail || currentUser?.email)) {
      setIsForgotModalOpen(false);
      setForgotEmail('');
    }
  };

  const isMinLength = newPassword.length >= 6;
  const isMatch = newPassword && confirmPassword && newPassword === confirmPassword;

  const providerLabel = 
    authProvider === 'GOOGLE' ? 'Google (Gmail)' :
    authProvider === 'MICROSOFT' ? 'Microsoft (Outlook)' :
    authProvider === 'UNKNOWN' ? 'Chưa xác nhận' : 'Tài khoản Hệ thống';

  return (
    <div className={`security-page ${embedded ? 'account-security-embedded' : currentUser?.role === 'EMPLOYER' ? 'employer-page hiring-security-page' : ''} w-full max-w-[1000px] mx-auto space-y-6 sm:space-y-8 pb-12 animate-in fade-in duration-300`}>
      {/* Top Header Banner */}
      {!embedded && (currentUser?.role === 'EMPLOYER' ? <EmployerPageHeader eyebrow="AN TÂM TRONG MỌI KẾT NỐI" title="Bảo mật tài khoản" description="Quản lý mật khẩu và phương thức đăng nhập trong cùng một không gian." /> : (
      <div className="security-hero bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-500/20 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shrink-0 shadow-inner">
              <ShieldCheck size={28} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 mb-1">
                <Sparkles size={11} /> Security Center
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Bảo mật tài khoản của bạn</h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Quản lý mật khẩu và phương thức đăng nhập trong cùng một không gian.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <span className="px-3 py-1.5 rounded-xl bg-white/10 text-xs font-bold text-slate-200 border border-white/10 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Tài khoản {currentUser?.role === 'EMPLOYER' ? 'Doanh nghiệp' : 'Ứng viên'}
            </span>
          </div>
        </div>
      </div>

      ))}
      {/* Main Grid */}
      <div className="security-layout grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Account Security Summary */}
        <div className="lg:col-span-1 space-y-5">
          <div className="security-account bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Shield size={18} className="text-blue-600" />
              <span>Thông tin tài khoản</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Email đăng ký:</span>
                <span className="font-bold text-slate-800 break-all">{currentUser?.email}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Tên hiển thị / Username:</span>
                <span className="font-bold text-slate-800">{currentUser?.fullName || currentUser?.username}</span>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Phương thức xác thực gốc:</span>
                <div className="mt-1 flex items-center gap-1.5">
                  {authProvider === 'GOOGLE' && (
                    <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-800 font-semibold border border-amber-200 flex items-center gap-1 text-[11px]">
                      <svg className="w-3 h-3" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                        <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                        <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                        <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                      </svg>
                      Google OAuth
                    </span>
                  )}
                  {authProvider === 'MICROSOFT' && (
                    <span className="px-2 py-1 rounded-lg bg-cyan-50 text-cyan-800 font-semibold border border-cyan-200 flex items-center gap-1 text-[11px]">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" className="w-3 h-3">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                      </svg>
                      Microsoft Outlook
                    </span>
                  )}
                  {authProvider === 'UNKNOWN' && <span className="security-provider">Chưa xác nhận</span>}
                  {authProvider !== 'UNKNOWN' && authProvider !== 'GOOGLE' && authProvider !== 'MICROSOFT' && (
                    <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 font-semibold border border-slate-200 flex items-center gap-1 text-[11px]">
                      <KeyRound size={12} className="text-slate-500" />
                      Mật khẩu Hệ thống
                    </span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-medium block text-[11px]">Trạng thái mật khẩu:</span>
                <span className={`font-bold inline-flex items-center gap-1 mt-0.5 ${hasPassword ? 'text-emerald-700' : 'text-amber-700'}`}>
                  {statusError ? <span>Chưa xác nhận</span> : hasPassword ? (
                    <>
                      <CheckCircle2 size={13} className="text-emerald-600" /> Đã thiết lập mật khẩu
                    </>
                  ) : (
                    <>
                      <AlertCircle size={13} className="text-amber-600" /> Chưa có mật khẩu trực tiếp
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Security Tips */}
          <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-3xl border border-blue-200/60 text-xs text-blue-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5 text-blue-950">
              <Sparkles size={14} className="text-blue-600" /> Lời khuyên bảo mật:
            </p>
            <ul className="list-disc list-inside space-y-1 text-blue-800/90 text-[11.5px] leading-relaxed">
              <li>Nên đặt mật khẩu dài tối thiểu 6 ký tự kết hợp chữ và số.</li>
              <li>Không sử dụng chung mật khẩu với các dịch vụ khác.</li>
              <li>Nếu tạo tài khoản bằng Google/Microsoft, bạn vẫn có thể tạo thêm mật khẩu để đăng nhập linh hoạt mọi lúc.</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Password Action Form */}
        <div className="lg:col-span-2">
          <div className="security-password-card bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
            {embedded && <div className="account-login-status" role="status"><span>Phương thức đăng nhập: <strong>{isLoadingStatus ? 'Đang kiểm tra...' : statusError ? 'Chưa xác nhận' : providerLabel}</strong></span><span>{isLoadingStatus ? '' : statusError ? 'Cần kiểm tra lại kết nối' : hasPassword ? 'Đã thiết lập mật khẩu' : 'Chưa có mật khẩu trực tiếp'}</span></div>}
            
            {/* Form Header */}
            <div>
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <span>{hasPassword ? 'Đổi mật khẩu tài khoản' : 'Thiết lập mật khẩu mới'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                {statusError ? 'Kiểm tra trạng thái tài khoản trước khi thiết lập hoặc đổi mật khẩu.' : hasPassword
                  ? 'Nhập mật khẩu hiện tại và mật khẩu mới để tiến hành thay đổi.'
                  : `Tài khoản của bạn đang đăng nhập qua ${providerLabel}. Hãy thiết lập mật khẩu để có thể đăng nhập bằng form mật khẩu bất cứ lúc nào.`}
              </p>
            </div>

            {/* Notification / Alert Banners */}
            {statusError && <div className="security-status-warning" role="status"><AlertCircle size={18}/><div><strong>Chưa xác nhận được trạng thái tài khoản</strong><p>Kết nối lại với máy chủ trước khi cập nhật mật khẩu.</p><button type="button" onClick={fetchPasswordStatus}>Kiểm tra lại</button></div></div>}
            {errorMessage && (
              <div className="p-3.5 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">Lỗi thao tác</p>
                  <p className="text-[11.5px] text-rose-700 mt-0.5">{errorMessage}</p>
                </div>
              </div>
            )}

            {successMessage && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200/80 rounded-2xl text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-emerald-900">Thành công</p>
                  <p className="text-[11.5px] text-emerald-700 mt-0.5">{successMessage}</p>
                </div>
              </div>
            )}

            {!hasPassword && !statusError && !isLoadingStatus && (
              <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-bold text-amber-950">Thiết lập mật khẩu lần đầu</p>
                  <p className="text-[11.5px] text-amber-800 leading-relaxed">
                    Bạn không cần nhập mật khẩu cũ vì bạn đã đăng nhập qua <strong>{providerLabel}</strong>. Chỉ cần nhập mật khẩu mới và xác nhận bên dưới.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              
              {/* Field 1: Old Password (Only if already has password) */}
              {hasPassword && (
                <div className="form-group">
                  <div className="flex items-center justify-between mb-1">
                    <label className="form-label font-semibold text-slate-800 text-xs">
                      Mật khẩu hiện tại *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setForgotEmail(currentUser?.email || '');
                        setIsForgotModalOpen(true);
                      }}
                      className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Quên mật khẩu hiện tại?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={17} />
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      className="form-control text-xs font-medium h-11 rounded-xl"
                      style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                      placeholder="Nhập mật khẩu hiện tại của bạn"
                      aria-label="Mật khẩu hiện tại" autoComplete="current-password" value={oldPassword}
                      onChange={e => setOldPassword(e.target.value)}
                      required={hasPassword}
                    />
                    <button
                      type="button"
                      aria-label={showOldPass ? "Ẩn mật khẩu hiện tại" : "Hiện mật khẩu hiện tại"} onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10 p-1 cursor-pointer"
                    >
                      {showOldPass ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Field 2: New Password */}
              <div className="form-group">
                <label className="form-label font-semibold text-slate-800 text-xs">
                  {hasPassword ? 'Mật khẩu mới *' : 'Tạo mật khẩu mới *'}
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={17} />
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="form-control text-xs font-medium h-11 rounded-xl"
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                    aria-label="Mật khẩu mới" autoComplete="new-password" value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showNewPass ? "Ẩn mật khẩu mới" : "Hiện mật khẩu mới"} onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10 p-1 cursor-pointer"
                  >
                    {showNewPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Field 3: Confirm New Password */}
              <div className="form-group">
                <label className="form-label font-semibold text-slate-800 text-xs">
                  Xác nhận lại mật khẩu mới *
                </label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={17} />
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="form-control text-xs font-medium h-11 rounded-xl"
                    style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    placeholder="Nhập lại mật khẩu mới chính xác"
                    aria-label="Xác nhận mật khẩu mới" autoComplete="new-password" value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPass ? "Ẩn mật khẩu xác nhận" : "Hiện mật khẩu xác nhận"} onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10 p-1 cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Real-time Password Requirements */}
              {newPassword && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                  <p className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Tiêu chuẩn mật khẩu:</p>
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className={isMinLength ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {isMinLength ? '✓' : '•'} Tối thiểu 6 ký tự (hiện tại: {newPassword.length})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11.5px]">
                    <span className={isMatch ? 'text-emerald-600 font-semibold' : 'text-slate-400'}>
                      {isMatch ? '✓' : '•'} Mật khẩu xác nhận trùng khớp
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoadingStatus || statusError || isSubmitting || !isMinLength || !isMatch}
                  className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Đang cập nhật...
                    </>
                  ) : (
                    <>
                      {hasPassword ? 'Cập nhật mật khẩu mới' : 'Hoàn tất thiết lập mật khẩu'}
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Danger Zone: Xóa tài khoản */}
      {!embedded && currentUser?.role !== 'ADMIN' && (
      <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-6 sm:p-7 shadow-xs space-y-4 mb-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-bold text-rose-950 flex items-center gap-2">
              <Trash2 size={18} className="text-rose-600" /> Vùng nguy hiểm: Xóa tài khoản
            </h3>
            <p className="text-xs text-rose-800 leading-relaxed max-w-xl">
              Nếu bạn lỡ tạo nhầm vai trò tài khoản (ứng viên hoặc doanh nghiệp) hoặc không còn nhu cầu sử dụng, bạn có thể xóa vĩnh viễn tài khoản này để giải phóng email và đăng ký lại đúng tài khoản.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Trash2 size={14} /> Xóa tài khoản này
          </button>
        </div>
      </div>
      )}

      {/* Forgot Password Modal */}
      <Modal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        title="Khôi phục / Đặt lại mật khẩu tạm thời"
      >
        <form onSubmit={handleSendResetEmail} className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Nhập email tài khoản để yêu cầu hỗ trợ khôi phục mật khẩu.
          </p>

          <div className="form-group">
            <label className="form-label font-semibold text-slate-800 text-xs">Email tài khoản</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="email"
                className="form-control text-xs h-11 rounded-xl"
                style={{ paddingLeft: '2.75rem' }}
                value={forgotEmail || currentUser?.email || ''}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsForgotModalOpen(false)}
              className="btn btn-secondary text-xs rounded-xl px-4 py-2"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="btn btn-primary text-xs rounded-xl px-4 py-2 font-bold"
            >
              Gửi yêu cầu khôi phục
            </button>
          </div>
        </form>
      </Modal>

      <DeleteAccountModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
}



