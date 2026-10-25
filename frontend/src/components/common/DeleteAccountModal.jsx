import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, Trash2, X, Loader2, ShieldAlert } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export function DeleteAccountModal({ isOpen, onClose }) {
  const { deleteAccount, currentUser } = useApp();
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const TARGET_PHRASE = 'tôi chắc chắn xóa tài khoản này';

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setConfirmText('');
      setError('');
      setIsDeleting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleStep1Yes = () => {
    setStep(2);
    setConfirmText('');
    setError('');
  };

  const handleConfirmDelete = async () => {
    const normalizedInput = confirmText.trim().toLowerCase();
    if (normalizedInput !== TARGET_PHRASE) {
      setError(`Vui lòng nhập chính xác cụm từ: "${TARGET_PHRASE}"`);
      return;
    }

    setIsDeleting(true);
    setError('');
    try {
      await deleteAccount();
      onClose();
    } catch (err) {
      setError(err?.message || 'Có lỗi xảy ra khi xóa tài khoản. Vui lòng thử lại.');
      setIsDeleting(false);
    }
  };

  const isConfirmedPhrase = confirmText.trim().toLowerCase() === TARGET_PHRASE;

  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden transform transition-all animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-rose-950">
                {step === 1 ? 'Xác nhận xóa tài khoản' : 'Xác minh xóa tài khoản'}
              </h3>
              <p className="text-xs text-rose-700">
                {step === 1 ? 'Bước 1 / 2' : 'Bước 2 / 2 - Xác minh lần cuối'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-700 hover:bg-rose-100/60 transition-colors"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {step === 1 ? (
            /* Bước 1 */
            <div className="space-y-4 text-center sm:text-left">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <p className="text-base font-extrabold text-slate-900 leading-snug">
                  Bạn có chắc chắn muốn xóa tài khoản này?
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Tài khoản <span className="font-bold text-slate-800">{currentUser?.email}</span> ({currentUser?.role === 'EMPLOYER' ? 'Doanh nghiệp' : currentUser?.role === 'CANDIDATE' ? 'Ứng viên' : 'Quản trị viên'}) và toàn bộ dữ liệu liên quan trong cơ sở dữ liệu sẽ bị xóa hoàn toàn.
                </p>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>
                  Hành động này <strong>không thể hoàn tác</strong>. Sau khi xóa, bạn có thể sử dụng lại email này để đăng ký tài khoản mới với vai trò chính xác.
                </span>
              </div>
            </div>
          ) : (
            /* Bước 2 */
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2 text-xs text-rose-900">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>Xác nhận xóa tài khoản vĩnh viễn</span>
                </div>
                <p className="text-[11px] text-rose-800 leading-relaxed">
                  Để đảm bảo bạn không vô tình thao tác nhầm, vui lòng gõ chính xác cụm từ sau:
                </p>
                <div className="p-2 bg-white rounded-lg border border-rose-300 font-mono text-center font-bold text-rose-700 select-all tracking-wide">
                  {TARGET_PHRASE}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Nhập cụm từ xác nhận:
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => {
                    setConfirmText(e.target.value);
                    setError('');
                  }}
                  disabled={isDeleting}
                  placeholder={`Gõ "${TARGET_PHRASE}"`}
                  className={`w-full px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none transition-all ${
                    error
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200 bg-rose-50/30'
                      : isConfirmedPhrase
                      ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-200 bg-emerald-50/20'
                      : 'border-slate-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-200'
                  }`}
                  autoFocus
                />
                {error && (
                  <p className="mt-1 text-xs text-rose-600 font-medium flex items-center gap-1">
                    <AlertTriangle size={12} /> {error}
                  </p>
                )}
                {isConfirmedPhrase && !error && (
                  <p className="mt-1 text-[11px] text-emerald-600 font-semibold">
                    ✓ Cụm từ xác nhận chính xác. Bạn có thể bấm Xác nhận bên dưới.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer"
              >
                Không
              </button>
              <button
                type="button"
                onClick={handleStep1Yes}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                Có
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  onClose();
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={!isConfirmedPhrase || isDeleting}
                className="px-5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <Loader2 size={14} className="animate-spin" /> Đang xóa...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Xác nhận
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
