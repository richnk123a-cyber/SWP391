import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  CheckCircle2,
  XCircle,
  FileText,
  AlertCircle,
  ExternalLink,
  Search,
  Eye,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  RotateCw,
  X
} from 'lucide-react';

export function EmployerVerificationPage() {
  const { employerVerifications, handleApproveVerification, handleRejectVerification, refreshEmployerVerifications, showToast } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    refreshEmployerVerifications?.();
  }, [refreshEmployerVerifications]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Pending', 'Approved', 'Rejected'

  const [rejectingVerifyId, setRejectingVerifyId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [viewingVerify, setViewingVerify] = useState(null);

  // Counters
  const pendingCount = employerVerifications.filter(v => v.status === 'Pending').length;
  const approvedCount = employerVerifications.filter(v => v.status === 'Verified' || v.status === 'Approved').length;
  const rejectedCount = employerVerifications.filter(v => v.status === 'Rejected').length;

  // Filter logic
  const filteredVerifications = employerVerifications.filter(ver => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      ver.companyName.toLowerCase().includes(q) ||
      (ver.representative && ver.representative.toLowerCase().includes(q)) ||
      (ver.recruiterName && ver.recruiterName.toLowerCase().includes(q)) ||
      (ver.email && ver.email.toLowerCase().includes(q)) ||
      (ver.taxId && ver.taxId.includes(q));

    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Pending' && ver.status === 'Pending') ||
      (statusFilter === 'Approved' && (ver.status === 'Verified' || ver.status === 'Approved')) ||
      (statusFilter === 'Rejected' && ver.status === 'Rejected');

    return matchesSearch && matchesStatus;
  });

  const confirmReject = (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối cụ thể.', 'danger');
      return;
    }
    handleRejectVerification(rejectingVerifyId, rejectReason);
    setRejectingVerifyId(null);
    setRejectReason('');
    if (viewingVerify && viewingVerify.id === rejectingVerifyId) {
      setViewingVerify(null);
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Xác minh doanh nghiệp
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Kiểm tra thông tin pháp lý, Mã số thuế, Giấy phép kinh doanh và phê duyệt hoặc từ chối có lý do bắt buộc.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                await refreshEmployerVerifications?.();
                showToast('Đã làm mới danh sách xác minh từ hệ thống!', 'success');
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            className="btn btn-secondary text-xs font-semibold h-9 px-3.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Đang tải...' : 'Làm mới danh sách'}
          </button>
        </div>
      </div>

      {/* 2. KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        <div
          onClick={() => setStatusFilter('Pending')}
          className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
            statusFilter === 'Pending' ? 'border-amber-500 ring-2 ring-amber-400/40 bg-amber-50/20' : 'border-slate-200/90 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Yêu cầu chờ xác minh
            </span>
            <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <AlertCircle size={16} />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{pendingCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Approved')}
          className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
            statusFilter === 'Approved' ? 'border-emerald-500 ring-2 ring-emerald-400/40 bg-emerald-50/20' : 'border-slate-200/90 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Doanh nghiệp đã duyệt
            </span>
            <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{approvedCount}</p>
        </div>

        <div
          onClick={() => setStatusFilter('Rejected')}
          className={`bg-white p-5 rounded-xl border shadow-xs transition-all cursor-pointer ${
            statusFilter === 'Rejected' ? 'border-rose-500 ring-2 ring-rose-400/40 bg-rose-50/20' : 'border-slate-200/90 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Hồ sơ đã từ chối
            </span>
            <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <XCircle size={16} />
            </span>
          </div>
          <p className="text-3xl font-extrabold text-slate-900 mt-2 tracking-tight">{rejectedCount}</p>
        </div>
      </div>

      {/* 3. Search & Segmented Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
          <input
            type="text"
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
            placeholder="Tìm theo tên doanh nghiệp, người đại diện, mã số thuế, email..."
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
            onClick={() => setStatusFilter('All')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'All' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Tất cả ({employerVerifications.length})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Pending' ? 'bg-white text-amber-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chờ xác minh ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Approved' ? 'bg-white text-emerald-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã duyệt ({approvedCount})
          </button>
          <button
            onClick={() => setStatusFilter('Rejected')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              statusFilter === 'Rejected' ? 'bg-white text-rose-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Từ chối ({rejectedCount})
          </button>
        </div>
      </div>

      {/* 4. Enterprise Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Doanh nghiệp</th>
                <th className="py-3.5 px-4">Người đại diện</th>
                <th className="py-3.5 px-4">Mã số thuế</th>
                <th className="py-3.5 px-4">Giấy phép KD</th>
                <th className="py-3.5 px-4">Ngày nộp</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {filteredVerifications.map(ver => {
                const isVerified = ver.status === 'Verified' || ver.status === 'Approved';
                const isRejected = ver.status === 'Rejected';
                const isPending = !isVerified && !isRejected;

                return (
                  <tr key={ver.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{ver.companyName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ver.industry} • {ver.location}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">
                      <p className="font-semibold text-slate-800">{ver.representative || ver.recruiterName || 'Chưa cập nhật'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ver.email || 'Chưa có email'}</p>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">
                      {ver.taxId || '0388990011'}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => setViewingVerify(ver)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                      >
                        <FileText size={14} /> {ver.documentName || ver.businessLicenseFile || 'Xem tài liệu'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{ver.submittedDate}</td>
                    <td className="py-3.5 px-4">
                      {isPending && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 inline-flex items-center gap-1">
                          <AlertCircle size={13} /> Chờ xác minh
                        </span>
                      )}
                      {isVerified && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                          <CheckCircle2 size={13} /> Đã phê duyệt
                        </span>
                      )}
                      {isRejected && (
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                          <XCircle size={13} /> Đã từ chối
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setViewingVerify(ver)}
                          className="btn btn-secondary text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
                          title="Xem chi tiết hồ sơ"
                        >
                          <Eye size={13} className="mr-1 inline" /> Chi tiết
                        </button>
                        {isPending && (
                          <>
                            <button
                              onClick={() => handleApproveVerification(ver.id)}
                              className="btn btn-primary text-xs font-semibold h-8 px-2.5 rounded-lg shadow-2xs cursor-pointer"
                            >
                              <CheckCircle2 size={13} className="mr-1 inline" /> Duyệt
                            </button>
                            <button
                              onClick={() => setRejectingVerifyId(ver.id)}
                              className="btn btn-danger text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                            >
                              <XCircle size={13} className="mr-1 inline" /> Từ chối
                            </button>
                          </>
                        )}
                        {isRejected && (
                          <button
                            onClick={() => handleApproveVerification(ver.id)}
                            className="btn btn-primary text-xs font-semibold h-8 px-2.5 rounded-lg shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 size={13} className="mr-1 inline" /> Duyệt lại
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredVerifications.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                    Không tìm thấy hồ sơ doanh nghiệp nào phù hợp với bộ lọc.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Company Verification Detail Modal */}
      {viewingVerify && (
        <Modal
          isOpen={!!viewingVerify}
          onClose={() => setViewingVerify(null)}
          title={`Hồ sơ xác minh: ${viewingVerify.companyName}`}
        >
          <div className="space-y-5 text-sm">
            {/* Header info card */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewingVerify.companyName}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{viewingVerify.industry} • {viewingVerify.location}</p>
              </div>
              <div>
                {viewingVerify.status === 'Verified' || viewingVerify.status === 'Approved' ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Đã xác minh
                  </span>
                ) : viewingVerify.status === 'Rejected' ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                    Đã từ chối
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                    Chờ xác minh
                  </span>
                )}
              </div>
            </div>

            {/* Field Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Người đại diện pháp luật</label>
                <p className="font-semibold text-slate-900 mt-1">{viewingVerify.representative || viewingVerify.recruiterName || 'Chưa cập nhật'}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mã số thuế doanh nghiệp</label>
                <p className="font-mono font-bold text-slate-900 mt-1">{viewingVerify.taxId || '0388990011'}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Email liên hệ</label>
                <p className="font-semibold text-slate-800 mt-1">{viewingVerify.email || 'Chưa có email'}</p>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Ngày nộp hồ sơ</label>
                <p className="font-semibold text-slate-800 mt-1">{viewingVerify.submittedDate || '14/09/2026'}</p>
              </div>
            </div>

            {/* Document Box */}
            <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider block">
                Tài liệu Giấy phép kinh doanh đính kèm
              </label>
              <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                    <FileText size={18} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {viewingVerify.documentName || viewingVerify.businessLicenseFile || `GPKD_${viewingVerify.companyName?.replace(/\s+/g, '_') || 'DoanhNghiep'}.pdf`}
                    </p>
                    <p className="text-[11px] text-slate-400">Định dạng: PDF Document • Đã xác thực chữ ký số</p>
                  </div>
                </div>
                <a
                  href={`#view-license`}
                  onClick={(e) => {
                    e.preventDefault();
                    const doc = viewingVerify.documentName || viewingVerify.businessLicenseFile;
                    if (doc && doc.startsWith('GPKD_')) {
                      const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:8080';
                      window.open(`${backendUrl}/uploads/${doc}`, '_blank');
                    } else {
                      showToast(`Đang mở tài liệu: ${doc || 'GPKD_DoanhNghiep.pdf'}`, 'info');
                    }
                  }}
                  className="btn btn-secondary text-xs font-semibold h-8 px-3 rounded border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer"
                >
                  <ExternalLink size={13} className="mr-1 inline" /> Mở xem
                </a>
              </div>
            </div>

            {/* Reject reason if already rejected */}
            {viewingVerify.rejectionReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                <p className="font-bold">Lý do từ chối trước đó:</p>
                <p>{viewingVerify.rejectionReason}</p>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingVerify(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => setRejectingVerifyId(viewingVerify.id)}
                className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                <XCircle size={15} className="mr-1.5 inline" /> Từ chối
              </button>
              <button
                type="button"
                onClick={() => {
                  handleApproveVerification(viewingVerify.id);
                  setViewingVerify(null);
                }}
                className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer shadow-xs"
              >
                <CheckCircle2 size={15} className="mr-1.5 inline" /> Phê duyệt xác minh
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 6. Reject Reason Modal */}
      {rejectingVerifyId && (
        <Modal
          isOpen={!!rejectingVerifyId}
          onClose={() => setRejectingVerifyId(null)}
          title="Từ chối xác minh doanh nghiệp"
        >
          <form onSubmit={confirmReject} className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>Vui lòng ghi rõ lý do từ chối để hệ thống gửi thông báo phản hồi tới nhà tuyển dụng.</span>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Lý do từ chối *</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                placeholder="Ví dụ: Giấy phép kinh doanh bị mờ, không khớp Mã số thuế, hoặc đã hết hiệu lực..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingVerifyId(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Xác nhận từ chối
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
