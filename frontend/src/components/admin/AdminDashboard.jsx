import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  Building2,
  Layers,
  ShieldAlert,
  Users,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronRight,
  RefreshCw,
  ExternalLink,
  Clock,
  AlertCircle
} from 'lucide-react';

export function AdminDashboard() {
  const {
    employerVerifications,
    jobs,
    reportedJobs,
    usersDB,
    setActivePage,
    handleApproveVerification,
    handleRejectVerification,
    handleApproveJobModeration,
    handleRejectJobModeration,
    showToast
  } = useApp();

  const [rejectingVerifyId, setRejectingVerifyId] = useState(null);
  const [verifyRejectReason, setVerifyRejectReason] = useState('');

  const [rejectingJobId, setRejectingJobId] = useState(null);
  const [jobRejectReason, setJobRejectReason] = useState('');

  // Counters
  const pendingVerificationsCount = employerVerifications.filter(v => v.status === 'Pending').length;
  const pendingJobsCount = jobs.filter(j => j.moderationStatus === 'PENDING' || (!j.moderationStatus && j.verifiedStatus === 'Pending')).length;
  const pendingReportsCount = reportedJobs.filter(r => r.status === 'Pending').length;
  const activeUsersCount = usersDB.filter(u => u.status === 'ACTIVE').length;

  const pendingVerificationsQueue = employerVerifications.filter(v => v.status === 'Pending');
  const recentReports = reportedJobs.slice(0, 5);
  const pendingJobsQueue = jobs.filter(j => j.moderationStatus === 'PENDING' || (!j.moderationStatus && j.verifiedStatus === 'Pending'));

  const confirmRejectVerification = (e) => {
    e.preventDefault();
    if (!verifyRejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối xác minh.', 'danger');
      return;
    }
    handleRejectVerification(rejectingVerifyId, verifyRejectReason);
    setRejectingVerifyId(null);
    setVerifyRejectReason('');
  };

  const confirmRejectJob = (e) => {
    e.preventDefault();
    if (!jobRejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối tin tuyển dụng.', 'danger');
      return;
    }
    handleRejectJobModeration(rejectingJobId, jobRejectReason);
    setRejectingJobId(null);
    setJobRejectReason('');
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Admin Overview
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Giám sát hoạt động tuyển dụng, xác minh doanh nghiệp và kiểm duyệt hệ thống.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => showToast('Đã đồng bộ và làm mới dữ liệu hệ thống!', 'success')}
            className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg flex items-center gap-2 border border-slate-200 shadow-2xs hover:bg-slate-50 cursor-pointer"
          >
            <RefreshCw size={15} /> Làm mới dữ liệu
          </button>
        </div>
      </div>

      {/* 2. 4 Enterprise KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div
          onClick={() => setActivePage('admin-verifications')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Doanh nghiệp chờ xác minh
            </span>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pendingVerificationsCount}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
              Cần xử lý
            </span>
          </div>
        </div>

        <div
          onClick={() => setActivePage('admin-job-moderation')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-blue-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Tin tuyển dụng chờ duyệt
            </span>
            <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pendingJobsCount}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
              Chờ kiểm duyệt
            </span>
          </div>
        </div>

        <div
          onClick={() => setActivePage('admin-reports')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-rose-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Báo cáo chưa xử lý
            </span>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <ShieldAlert size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {pendingReportsCount}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
              Cảnh báo
            </span>
          </div>
        </div>

        <div
          onClick={() => setActivePage('admin-user-management')}
          className="bg-white p-5 rounded-xl border border-slate-200/90 shadow-xs hover:border-emerald-400 hover:shadow-sm transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Người dùng đang hoạt động
            </span>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {activeUsersCount}
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Đang hoạt động
            </span>
          </div>
        </div>
      </div>

      {/* 3. Main Grid: Left Verification Queue / Right Recent Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 65%: Employer Verification Queue */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Hồ sơ doanh nghiệp chờ xác minh
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Kiểm tra Giấy phép kinh doanh và phê duyệt trạng thái doanh nghiệp
              </p>
            </div>
            <button
              onClick={() => setActivePage('admin-verifications')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả ({employerVerifications.length}) <ChevronRight size={14} />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                  <th className="py-3.5 px-4">Doanh nghiệp</th>
                  <th className="py-3.5 px-4">Người đại diện</th>
                  <th className="py-3.5 px-4">Mã số thuế</th>
                  <th className="py-3.5 px-4">Ngày nộp</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
                {pendingVerificationsQueue.map(ver => (
                  <tr key={ver.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-900">{ver.companyName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ver.industry} • {ver.location}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{ver.representative || ver.recruiterName || 'Chưa cập nhật'}</td>
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-800">{ver.taxId || '0388990011'}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-500">{ver.submittedDate}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleApproveVerification(ver.id)}
                          className="btn btn-primary text-xs font-semibold h-8 px-3 rounded-lg shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 size={13} className="mr-1 inline" /> Phê duyệt
                        </button>
                        <button
                          onClick={() => setRejectingVerifyId(ver.id)}
                          className="btn btn-danger text-xs font-semibold h-8 px-3 rounded-lg cursor-pointer"
                        >
                          <XCircle size={13} className="mr-1 inline" /> Từ chối
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {pendingVerificationsQueue.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                      Hiện không có hồ sơ doanh nghiệp nào đang chờ duyệt.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 35%: Recent Reports */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Báo cáo vi phạm gần đây
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Phản ánh tin giả mạo từ ứng viên</p>
            </div>
            <button
              onClick={() => setActivePage('admin-reports')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
            >
              Xem tất cả ({reportedJobs.length}) <ChevronRight size={14} />
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[380px]">
            {recentReports.map(rep => (
              <div
                key={rep.id}
                onClick={() => setActivePage('admin-reports')}
                className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-100 hover:border-blue-300 transition-all space-y-1.5 cursor-pointer group"
                title="Bấm để xem và xử lý báo cáo vi phạm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 truncate">
                    {rep.jobTitle || 'Tin tuyển dụng'}
                  </span>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                    ['RESOLVED', 'Resolved'].includes(rep.status) ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                    ['DISMISSED', 'Dismissed'].includes(rep.status) ? 'bg-slate-100 text-slate-700' :
                    ['REVIEWING', 'Reviewing'].includes(rep.status) ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                    'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {['RESOLVED', 'Resolved'].includes(rep.status) ? 'Đã xử lý' : ['DISMISSED', 'Dismissed'].includes(rep.status) ? 'Đã bác bỏ' : ['REVIEWING', 'Reviewing'].includes(rep.status) ? 'Đang xác minh' : 'Chờ xử lý'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 line-clamp-2">
                  <span className="font-semibold text-slate-700">Lý do:</span> {rep.reason}
                </p>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Bởi: {rep.reporterEmail || 'Ứng viên'}</span>
                  <span>{rep.createdAt || 'Hôm nay'}</span>
                </div>
              </div>
            ))}

            {recentReports.length === 0 && (
              <div className="text-center py-10 text-slate-400 text-sm">
                Không có báo cáo vi phạm nào.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Job Moderation Queue Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Hàng đợi kiểm duyệt tin tuyển dụng
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Tin tuyển dụng mới gửi từ nhà tuyển dụng chờ phê duyệt hiển thị công khai
            </p>
          </div>
          <button
            onClick={() => setActivePage('admin-job-moderation')}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
          >
            Mở trang kiểm duyệt ({jobs.length}) <ChevronRight size={14} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Tin tuyển dụng</th>
                <th className="py-3.5 px-4">Doanh nghiệp</th>
                <th className="py-3.5 px-4">Mức lương</th>
                <th className="py-3.5 px-4">Hạn nộp</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {pendingJobsQueue.map(job => (
                <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-slate-900">{job.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{job.category} • {job.level || 'Fresher/Junior'}</p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{job.company}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{job.salary || 'Thỏa thuận'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{job.deadline || '30/10/2026'}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleApproveJobModeration(job.id)}
                        className="btn btn-primary text-xs font-semibold h-8 px-3 rounded-lg shadow-2xs cursor-pointer"
                      >
                        <CheckCircle2 size={13} className="mr-1 inline" /> Phê duyệt
                      </button>
                      <button
                        onClick={() => setRejectingJobId(job.id)}
                        className="btn btn-danger text-xs font-semibold h-8 px-3 rounded-lg cursor-pointer"
                      >
                        <XCircle size={13} className="mr-1 inline" /> Từ chối
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {pendingJobsQueue.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-slate-400 text-sm">
                    Tất cả tin tuyển dụng đã được kiểm duyệt.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Verification Modal */}
      {rejectingVerifyId && (
        <Modal
          isOpen={!!rejectingVerifyId}
          onClose={() => setRejectingVerifyId(null)}
          title="Từ chối xác minh doanh nghiệp"
        >
          <form onSubmit={confirmRejectVerification} className="space-y-4">
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <span>Vui lòng nhập lý do từ chối cụ thể để thông báo và hướng dẫn doanh nghiệp bổ sung giấy tờ hợp lệ.</span>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Lý do từ chối *</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                placeholder="Ví dụ: Giấy phép kinh doanh bị mờ, không khớp Mã số thuế, hoặc đã hết hiệu lực..."
                value={verifyRejectReason}
                onChange={e => setVerifyRejectReason(e.target.value)}
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

      {/* Reject Job Modal */}
      {rejectingJobId && (
        <Modal
          isOpen={!!rejectingJobId}
          onClose={() => setRejectingJobId(null)}
          title="Từ chối tin tuyển dụng"
        >
          <form onSubmit={confirmRejectJob} className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>Lý do từ chối sẽ được lưu vào lịch sử và gửi thông báo phản hồi tới nhà tuyển dụng.</span>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Lý do từ chối *</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                placeholder="Ví dụ: Mô tả công việc vi phạm tiêu chuẩn cộng đồng, mức lương không rõ ràng..."
                value={jobRejectReason}
                onChange={e => setJobRejectReason(e.target.value)}
                required
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRejectingJobId(null)}
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
