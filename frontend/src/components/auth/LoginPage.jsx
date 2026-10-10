import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Building2, CircleHelp, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, KeyRound, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import './LoginPage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function LoginPage() {
  const { setActivePage, showToast, login, resetPassword, setCurrentUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [infoModal, setInfoModal] = useState(null);
  const [isPasswordLoginOpen, setIsPasswordLoginOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const params = new URLSearchParams(window.location.search);
        const oauthErr = params.get('oauthError');
        if (oauthErr) {
          if (oauthErr.includes('authorization_request_not_found')) {
            setErrorMessage('Phiên đăng nhập Google đã hết hạn. Vui lòng bấm nút "Đăng nhập bằng Google" bên dưới để thực hiện lại.');
          } else {
            try {
              setErrorMessage(decodeURIComponent(oauthErr.replace(/\+/g, ' ')));
            } catch {
              setErrorMessage(oauthErr);
            }
          }
        }
        if (params.get('error') === 'locked') {
          setErrorMessage('Tài khoản của bạn đã bị khóa bởi quản trị viên. Vui lòng liên hệ hỗ trợ.');
          showToast('Tài khoản đã bị khóa', 'danger');
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      } catch (err) {
        console.error("URL search params error:", err);
      }
    }
  }, [showToast]);

  const checkBackendReady = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1800);
      await fetch(`${BACKEND_URL}/api/auth/password-status`, { signal: controller.signal });
      clearTimeout(timeoutId);
      return true;
    } catch {
      return false;
    }
  };

  const handleGoogleOAuthLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const isReady = await checkBackendReady();
    if (!isReady) {
      setIsLoading(false);
      const msg = 'Máy chủ Backend đang khởi động, vui lòng đợi 3-5 giây rồi bấm lại.';
      setErrorMessage(msg);
      showToast(msg, 'warning');
      return;
    }
    window.location.href = `${BACKEND_URL}/oauth2/authorization/google`;
  };

  const handleMicrosoftOAuthLogin = async () => {
    setIsLoading(true);
    setErrorMessage('');
    const isReady = await checkBackendReady();
    if (!isReady) {
      setIsLoading(false);
      const msg = 'Máy chủ Backend đang khởi động, vui lòng đợi 3-5 giây rồi bấm lại.';
      setErrorMessage(msg);
      showToast(msg, 'warning');
      return;
    }
    window.location.href = `${BACKEND_URL}/oauth2/authorization/microsoft`;
  };

  const performLogin = async (targetEmail, targetPassword) => {
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: targetEmail, 
          password: targetPassword,
          authProvider: 'AUTO'
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const msg = data.message || 'Email hoặc mật khẩu không chính xác.';
        setErrorMessage(msg);
        showToast(msg, 'danger');
        return;
      }

      const authData = data.data;
      if (authData.token) {
        localStorage.setItem('careerfit_token', authData.token);
      }
      localStorage.setItem('careerfit_current_user', JSON.stringify(authData));
      if (setCurrentUser) {
        setCurrentUser(authData);
      }

      if (authData.role === 'EMPLOYER') setActivePage('employer-dashboard');
      else if (authData.role === 'ADMIN') setActivePage('admin-dashboard');
      else setActivePage('candidate-dashboard');

      showToast('Đăng nhập thành công!', 'success');
    } catch (err) {
      console.error('LOGIN FETCH ERROR:', err);
      // Fallback local mock login if backend endpoint error
      const mockRes = login(targetEmail, targetPassword, 'AUTO');
      if (mockRes && mockRes.success) {
        showToast('Đăng nhập thành công!', 'success');
      } else {
        const msg = mockRes?.message || 'Không thể kết nối đến máy chủ backend hoặc thông tin sai.';
        setErrorMessage(msg);
        showToast(msg, 'danger');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    performLogin(email, password);
  };

  const handleSendResetEmail = (e) => {
    e.preventDefault();
    if (resetPassword && resetPassword(forgotEmail)) {
      setIsForgotModalOpen(false);
      setForgotEmail('');
      showToast('Đã gửi email khôi phục mật khẩu!', 'success');
    } else {
      showToast('Vui lòng kiểm tra lại địa chỉ email.', 'danger');
    }
  };

  return (
    <div className="login-page">
      <section className="login-content" aria-labelledby="login-heading">
        <div className="login-lock" aria-hidden="true"><Lock /></div>
        <h1 id="login-heading">Chào mừng quay trở lại</h1>
        <p className="login-subtitle">Lựa chọn phương thức xác thực an toàn qua tài khoản<br className="login-desktop-break" /> trường học hoặc công việc</p>
        <div className="login-card" aria-busy={isLoading}>
          {errorMessage && <div role="alert" className="login-error"><AlertCircle size={20} aria-hidden="true" /><span>{errorMessage}</span></div>}
          <div className="login-providers">
            {/* Google Login Option */}
            <button
              type="button"
              onClick={handleGoogleOAuthLogin}
              disabled={isLoading}
              className="login-provider"
            >
              <svg aria-hidden="true" className="login-provider-icon" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
              </svg>
              <span>Tiếp tục đăng nhập bằng Google</span>
            </button>

            {/* Microsoft / Outlook Login Option */}
            <button
              type="button"
              onClick={handleMicrosoftOAuthLogin}
              disabled={isLoading}
              className="login-provider"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 21 21" aria-hidden="true" className="login-provider-icon">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              <span>Tiếp tục đăng nhập bằng Microsoft (Outlook)</span>
            </button>

          </div>
          {isLoading && <p className="login-progress" role="status"><Loader2 className="animate-spin" size={18} /> Đang kết nối đăng nhập...</p>}
          <p className="login-trust"><ShieldCheck aria-hidden="true" /><span>Hỗ trợ tài khoản sinh viên, giảng viên và đối tác doanh nghiệp</span></p>
        </div>
        <nav className="login-secondary" aria-label="Hỗ trợ đăng nhập">
          <button type="button" onClick={() => setIsPasswordLoginOpen(true)}><Building2 aria-hidden="true" /><span>Cổng Doanh nghiệp & Nhà tuyển dụng</span><ArrowRight aria-hidden="true" /></button>
          <span className="login-link-dot" aria-hidden="true">•</span>
          <button type="button" onClick={() => setInfoModal('help')}><CircleHelp aria-hidden="true" /><span>Trợ giúp & Hướng dẫn</span></button>
        </nav>
        <p className="login-legal">Bằng cách đăng nhập, bạn đồng ý với <button type="button" onClick={() => setInfoModal('terms')}>Điều khoản dịch vụ</button> và <button type="button" onClick={() => setInfoModal('privacy')}>Chính sách bảo mật</button> của CareerFit.</p>
      </section>
      <footer className="login-footer">© {new Date().getFullYear()} CareerFit. Nền tảng tuyển dụng và phát triển nghề nghiệp công nghệ.</footer>
      <Modal isOpen={isPasswordLoginOpen} onClose={() => setIsPasswordLoginOpen(false)} title="Cổng Doanh nghiệp & Nhà tuyển dụng">
        <p className="text-sm text-slate-600 mb-5">Đăng nhập bằng tài khoản hiện có hoặc đăng ký tài khoản doanh nghiệp.</p>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="form-group">
              <label className="form-label font-semibold text-slate-800">Email hoặc Tên đăng nhập *</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                <input
                  type="text"
                  className="form-control text-xs font-medium h-11 rounded-xl"
                  style={{ paddingLeft: '2.75rem' }}
                  placeholder="Email hoặc Tên đăng nhập (VD: candidate1 hoặc hr@company.com)"
                  value={email}
                  onChange={e => {
                    setEmail(e.target.value);
                    setErrorMessage('');
                  }}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <div className="flex items-center justify-between mb-1">
                <label className="form-label font-semibold text-slate-800">Mật khẩu *</label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(email);
                    setIsForgotModalOpen(true);
                  }}
                  className="text-xs text-blue-600 font-bold hover:underline cursor-pointer"
                >
                  Quên mật khẩu?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control text-xs font-medium h-11 rounded-xl"
                  style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => {
                    setPassword(e.target.value);
                    setErrorMessage('');
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 z-10 p-1 cursor-pointer"
                  title={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-600 pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Ghi nhớ đăng nhập</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full btn-lg font-bold h-11 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Đang đăng nhập...
                </>
              ) : (
                <>
                  Đăng nhập ngay <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>
        {errorMessage && <p role="alert" className="login-error">{errorMessage}</p>}
        <button type="button" className="text-sm text-blue-700 underline mt-5" onClick={() => setActivePage('employer-register')}>Đăng ký tài khoản doanh nghiệp</button>
      </Modal>
      <Modal isOpen={Boolean(infoModal)} onClose={() => setInfoModal(null)} title={infoModal === 'help' ? 'Trợ giúp & Hướng dẫn' : infoModal === 'terms' ? 'Điều khoản dịch vụ' : 'Chính sách bảo mật'}>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          {infoModal === 'help' ? <>
            <p>Chọn Google hoặc Microsoft (Outlook), sau đó xác thực bằng tài khoản trường học hoặc công việc của bạn trên trang của nhà cung cấp.</p>
            <p>Nếu chưa có hồ sơ, hệ thống sẽ hướng dẫn bạn hoàn tất đăng ký sau khi xác thực. Với tài khoản dùng mật khẩu, hãy mở Cổng Doanh nghiệp & Nhà tuyển dụng.</p>
            <p>Nếu phiên đăng nhập hết hạn, hãy quay lại trang này và chọn lại phương thức đăng nhập.</p>
          </> : <p>{infoModal === 'terms' ? 'Nội dung điều khoản dịch vụ đang được cập nhật. Vui lòng liên hệ đơn vị vận hành CareerFit để biết điều khoản áp dụng trước khi tiếp tục.' : 'Nội dung chính sách bảo mật đang được cập nhật. Vui lòng liên hệ đơn vị vận hành CareerFit để biết cách dữ liệu tài khoản của bạn được xử lý trước khi tiếp tục.'}</p>}
        </div>
      </Modal>
      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <Modal
          isOpen={isForgotModalOpen}
          onClose={() => setIsForgotModalOpen(false)}
          title="Đặt lại mật khẩu tài khoản"
        >
          <form onSubmit={handleSendResetEmail} className="space-y-4 text-xs">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-center gap-2">
              <KeyRound size={20} className="text-blue-600 shrink-0" />
              <p>Nhập email đăng ký của bạn. Hệ thống CareerFit sẽ gửi liên kết đặt lại mật khẩu an toàn đến hộp thư.</p>
            </div>

            <div className="form-group">
              <label className="form-label font-bold text-slate-800">Email khôi phục *</label>
              <input
                type="email"
                className="form-control text-xs h-10"
                placeholder="nhap.email@gmail.com"
                value={forgotEmail}
                onChange={e => setForgotEmail(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="btn btn-secondary text-xs cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary text-xs font-bold cursor-pointer"
              >
                Gửi liên kết khôi phục
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
