import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Lock,
  Search,
  AlertCircle,
  ShieldAlert,
  FileText,
  Calendar,
  Building2,
  User,
  X
} from 'lucide-react';

export function ReportManagementPage() {
  const { reportedJobs, handleDismissReport, handleResolveReport, showToast } = useApp();

  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending', 'Resolved', 'Dismissed'
  const [searchQuery, setSearchQuery] = useState('');
  const [viewingReport, setViewingReport] = useState(null);
  const [resolvingReport, setResolvingReport] = useState(null);

  // Tabs Filter
  const pendingReports = reportedJobs.filter(r => r.status === 'Pending' || !r.status);
  const resolvedReports = reportedJobs.filter(r => r.status === 'Resolved');
  const dismissedReports = reportedJobs.filter(r => r.status === 'Dismissed');

  const currentTabReports = activeTab === 'Pending'
    ? pendingReports
    : activeTab === 'Resolved'
    ? resolvedReports
    : dismissedReports;

  const filteredReports = currentTabReports.filter(rep => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (rep.jobTitle && rep.jobTitle.toLowerCase().includes(q)) ||
      (rep.company && rep.company.toLowerCase().includes(q)) ||
      (rep.reason && rep.reason.toLowerCase().includes(q)) ||
      (rep.reporterEmail && rep.reporterEmail.toLowerCase().includes(q))
    );
  });

  const confirmResolveReport = () => {
    if (resolvingReport) {
      handleResolveReport(resolvingReport.id, 'remove_job');
      setResolvingReport(null);
      if (viewingReport && viewingReport.id === resolvingReport.id) {
        setViewingReport(null);
      }
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Báo cáo vi phạm
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Xử lý các báo cáo về tin tuyển dụng giả mạo, yêu cầu nộp cọc hoặc có dấu hiệu vi phạm điều khoản từ ứng viên.
          </p>
        </div>
      </div>

      {/* 2. Toolbar: Search & Segmented Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="Tìm theo tiêu đề việc làm, công ty, người báo cáo hoặc lý do..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X size={15} />
            </button>
          )}
        </div>

        {/* Segmented Status Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 self-start md:self-auto shrink-0">
          <button
            onClick={() => setActiveTab('Pending')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'Pending' ? 'bg-white text-rose-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chờ xử lý ({pendingReports.length})
          </button>
          <button
            onClick={() => setActiveTab('Resolved')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'Resolved' ? 'bg-white text-emerald-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã xử lý ({resolvedReports.length})
          </button>
          <button
            onClick={() => setActiveTab('Dismissed')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'Dismissed' ? 'bg-white text-slate-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã bác bỏ ({dismissedReports.length})
          </button>
        </div>
      </div>

      {/* 3. Enterprise Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Tin bị báo cáo</th>
                <th className="py-3.5 px-4">Doanh nghiệp</th>
                <th className="py-3.5 px-4">Người báo cáo</th>
                <th className="py-3.5 px-4">Nội dung vi phạm</th>
                <th className="py-3.5 px-4">Ngày gửi</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {filteredReports.map(rep => (
                <tr key={rep.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-bold text-slate-900 truncate">{rep.jobTitle || 'Tin tuyển dụng'}</p>
                    <p className="text-xs text-slate-500 mt-0.5">ID: {rep.jobId || rep.id}</p>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{rep.company || 'Đang cập nhật'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">
                    <p className="font-semibold text-slate-800">{rep.reporterName || 'Ứng viên'}</p>
                    <p className="text-slate-500">{rep.reporterEmail || 'candidate@gmail.com'}</p>
                  </td>
                  <td className="py-3.5 px-4 max-w-sm">
                    <p className="text-xs text-slate-800 line-clamp-2 leading-relaxed font-medium">
                      {rep.reason}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-500 whitespace-nowrap">{rep.createdAt || '15/09/2026'}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    {activeTab === 'Pending' && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                        <AlertCircle size={13} /> Chờ xử lý
                      </span>
                    )}
                    {activeTab === 'Resolved' && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 size={13} /> Đã xử lý vi phạm
                      </span>
                    )}
                    {activeTab === 'Dismissed' && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 inline-flex items-center gap-1">
                        <XCircle size={13} /> Đã bác bỏ
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingReport(rep)}
                        className="btn btn-secondary text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
                        title="Xem chi tiết báo cáo"
                      >
                        <Eye size={13} className="mr-1 inline" /> Chi tiết
                      </button>
                      {activeTab === 'Pending' && (
                        <>
                          <button
                            onClick={() => setResolvingReport(rep)}
                            className="btn btn-danger text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                            title="Xác nhận vi phạm & gỡ tin"
                          >
                            <Trash2 size={13} className="mr-1 inline" /> Xử lý
                          </button>
                          <button
                            onClick={() => handleDismissReport(rep.id)}
                            className="btn btn-secondary text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                            title="Bác bỏ báo cáo nếu không có vi phạm"
                          >
                            Bác bỏ
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {filteredReports.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    Không có báo cáo nào trong danh mục này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Report Detail Modal */}
      {viewingReport && (
        <Modal
          isOpen={!!viewingReport}
          onClose={() => setViewingReport(null)}
          title="Chi tiết Báo cáo vi phạm"
        >
          <div className="space-y-5 text-sm">
            {/* Header info card */}
            <div className="p-4 bg-rose-50/50 border border-rose-200 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewingReport.jobTitle || 'Tin tuyển dụng'}</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Doanh nghiệp: <span className="font-semibold text-slate-900">{viewingReport.company || 'Đang cập nhật'}</span>
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                {viewingReport.status === 'Resolved' ? 'Đã xử lý' : viewingReport.status === 'Dismissed' ? 'Đã bác bỏ' : 'Chờ xử lý'}
              </span>
            </div>

            {/* Reporter details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Người gửi báo cáo</label>
                <p className="font-semibold text-slate-900 mt-1">{viewingReport.reporterName || 'Ứng viên'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{viewingReport.reporterEmail || 'candidate@gmail.com'}</p>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Thời gian báo cáo</label>
                <p className="font-semibold text-slate-900 mt-1">{viewingReport.createdAt || '15/09/2026'}</p>
              </div>
            </div>

            {/* Violation Statement */}
            <div>
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
                Nội dung tường trình vi phạm
              </label>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-line font-medium">
                {viewingReport.reason}
              </div>
            </div>

            {/* Actions in Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingReport(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              {viewingReport.status !== 'Resolved' && viewingReport.status !== 'Dismissed' && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      handleDismissReport(viewingReport.id);
                      setViewingReport(null);
                    }}
                    className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer"
                  >
                    Bác bỏ báo cáo
                  </button>
                  <button
                    type="button"
                    onClick={() => setResolvingReport(viewingReport)}
                    className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer shadow-xs"
                  >
                    <Trash2 size={15} className="mr-1.5 inline" /> Xác nhận vi phạm & Gỡ tin
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Resolve Violation Confirmation Modal */}
      {resolvingReport && (
        <Modal
          isOpen={!!resolvingReport}
          onClose={() => setResolvingReport(null)}
          title="Xử lý vi phạm tin tuyển dụng"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>
                Hệ thống sẽ ngay lập tức gỡ bài đăng khỏi nền tảng, khóa tài khoản nhà tuyển dụng vi phạm và đánh dấu báo cáo là Đã xử lý.
              </span>
            </div>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn xác nhận xử lý vi phạm đối với tin <strong className="text-slate-900">{resolvingReport.jobTitle}</strong> không?
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setResolvingReport(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmResolveReport}
                className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Xác nhận gỡ tin & Khóa
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
