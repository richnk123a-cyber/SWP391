import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { VerificationBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { SegmentedControl } from '../common/SegmentedControl';
import {
  Briefcase,
  PlusCircle,
  Search,
  Filter,
  Eye,
  Edit3,
  Users,
  Trash2,
  XCircle,
  CheckCircle2,
  AlertCircle,
  X,
  RotateCcw,
  ArrowUpDown,
  Lock,
  Building2,
  FileText
} from 'lucide-react';

export function JobManagementPage() {
  const {
    currentUser,
    jobs,
    applications,
    employerProfile,
    setActivePage,
    setSelectedJobId,
    handleRemoveApprovedJob
  } = useApp();

  const isVerified = employerProfile.verificationStatus === 'Verified';

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, APPROVED, REJECTED, CLOSED
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('newest'); // newest, deadline, applicants

  // Modals
  const [viewingJob, setViewingJob] = useState(null);
  const [deletingJob, setDeletingJob] = useState(null);

  // Filter employer's own jobs
  const employerJobs = useMemo(() => {
    if (!employerProfile) return [];
    return jobs.filter(j => 
      (currentUser?.id && j.employerId === currentUser.id) ||
      (employerProfile.ownerUserId && j.employerId === employerProfile.ownerUserId) ||
      (employerProfile.id && j.employerId === employerProfile.id) || 
      (employerProfile.companyName && j.company === employerProfile.companyName)
    );
  }, [jobs, employerProfile, currentUser]);

  const filteredJobs = useMemo(() => {
    return employerJobs.filter(job => {
      // Keyword search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = job.title.toLowerCase().includes(q);
        const matchesCat = job.category.toLowerCase().includes(q);
        if (!matchesTitle && !matchesCat) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING' && job.moderationStatus !== 'PENDING') return false;
        if (statusFilter === 'APPROVED' && job.moderationStatus !== 'APPROVED') return false;
        if (statusFilter === 'REJECTED' && job.moderationStatus !== 'REJECTED') return false;
        if (statusFilter === 'CLOSED' && job.publishStatus !== 'CLOSED') return false;
      }

      // Type filter
      if (typeFilter !== 'ALL' && job.jobType !== typeFilter) return false;

      // Category filter
      if (categoryFilter !== 'ALL' && job.category !== categoryFilter) return false;

      return true;
    });
  }, [employerJobs, searchQuery, statusFilter, typeFilter, categoryFilter]);

  // Sorted Jobs
  const sortedJobs = useMemo(() => {
    const list = [...filteredJobs];
    if (sortBy === 'newest') {
      list.sort((a, b) => (b.id > a.id ? 1 : -1));
    } else if (sortBy === 'applicants') {
      list.sort((a, b) => {
        const countA = applications.filter(app => app.jobId === a.id).length;
        const countB = applications.filter(app => app.jobId === b.id).length;
        return countB - countA;
      });
    }
    return list;
  }, [filteredJobs, sortBy, applications]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('ALL');
    setTypeFilter('ALL');
    setCategoryFilter('ALL');
  };

  const confirmDeleteJob = () => {
    if (deletingJob) {
      handleRemoveApprovedJob(deletingJob.id);
      setDeletingJob(null);
    }
  };

  return (
    <div className="employer-workspace employer-jobmanagementpage space-y-6 mx-auto">
      {/* 1. PAGE HEADER */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
              <Briefcase size={18} />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Đăng & Quản lý tin tuyển dụng IT</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Tạo bài đăng tuyển dụng, theo dõi trạng thái kiểm duyệt Admin và quản lý hồ sơ ứng viên.
          </p>
        </div>

        <button
          onClick={() => setActivePage('create-job')}
          disabled={!isVerified}
          className="btn btn-primary text-xs font-bold shadow-xs flex items-center gap-1.5 shrink-0"
        >
          <PlusCircle size={16} /> + Tạo tin mới
        </button>
      </div>

      {/* 2. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
          {/* Search Input */}
          <div className="md:col-span-6 relative">
            <div className="search-input-wrapper">
              <Search className="search-input-icon text-slate-400" size={18} />
              <input
                type="text"
                className="form-control search-input-control text-xs font-medium h-10 bg-slate-50 border-slate-200 focus:bg-white"
                placeholder="Tìm tin tuyển dụng theo vị trí (Java, React, QA...)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          {/* Job Type Dropdown */}
          <div className="md:col-span-3">
            <select
              className="form-control text-xs h-10 bg-slate-50 border-slate-200 font-medium"
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
            >
              <option value="ALL">Tất cả Loại hình</option>
              <option value="Internship">Internship (Thực tập)</option>
              <option value="Fresher">Fresher (Mới ra trường)</option>
              <option value="Full-time">Full-time (Toàn thời gian)</option>
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="md:col-span-3">
            <select
              className="form-control text-xs h-10 bg-slate-50 border-slate-200 font-medium"
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">Tất cả Chuyên ngành</option>
              <option value="Backend Developer">Backend Developer</option>
              <option value="Frontend Developer">Frontend Developer</option>
              <option value="QA / Testing">QA / Testing</option>
              <option value="Mobile Developer">Mobile Developer</option>
            </select>
          </div>
        </div>

        {/* Status Pills & Sort Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <SegmentedControl
            activeTab={statusFilter}
            onChange={setStatusFilter}
            tabs={[
              { id: 'ALL', label: 'Tất cả', activeColor: 'bg-blue-600 shadow-xs' },
              { id: 'APPROVED', label: 'Đã duyệt (Công khai)', activeColor: 'bg-emerald-600 shadow-xs' },
              { id: 'PENDING', label: 'Chờ duyệt Admin', activeColor: 'bg-amber-600 shadow-xs' },
              { id: 'REJECTED', label: 'Bị từ chối', activeColor: 'bg-rose-600 shadow-xs' },
              { id: 'CLOSED', label: 'Đã đóng tuyển', activeColor: 'bg-slate-700 shadow-xs' }
            ]}
          />

          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 shrink-0 flex items-center gap-1">
              <ArrowUpDown size={13} /> Sắp xếp:
            </span>
            <select
              className="form-control text-xs h-8 py-0 px-2 bg-slate-50 border-slate-200 font-medium"
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
            >
              <option value="newest">Mới đăng nhất</option>
              <option value="applicants">Nhiều ứng viên nhất</option>
            </select>

            {(searchQuery || statusFilter !== 'ALL' || typeFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <button onClick={clearFilters} className="text-xs font-semibold text-rose-600 hover:underline ml-2">
                <RotateCcw size={12} className="inline mr-1" /> Xóa bộ lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. JOB MANAGEMENT TABLE */}
      <div className="card p-5 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th className="w-64">Vị trí tuyển dụng</th>
                <th>Chuyên ngành</th>
                <th>Loại hình</th>
                <th>Mức lương</th>
                <th>Ứng viên</th>
                <th>Kiểm duyệt Admin</th>
                <th>Hạn nộp</th>
                <th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {sortedJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400 text-xs">
                    Không tìm thấy tin tuyển dụng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                sortedJobs.map(job => {
                  const appsCount = applications.filter(app => app.jobId === job.id).length;
                  const isPending = job.moderationStatus === 'PENDING';
                  const isApproved = job.moderationStatus === 'APPROVED' || (!job.moderationStatus && job.verifiedStatus === 'Verified');
                  const isRejected = job.moderationStatus === 'REJECTED';

                  return (
                    <tr key={job.id} className="hover:bg-slate-50/80 transition-colors">
                      <td>
                        <div className="space-y-0.5">
                          <p
                            onClick={() => setViewingJob(job)}
                            className="font-bold text-slate-900 text-xs hover:text-blue-600 cursor-pointer truncate max-w-[220px]"
                          >
                            {job.title}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">ID: {job.id}</p>
                        </div>
                      </td>
                      <td className="text-xs font-medium text-slate-700">{job.category}</td>
                      <td>
                        <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {job.jobType}
                        </span>
                      </td>
                      <td className="text-xs font-bold text-blue-600">{job.salary}</td>
                      <td>
                        <button
                          onClick={() => setActivePage('applicant-management')}
                          className="inline-flex items-center gap-1 text-xs font-bold text-slate-900 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
                        >
                          <Users size={13} className="text-blue-600" />
                          <span>{appsCount} hồ sơ</span>
                        </button>
                      </td>
                      <td>
                        <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold border inline-flex items-center gap-1 ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : isPending
                            ? 'bg-amber-50 text-amber-700 border-amber-300'
                            : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}>
                          {isApproved ? <CheckCircle2 size={12} /> : isPending ? <AlertCircle size={12} /> : <XCircle size={12} />}
                          {isApproved ? 'Đã duyệt' : isPending ? 'Chờ kiểm duyệt' : 'Bị từ chối'}
                        </span>
                      </td>
                      <td className="text-xs text-slate-500 whitespace-nowrap">{job.deadline || '30/04/2026'}</td>
                      <td className="text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingJob(job)}
                            className="btn btn-secondary btn-sm text-xs"
                            title="Xem chi tiết tin tuyển dụng"
                          >
                            <Eye size={13} /> Xem
                          </button>

                          <button
                            onClick={() => setActivePage('applicant-management')}
                            className="btn btn-secondary btn-sm text-xs font-semibold"
                            title="Quản lý ứng viên nộp hồ sơ"
                          >
                            <Users size={13} /> Ứng viên
                          </button>

                          <button
                            onClick={() => setDeletingJob(job)}
                            className="btn btn-danger btn-sm text-xs p-1.5"
                            title="Xóa tin tuyển dụng"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW JOB PREVIEW MODAL */}
      {viewingJob && (
        <Modal
          isOpen={!!viewingJob}
          onClose={() => setViewingJob(null)}
          title={`Chi tiết Bài đăng - ${viewingJob.title}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900 text-sm">{viewingJob.title}</h4>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {viewingJob.salary}
                </span>
              </div>
              <p className="text-slate-600">Vị trí: <strong>{viewingJob.category}</strong> • Loại hình: <strong>{viewingJob.jobType}</strong></p>
              <p className="text-slate-600">Địa điểm: {viewingJob.location} • Hạn nộp: {viewingJob.deadline || '30/04/2026'}</p>
            </div>

            {viewingJob.moderationStatus === 'REJECTED' && viewingJob.rejectionReason && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <XCircle size={15} /> Lý do Ban Quản trị (Admin) từ chối tin:
                </p>
                <p className="text-xs">{viewingJob.rejectionReason}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="font-bold text-slate-900">Mô tả công việc:</p>
              <p className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed">
                {viewingJob.description}
              </p>
            </div>

            <div className="space-y-1">
              <p className="font-bold text-slate-900">Kỹ năng bắt buộc (Required Skills):</p>
              <div className="flex flex-wrap gap-1">
                {viewingJob.requiredSkills.map(sk => (
                  <span key={sk} className="skill-chip skill-chip-blue">{sk}</span>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button onClick={() => setViewingJob(null)} className="btn btn-secondary text-xs">Đóng</button>
            </div>
          </div>
        </Modal>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingJob && (
        <Modal
          isOpen={!!deletingJob}
          onClose={() => setDeletingJob(null)}
          title="Xác nhận xóa tin tuyển dụng"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <AlertCircle size={16} /> Cảnh báo xóa dữ liệu
              </p>
              <p>
                Bạn có chắc muốn gỡ tin tuyển dụng <strong>"{deletingJob.title}"</strong> khỏi hệ thống?
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setDeletingJob(null)} className="btn btn-secondary text-xs">Hủy bỏ</button>
              <button onClick={confirmDeleteJob} className="btn btn-danger text-xs font-bold">Xác nhận Xóa</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

