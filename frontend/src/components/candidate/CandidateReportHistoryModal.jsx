import React, { useState, useEffect, useCallback } from 'react';
import { reportApi } from '../../services/apiService';
import { Modal } from '../common/Modal';
import { ShieldAlert, AlertCircle, Loader2 } from 'lucide-react';

const STATUS_BADGES = {
  PENDING: { label: 'Chờ xử lý', bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  REVIEWING: { label: 'Đang xem xét', bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  RESOLVED: { label: 'Đã xử lý', bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  DISMISSED: { label: 'Đã từ chối', bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },
};

export function CandidateReportHistoryModal({ isOpen, onClose }) {
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadReports = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await reportApi.getMine({ page: 0, size: 20 });
      const data = res?.data || res;
      setReports(data?.content || data || []);
    } catch (err) {
      console.error('FETCH REPORTS ERROR:', err);
      setError(err?.message || 'Không thể tải lịch sử báo cáo.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadReports();
    }
  }, [isOpen, loadReports]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Lịch sử báo cáo tin tuyển dụng">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader2 className="animate-spin" size={24} />
            <p className="text-xs">Đang tải lịch sử báo cáo...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
            <button onClick={loadReports} className="font-semibold underline hover:text-rose-950 cursor-pointer">Thử lại</button>
          </div>
        )}

        {!isLoading && !error && reports.length === 0 && (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <ShieldAlert size={36} className="mx-auto text-slate-400" />
            <p className="text-sm font-semibold">Chưa có báo cáo nào</p>
            <p className="text-xs text-slate-400">Bạn chưa gửi báo cáo nghi ngờ nào cho các tin tuyển dụng.</p>
          </div>
        )}

        {!isLoading && !error && reports.map((r) => {
          const badge = STATUS_BADGES[r.status] || STATUS_BADGES.PENDING;
          return (
            <div key={r.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-2.5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">{r.jobTitle || 'Tin tuyển dụng'}</h4>
                  <p className="text-[11px] text-slate-500">{r.company || 'Doanh nghiệp'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                  {badge.label}
                </span>
              </div>

              <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 space-y-1">
                <p><strong className="text-slate-700">Lý do:</strong> {r.reason}</p>
                {r.description && <p><strong className="text-slate-700">Mô tả:</strong> {r.description}</p>}
                {r.adminNote && (
                  <p className="text-blue-800 mt-1 pt-1 border-t border-slate-200">
                    <strong>Phản hồi từ Ban quản trị:</strong> {r.adminNote}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span>Mã báo cáo: {r.id}</span>
                <span>{r.createdAt ? new Date(r.createdAt).toLocaleString('vi-VN') : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </Modal>
  );
}
