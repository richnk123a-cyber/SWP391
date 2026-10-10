import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Calendar,
  MapPin,
  Briefcase,
  AlertCircle,
  Building2,
  DollarSign,
  Search,
  X,
  Layers,
  Clock
} from 'lucide-react';

export function JobModerationPage() {
  const {
    jobs,
    handleApproveJobModeration,
    handleRejectJobModeration,
    handleRemoveApprovedJob,
    showToast
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('PENDING'); // 'PENDING', 'APPROVED', 'REJECTED'
  const [viewingJob, setViewingJob] = useState(null);
  const [rejectingJobId, setRejectingJobId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [removingJobId, setRemovingJobId] = useState(null);

  // Filtered lists
  const pendingJobs = useMemo(
    () => jobs.filter(j => j.moderationStatus === 'PENDING' || (!j.moderationStatus && j.verifiedStatus === 'Pending')),
    [jobs]
  );
  const approvedJobs = useMemo(
    () => jobs.filter(j => j.moderationStatus === 'APPROVED' || (!j.moderationStatus && j.verifiedStatus === 'Verified')),
    [jobs]
  );
  const rejectedJobs = useMemo(
    () => jobs.filter(j => j.moderationStatus === 'REJECTED'),
    [jobs]
  );

  const currentTabJobs = useMemo(() => {
    const list = activeTab === 'PENDING' ? pendingJobs : activeTab === 'APPROVED' ? approvedJobs : rejectedJobs;
    if (!searchQuery.trim()) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      (j.category && j.category.toLowerCase().includes(q))
    );
  }, [activeTab, pendingJobs, approvedJobs, rejectedJobs, searchQuery]);

  const confirmReject = (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối tin tuyển dụng.', 'danger');
      return;
    }
    handleRejectJobModeration(rejectingJobId, rejectionReason);
    setRejectingJobId(null);
    setRejectionReason('');
    if (viewingJob && viewingJob.id === rejectingJobId) {
      setViewingJob(null);
    }
  };

  const confirmRemoveApproved = () => {
    if (removingJobId) {
      handleRemoveApprovedJob(removingJobId);
      setRemovingJobId(null);
      if (viewingJob && viewingJob.id === removingJobId) {
        setViewingJob(null);
      }
    }
  };

  return (
    <div className="w-full space-y-6 sm:space-y-8">
      {/* 1. Page Header */}
      <div className="bg-white p-6 sm:p-7 rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Kiểm duyệt tin tuyển dụng
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
            Giám sát chất lượng tin đăng từ nhà tuyển dụng, phê duyệt hiển thị công khai hoặc từ chối kèm lý do.
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
            placeholder="Tìm theo tiêu đề tin tuyển dụng, tên công ty hoặc chuyên ngành..."
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
            onClick={() => setActiveTab('PENDING')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'PENDING' ? 'bg-white text-blue-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Chờ kiểm duyệt ({pendingJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('APPROVED')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'APPROVED' ? 'bg-white text-emerald-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã phê duyệt ({approvedJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('REJECTED')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'REJECTED' ? 'bg-white text-rose-900 font-bold shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã từ chối ({rejectedJobs.length})
          </button>
        </div>
      </div>

      {/* 3. Enterprise Table */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3.5 px-4">Tin tuyển dụng</th>
                <th className="py-3.5 px-4">Doanh nghiệp</th>
                <th className="py-3.5 px-4">Mức lương</th>
                <th className="py-3.5 px-4">Hạn nộp hồ sơ</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-800 font-medium">
              {currentTabJobs.map(job => (
                <tr key={job.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 max-w-xs">
                    <p className="font-bold text-slate-900 truncate">{job.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">
                      {job.category} • {job.level || 'Fresher/Junior'} • {job.location}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-semibold">{job.company}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{job.salary || 'Thỏa thuận'}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{job.deadline || '30/10/2026'}</td>
                  <td className="py-3.5 px-4">
                    {activeTab === 'PENDING' && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200 inline-flex items-center gap-1">
                        <Clock size={13} /> Chờ kiểm duyệt
                      </span>
                    )}
                    {activeTab === 'APPROVED' && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 inline-flex items-center gap-1">
                        <CheckCircle2 size={13} /> Đã phê duyệt
                      </span>
                    )}
                    {activeTab === 'REJECTED' && (
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200 inline-flex items-center gap-1">
                        <XCircle size={13} /> Đã từ chối
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setViewingJob(job)}
                        className="btn btn-secondary text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs cursor-pointer"
                        title="Xem nội dung chi tiết tin đăng"
                      >
                        <Eye size={13} className="mr-1 inline" /> Chi tiết
                      </button>
                      {activeTab === 'PENDING' && (
                        <>
                          <button
                            onClick={() => handleApproveJobModeration(job.id)}
                            className="btn btn-primary text-xs font-semibold h-8 px-2.5 rounded-lg shadow-2xs cursor-pointer"
                          >
                            <CheckCircle2 size={13} className="mr-1 inline" /> Phê duyệt
                          </button>
                          <button
                            onClick={() => setRejectingJobId(job.id)}
                            className="btn btn-danger text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                          >
                            <XCircle size={13} className="mr-1 inline" /> Từ chối
                          </button>
                        </>
                      )}
                      {activeTab === 'APPROVED' && (
                        <button
                          onClick={() => setRemovingJobId(job.id)}
                          className="btn btn-danger text-xs font-semibold h-8 px-2.5 rounded-lg cursor-pointer"
                          title="Gỡ tin này khỏi hệ thống công khai"
                        >
                          <Trash2 size={13} className="mr-1 inline" /> Gỡ tin
                        </button>
                      )}
                      {activeTab === 'REJECTED' && (
                        <button
                          onClick={() => handleApproveJobModeration(job.id)}
                          className="btn btn-primary text-xs font-semibold h-8 px-2.5 rounded-lg shadow-2xs cursor-pointer"
                        >
                          <CheckCircle2 size={13} className="mr-1 inline" /> Duyệt lại
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {currentTabJobs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                    Không có tin tuyển dụng nào trong danh sách này.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Job Detail Modal */}
      {viewingJob && (
        <Modal
          isOpen={!!viewingJob}
          onClose={() => setViewingJob(null)}
          title={`Chi tiết tin: ${viewingJob.title}`}
        >
          <div className="space-y-5 text-sm">
            {/* Header info box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">{viewingJob.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  <span className="font-semibold text-slate-800">{viewingJob.company}</span> • {viewingJob.location} • {viewingJob.jobType || 'Full-time'}
                </p>
              </div>
              <div>
                {viewingJob.moderationStatus === 'APPROVED' ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Đang hiển thị công khai
                  </span>
                ) : viewingJob.moderationStatus === 'REJECTED' ? (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-50 text-rose-800 border border-rose-200">
                    Đã từ chối kiểm duyệt
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                    Đang chờ kiểm duyệt
                  </span>
                )}
              </div>
            </div>

            {/* Quick specifications grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Mức lương</span>
                <p className="font-bold text-slate-900 mt-0.5">{viewingJob.salary || 'Thỏa thuận'}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Kinh nghiệm</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingJob.experience || 'Không yêu cầu'}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Số lượng</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingJob.quantity || '02 người'}</p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Hạn nộp</span>
                <p className="font-semibold text-slate-800 mt-0.5">{viewingJob.deadline || '30/10/2026'}</p>
              </div>
            </div>

            {/* Skills Requirement tags */}
            {viewingJob.skills && viewingJob.skills.length > 0 && (
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                  Kỹ năng yêu cầu
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {viewingJob.skills.map((s, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md text-xs font-semibold border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description & Requirements */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Mô tả công việc
                </label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700 whitespace-pre-line max-h-48 overflow-y-auto">
                  {viewingJob.description || 'Mô tả công việc chi tiết từ nhà tuyển dụng.'}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Yêu cầu ứng viên
                </label>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700 whitespace-pre-line max-h-36 overflow-y-auto">
                  {viewingJob.requirements || 'Yêu cầu năng lực chuyên môn và kỹ năng mềm.'}
                </div>
              </div>
            </div>

            {/* Rejection reason if any */}
            {viewingJob.rejectionReason && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 space-y-1">
                <p className="font-bold">Lý do từ chối trước đó:</p>
                <p>{viewingJob.rejectionReason}</p>
              </div>
            )}

            {/* Actions in Modal Footer */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setViewingJob(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Đóng
              </button>
              {viewingJob.moderationStatus === 'APPROVED' ? (
                <button
                  type="button"
                  onClick={() => setRemovingJobId(viewingJob.id)}
                  className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
                >
                  <Trash2 size={15} className="mr-1.5 inline" /> Gỡ bài đăng
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setRejectingJobId(viewingJob.id)}
                    className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
                  >
                    <XCircle size={15} className="mr-1.5 inline" /> Từ chối
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleApproveJobModeration(viewingJob.id);
                      setViewingJob(null);
                    }}
                    className="btn btn-primary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer shadow-xs"
                  >
                    <CheckCircle2 size={15} className="mr-1.5 inline" /> Phê duyệt tin đăng
                  </button>
                </>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* 5. Reject Job Modal */}
      {rejectingJobId && (
        <Modal
          isOpen={!!rejectingJobId}
          onClose={() => setRejectingJobId(null)}
          title="Từ chối tin tuyển dụng"
        >
          <form onSubmit={confirmReject} className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>Lý do từ chối sẽ được lưu lại và gửi thông báo cho nhà tuyển dụng để họ chỉnh sửa bài đăng.</span>
            </div>

            <div className="form-group">
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Lý do từ chối *</label>
              <textarea
                className="w-full p-3 border border-slate-300 rounded-lg text-sm text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                rows={4}
                placeholder="Ví dụ: Nội dung công việc không rõ ràng, yêu cầu đặt cọc phí, mức lương không minh bạch..."
                value={rejectionReason}
                onChange={e => setRejectionReason(e.target.value)}
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

      {/* 6. Remove Approved Job Modal */}
      {removingJobId && (
        <Modal
          isOpen={!!removingJobId}
          onClose={() => setRemovingJobId(null)}
          title="Xác nhận gỡ tin tuyển dụng"
        >
          <div className="space-y-4">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <span>Hành động này sẽ ẩn tin tuyển dụng khỏi bảng tin tìm việc công khai của ứng viên ngay lập tức.</span>
            </div>
            <p className="text-sm text-slate-700">
              Bạn có chắc chắn muốn gỡ bỏ tin tuyển dụng này khỏi hệ thống không?
            </p>
            <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setRemovingJobId(null)}
                className="btn btn-secondary text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmRemoveApproved}
                className="btn btn-danger text-sm font-semibold h-10 px-4 rounded-lg cursor-pointer"
              >
                Gỡ tin ngay
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
