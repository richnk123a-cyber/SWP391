import React from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("CareerFit App ErrorBoundary caught an exception:", error, errorInfo);
  }

  handleResetStorageAndReload = () => {
    try {
      // Clear view-related caches if corrupted, but preserve user session and auth token
      const token = localStorage.getItem('careerfit_token');
      const currentUser = localStorage.getItem('careerfit_current_user');
      const companies = localStorage.getItem('careerfit_companies');
      
      localStorage.removeItem('careerfit_selected_job');
      
      // If token and user existed, preserve them so user is not logged out abruptly
      if (token) localStorage.setItem('careerfit_token', token);
      if (currentUser) localStorage.setItem('careerfit_current_user', currentUser);
      if (companies) localStorage.setItem('careerfit_companies', companies);
    } catch (e) {
      console.error("ErrorBoundary cleanup note:", e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-3xl p-8 shadow-2xl text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle size={32} />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black tracking-tight">Đã có sự cố xảy ra</h2>
              <p className="text-xs text-slate-300 leading-relaxed">
                Ứng dụng gặp lỗi tạm thời do bộ nhớ cache trình duyệt chưa được đồng bộ. Nhấn nút bên dưới để khôi phục và tiếp tục sử dụng.
              </p>
            </div>

            <div className="pt-2">
              <button
                onClick={this.handleResetStorageAndReload}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
              >
                <RefreshCw size={18} /> Khôi phục & Tải lại trang
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
