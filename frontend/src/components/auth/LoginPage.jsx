import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { CircleHelp, Lock, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { Modal } from '../common/Modal';
import './LoginPage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';

export function LoginPage() {
  const { showToast } = useApp();
  const [infoModal, setInfoModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
          <button type="button" onClick={() => setInfoModal('help')}>
            <CircleHelp aria-hidden="true" />
            <span>Trợ giúp & Hướng dẫn</span>
          </button>
        </nav>
        <p className="login-legal">Bằng cách đăng nhập, bạn đồng ý với <button type="button" onClick={() => setInfoModal('terms')}>Điều khoản dịch vụ</button> và <button type="button" onClick={() => setInfoModal('privacy')}>Chính sách bảo mật</button> của CareerFit.</p>
      </section>
      <footer className="login-footer">© {new Date().getFullYear()} CareerFit. Nền tảng tuyển dụng và phát triển nghề nghiệp công nghệ.</footer>

      {/* Info / Help Modal */}
      <Modal isOpen={Boolean(infoModal)} onClose={() => setInfoModal(null)} title={infoModal === 'help' ? 'Trợ giúp & Hướng dẫn' : infoModal === 'terms' ? 'Điều khoản dịch vụ' : 'Chính sách bảo mật'}>
        <div className="text-sm text-slate-600 leading-relaxed space-y-3">
          {infoModal === 'help' ? (
            <>
              <p>Chọn Google hoặc Microsoft (Outlook), sau đó xác thực bằng tài khoản trường học hoặc công việc của bạn trên trang của nhà cung cấp.</p>
              <p>Nếu là lần đầu đăng nhập, hệ thống sẽ hướng dẫn bạn chọn vai trò (Ứng viên hoặc Nhà tuyển dụng) và hoàn thiện thông tin hồ sơ.</p>
              <p>Nếu phiên đăng nhập hết hạn, hãy quay lại trang này và chọn lại phương thức đăng nhập.</p>
            </>
          ) : (
            <p>{infoModal === 'terms' ? 'Nội dung điều khoản dịch vụ đang được cập nhật. Vui lòng liên hệ đơn vị vận hành CareerFit để biết điều khoản áp dụng trước khi tiếp tục.' : 'Nội dung chính sách bảo mật đang được cập nhật. Vui lòng liên hệ đơn vị vận hành CareerFit để biết cách dữ liệu tài khoản của bạn được xử lý trước khi tiếp tục.'}</p>
          )}
        </div>
      </Modal>
    </div>
  );
}
