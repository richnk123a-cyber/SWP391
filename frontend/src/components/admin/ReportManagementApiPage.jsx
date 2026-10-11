import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { reportApi } from '../../services/apiService';
import { Modal } from '../common/Modal';
import { AlertCircle, CheckCircle2, Clock3, Eye, Search, ShieldCheck, X, XCircle } from 'lucide-react';

const STATUS_META = {
  PENDING: { label: 'Chờ tiếp nhận', className: 'bg-rose-50 text-rose-800 border-rose-200', icon: AlertCircle },
  REVIEWING: { label: 'Đang xác minh', className: 'bg-amber-50 text-amber-800 border-amber-200', icon: Clock3 },
  RESOLVED: { label: 'Đã xử lý', className: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  DISMISSED: { label: 'Đã bác bỏ', className: 'bg-slate-100 text-slate-700 border-slate-200', icon: XCircle },
};

const formatDate = value => value
  ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
  : '—';

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || STATUS_META.PENDING;
  const Icon = meta.icon;
  return <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border inline-flex items-center gap-1 ${meta.className}`}><Icon size={13} />{meta.label}</span>;
}

export function ReportManagementApiPage() {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState([]);
  const [pageInfo, setPageInfo] = useState({ page: 0, totalPages: 0, totalElements: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewingReport, setViewingReport] = useState(null);
  const [action, setAction] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

  const loadReports = useCallback(async (page = 0, keyword = searchQuery) => {
    setLoading(true);
    setError('');
    try {
      const response = await reportApi.getAdminList({ status: activeTab, keyword: keyword.trim() || undefined, page, size: 10 });
      const data = response.data;
      setReports(data.content || []);
      setPageInfo({ page: data.page, totalPages: data.totalPages, totalElements: data.totalElements });
    } catch (requestError) {
      setError(requestError?.message || 'Không thể tải danh sách báo cáo.');
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => loadReports(0, searchQuery), 300);
    return () => clearTimeout(timer);
  }, [loadReports, searchQuery]);

  const openDetail = async report => {
    try {
      const response = await reportApi.getAdminDetail(report.id);
      setViewingReport(response.data);
    } catch (requestError) {
      showToast(requestError?.message || 'Không thể tải chi tiết báo cáo.', 'danger');
    }
  };

  const openAction = (report, targetStatus) => {
    setAction({ report, targetStatus });
    setAdminNote('');
    setError('');
  };

  const submitAction = async () => {
    if (!action) return;
    const needsNote = ['RESOLVED', 'DISMISSED'].includes(action.targetStatus);
    if (needsNote && !adminNote.trim()) {
      setError('Vui lòng nhập ghi chú xử lý trước khi kết thúc báo cáo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await reportApi.updateStatus(action.report.id, {
        status: action.targetStatus,
        adminNote: needsNote ? adminNote.trim() : null,
      });
      showToast(response.message || 'Cập nhật trạng thái thành công.', 'success');
      setAction(null);
      setViewingReport(response.data);
      await loadReports(0);
    } catch (requestError) {
      setError(requestError?.message || 'Không thể cập nhật trạng thái báo cáo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/90 shadow-xs">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Báo cáo vi phạm</h1>
        <p className="text-sm text-slate-600 mt-1.5">Tiếp nhận, xác minh và lưu lịch sử xử lý báo cáo tin tuyển dụng vi phạm, nghi ngờ lừa đảo.</p>
      </div>

      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Tìm theo tin, công ty, người báo cáo, lý do..."
            value={searchQuery}
            onChange={event => setSearchQuery(event.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center bg-slate-100 p-1 rounded-lg border border-slate-200 w-fit">
          {Object.entries(STATUS_META).map(([status, meta]) => (
            <button
              key={status}
              onClick={() => setActiveTab(status)}
              className={`px-3.5 py-1.5 rounded-md text-xs font-semibold ${activeTab === status ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {meta.label}{activeTab === status ? ` (${pageInfo.totalElements})` : ''}
            </button>
          ))}
        </div>
      </div>

      {error && !action && (
        <div role="alert" className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-sm text-rose-800 flex justify-between">
          <span>{error}</span>
          <button onClick={() => loadReports(pageInfo.page)} className="font-bold">Thử lại</button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Tin bị báo cáo</th>
                <th className="py-3.5 px-4">Doanh nghiệp</th>
                <th className="py-3.5 px-4">Người báo cáo</th>
                <th className="py-3.5 px-4">Lý do</th>
                <th className="py-3.5 px-4">Ngày gửi</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800">
              {!loading && reports.map(report => (
                <tr key={report.id} className="hover:bg-slate-50/60">
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-bold truncate">{report.jobTitle || 'Tin tuyển dụng'}</p>
                    <p className="text-xs text-slate-500">{report.jobId}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold">{report.company || '—'}</td>
                  <td className="py-3.5 px-4 text-xs">
                    <p className="font-semibold">{report.reporterName || 'Ứng viên'}</p>
                    <p className="text-slate-500">{report.reporterEmail}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-sm text-xs">
                    <p className="line-clamp-2">{report.reason}</p>
                  </td>
                  <td className="py-3.5 px-4 text-xs whitespace-nowrap">{formatDate(report.createdAt)}</td>
                  <td className="py-3.5 px-4"><StatusBadge status={report.status} /></td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap space-x-1.5">
                    <button onClick={() => openDetail(report)} className="btn btn-secondary text-xs h-8 px-2.5">
                      <Eye size={13} className="inline mr-1" />Chi tiết
                    </button>
                    {report.status === 'PENDING' && (
                      <button onClick={() => openAction(report, 'REVIEWING')} className="btn btn-primary text-xs h-8 px-2.5">
                        Tiếp nhận
                      </button>
                    )}
                    {report.status === 'REVIEWING' && (
                      <>
                        <button onClick={() => openAction(report, 'RESOLVED')} className="btn btn-primary text-xs h-8 px-2.5">
                          Hoàn tất
                        </button>
                        <button onClick={() => openAction(report, 'DISMISSED')} className="btn btn-secondary text-xs h-8 px-2.5">
                          Bác bỏ
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
              {loading && <tr><td colSpan={7} className="text-center py-12 text-slate-500">Đang tải báo cáo...</td></tr>}
              {!loading && reports.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-slate-400">Không có báo cáo phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
        {pageInfo.totalPages > 1 && (
          <div className="p-4 border-t flex items-center justify-end gap-3 text-xs">
            <button disabled={pageInfo.page === 0} onClick={() => loadReports(pageInfo.page - 1)} className="btn btn-secondary disabled:opacity-50">
              Trang trước
            </button>
            <span>Trang {pageInfo.page + 1}/{pageInfo.totalPages}</span>
            <button disabled={pageInfo.page + 1 >= pageInfo.totalPages} onClick={() => loadReports(pageInfo.page + 1)} className="btn btn-secondary disabled:opacity-50">
              Trang sau
            </button>
          </div>
        )}
      </div>

      {viewingReport && (
        <Modal isOpen onClose={() => setViewingReport(null)} title="Chi tiết báo cáo">
          <div className="space-y-5 text-sm">
            <div className="p-4 bg-slate-50 border rounded-lg flex justify-between gap-4">
              <div>
                <h3 className="font-bold text-base">{viewingReport.jobTitle}</h3>
                <p className="text-xs mt-1">{viewingReport.company} · Job ID: {viewingReport.jobId}</p>
              </div>
              <StatusBadge status={viewingReport.status} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Người báo cáo</span>
                <p className="font-semibold mt-1">{viewingReport.reporterName}</p>
                <p className="text-xs text-slate-500">{viewingReport.reporterEmail}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Ngày gửi</span>
                <p className="mt-1">{formatDate(viewingReport.createdAt)}</p>
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Lý do</span>
              <p className="mt-1 p-3 bg-slate-50 rounded-lg border">{viewingReport.reason}</p>
            </div>
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Mô tả chi tiết</span>
              <p className="mt-1 p-3 bg-slate-50 rounded-lg border whitespace-pre-wrap">{viewingReport.description || 'Không có mô tả bổ sung.'}</p>
            </div>
            {viewingReport.adminNote && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Ghi chú kết quả</span>
                <p className="mt-1 p-3 bg-blue-50 rounded-lg border border-blue-200 whitespace-pre-wrap">{viewingReport.adminNote}</p>
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Lịch sử xử lý</span>
              <div className="mt-2 space-y-2">
                {(viewingReport.history || []).map(item => (
                  <div key={item.id} className="p-3 border rounded-lg text-xs">
                    <div className="flex justify-between gap-2">
                      <strong>{item.fromStatus ? `${STATUS_META[item.fromStatus]?.label} → ` : ''}{STATUS_META[item.toStatus]?.label || item.toStatus}</strong>
                      <span className="text-slate-500">{formatDate(item.createdAt)}</span>
                    </div>
                    <p className="text-slate-500 mt-1">Thực hiện bởi: {item.changedByEmail || item.changedBy}</p>
                    {item.adminNote && <p className="mt-1">{item.adminNote}</p>}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t">
              {viewingReport.status === 'PENDING' && (
                <button onClick={() => openAction(viewingReport, 'REVIEWING')} className="btn btn-primary text-xs">
                  <ShieldCheck size={14} /> Tiếp nhận
                </button>
              )}
              {viewingReport.status === 'REVIEWING' && (
                <>
                  <button onClick={() => openAction(viewingReport, 'DISMISSED')} className="btn btn-secondary text-xs">
                    Bác bỏ
                  </button>
                  <button onClick={() => openAction(viewingReport, 'RESOLVED')} className="btn btn-primary text-xs">
                    Hoàn tất
                  </button>
                </>
              )}
              <button onClick={() => setViewingReport(null)} className="btn btn-secondary text-xs">Đóng</button>
            </div>
          </div>
        </Modal>
      )}

      {action && (
        <Modal
          isOpen
          onClose={() => !saving && setAction(null)}
          title={action.targetStatus === 'REVIEWING' ? 'Tiếp nhận báo cáo' : action.targetStatus === 'RESOLVED' ? 'Hoàn tất xử lý' : 'Bác bỏ báo cáo'}
        >
          <div className="space-y-4 text-sm">
            <p>Chuyển báo cáo sang <strong>{STATUS_META[action.targetStatus].label}</strong>.</p>
            {['RESOLVED', 'DISMISSED'].includes(action.targetStatus) && (
              <div>
                <label className="form-label">Ghi chú xử lý <span className="text-rose-500">*</span></label>
                <textarea
                  className="form-control h-28"
                  value={adminNote}
                  onChange={event => { setAdminNote(event.target.value); setError(''); }}
                  placeholder="Nêu kết quả xác minh và căn cứ xử lý..."
                />
              </div>
            )}
            {error && <p role="alert" className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">{error}</p>}
            <div className="flex justify-end gap-2 pt-3 border-t">
              <button disabled={saving} onClick={() => setAction(null)} className="btn btn-secondary">Hủy</button>
              <button disabled={saving} onClick={submitAction} className="btn btn-primary disabled:opacity-60">
                {saving ? 'Đang lưu...' : 'Xác nhận'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
