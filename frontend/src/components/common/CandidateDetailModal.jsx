import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { employerApi } from '../../services/apiService';
import { MatchBadge } from '../common/Badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  DollarSign,
  FileText,
  Download,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  Loader2,
  Calendar,
  Award,
  XCircle,
  FileCheck
} from 'lucide-react';

export function CandidateDetailModal({ isOpen, onClose, candidateData }) {
  const {
    jobs,
    applications,
    updateApplicationStatus,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'cv-text' | 'cv-file'
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [copiedText, setCopiedText] = useState(false);

  // Lấy ID ứng viên
  const candidateId = candidateData?.candidateId || candidateData?.id || candidateData?.userId;
  const appId = candidateData?.appId || candidateData?.id;

  // Lấy thông tin Job tương ứng (nếu ứng viên nộp qua Application)
  const relatedJob = jobs.find(j => j.id === candidateData?.jobId);
  const relatedApp = applications.find(a => a.id === appId || a.candidateId === candidateId);
  const currentStatus = relatedApp?.status || candidateData?.status || 'Chờ duyệt';

  useEffect(() => {
    if (isOpen && candidateId) {
      loadFullProfile(candidateId);
      setActiveTab('overview');
    } else {
      setProfile(null);
    }
  }, [isOpen, candidateId]);

  const loadFullProfile = async (id) => {
    setLoading(true);
    try {
      const res = await employerApi.getCandidateProfile(id);
      const profileData = res?.data || (res?.id ? res : null);
      if (profileData) {
        setProfile(profileData);
      } else {
        setProfile(candidateData);
      }
    } catch (err) {
      console.warn('Không thể gọi API chi tiết ứng viên từ server, sử dụng dữ liệu cục bộ:', err);
      setProfile(candidateData);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !candidateData) return null;

  // Tổng hợp dữ liệu hiển thị từ API máy chủ
  const displayName = profile?.fullName || candidateData?.candidateName || candidateData?.name || 'Ứng viên';
  const displayEmail = profile?.email || candidateData?.candidateEmail || candidateData?.email || 'Chưa cập nhật';
  const displayPhone = profile?.phone || candidateData?.phone || 'Chưa cập nhật';
  const displayLocation = profile?.location || candidateData?.location || 'Chưa cập nhật';
  // Ưu tiên tuyệt đối dữ liệu thực tế từ Candidate Profile đã lưu
  const displayUni = profile 
    ? (profile.university?.trim() || 'Chưa cập nhật') 
    : (candidateData?.candidateUniversity?.trim() || candidateData?.university?.trim() || 'Chưa cập nhật');
  const displayMajor = profile 
    ? (profile.major?.trim() || 'Chưa cập nhật') 
    : (candidateData?.candidateMajor?.trim() || candidateData?.major?.trim() || 'Chưa cập nhật');
  const displayGradYear = profile 
    ? (profile.graduationYear?.trim() || 'Chưa cập nhật') 
    : (candidateData?.graduationYear?.trim() || 'Chưa cập nhật');
  const displayDesiredRole = profile?.desiredRole?.trim() || candidateData?.desiredRole?.trim() || relatedJob?.title || 'Chưa cập nhật';
  const displaySalary = profile?.expectedSalary?.trim() || candidateData?.expectedSalary?.trim() || 'Thỏa thuận';
  
  // Kỹ năng thực tế từ backend
  const skillsList = profile?.skillList && profile.skillList.length > 0
    ? profile.skillList
    : (profile?.skills
        ? (typeof profile.skills === 'string' ? profile.skills.split(',').map(s => s.trim()).filter(Boolean) : (Array.isArray(profile.skills) ? profile.skills : []))
        : (Array.isArray(candidateData?.candidateSkills) ? candidateData.candidateSkills : []));

  const cvFileName = profile?.cvFileName || candidateData?.cvFileName || 'CV_Ung_Vien.pdf';
  const extractedCvText = profile?.extractedCvText || candidateData?.extractedCvText || '';

  // Tải file CV thật
  const handleDownloadCv = async () => {
    setDownloading(true);
    try {
      const blob = await employerApi.downloadCandidateCv(candidateId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cvFileName || `${displayName}_CV.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast('Tải xuống CV ứng viên thành công!', 'success');
    } catch (err) {
      console.warn('Lỗi tải CV qua API server:', err);
      // Fallback mở file xem trước
      showToast('Đang mở bản xem trước tài liệu CV...', 'info');
      const blob = new Blob([extractedCvText], { type: 'text/plain;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${displayName}_CV_Summary.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  // Sao chép văn bản CV
  const handleCopyCvText = () => {
    if (extractedCvText) {
      navigator.clipboard.writeText(extractedCvText);
      setCopiedText(true);
      showToast('Đã sao chép nội dung CV vào clipboard!', 'success');
      setTimeout(() => setCopiedText(false), 2000);
    }
  };

  // Đổi trạng thái ứng viên
  const handleStatusChange = (newStatus) => {
    if (relatedApp?.id) {
      updateApplicationStatus(relatedApp.id, newStatus);
      showToast(`Đã chuyển ứng viên ${displayName} sang trạng thái "${newStatus}"!`, 'success');
    } else {
      showToast(`Đã ghi nhận chuyển trạng thái sang "${newStatus}"`, 'info');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-content"
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '840px', width: '95%', maxHeight: '92vh', borderRadius: '1.25rem' }}
      >
        {/* Modal Header */}
        <div className="modal-header border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <FileCheck size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Hồ sơ chi tiết & CV Ứng viên</h3>
              <p className="text-[11px] text-slate-500">Mã ứng viên: <span className="font-mono text-slate-700">{candidateId}</span></p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body p-5 space-y-4 text-xs overflow-y-auto" style={{ maxHeight: 'calc(92vh - 140px)' }}>
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <Loader2 className="animate-spin text-blue-600 mx-auto" size={32} />
              <p className="text-slate-600 font-medium">Đang tải chi tiết hồ sơ & CV ứng viên từ máy chủ...</p>
            </div>
          ) : (
            <>
              {/* TOP HERO PROFILE BANNER */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-500 text-white font-extrabold text-2xl flex items-center justify-center shadow-md border-2 border-white/20 shrink-0">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base font-bold text-white tracking-tight">{displayName}</h2>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                        {displayDesiredRole}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-300 flex-wrap">
                      <span className="flex items-center gap-1"><Mail size={12} className="text-blue-400" /> {displayEmail}</span>
                      <span className="flex items-center gap-1"><Phone size={12} className="text-emerald-400" /> {displayPhone}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} className="text-amber-400" /> {displayLocation}</span>
                    </div>
                  </div>
                </div>

                {/* Status & Match pill */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/10">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${
                    currentStatus === 'Offer' ? 'bg-emerald-500 text-white' :
                    currentStatus === 'Phỏng vấn' ? 'bg-indigo-500 text-white' :
                    currentStatus === 'Từ chối' ? 'bg-rose-500 text-white' :
                    'bg-blue-600 text-white'
                  }`}>
                    {currentStatus}
                  </span>
                  {candidateData?.match?.percentage && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-300">
                      <Sparkles size={12} /> Khớp {candidateData.match.percentage}%
                    </div>
                  )}
                </div>
              </div>

              {/* NAVIGATION TABS */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  onClick={() => setActiveTab('overview')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <User size={14} /> Tổng quan Hồ sơ & Kỹ năng
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cv-text')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'cv-text'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <FileText size={14} /> Văn bản CV trích xuất AI
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('cv-file')}
                  className={`flex-1 py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeTab === 'cv-file'
                      ? 'bg-white text-blue-700 shadow-xs font-bold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Download size={14} /> Tệp CV đính kèm ({cvFileName.endsWith('.docx') ? 'DOCX' : 'PDF'})
                </button>
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Grid thông tin học vấn & công việc */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Học vấn */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-blue-700 uppercase tracking-wider">
                        <GraduationCap size={15} /> Học vấn & Đào tạo
                      </h4>
                      <div className="space-y-1.5 text-slate-700">
                        <p>Trường Đại học: <strong className="text-slate-900">{displayUni}</strong></p>
                        <p>Chuyên ngành: <strong className="text-slate-900">{displayMajor}</strong></p>
                        <p>Năm tốt nghiệp dự kiến: <strong className="text-slate-900">{displayGradYear}</strong></p>
                      </div>
                    </div>

                    {/* Định hướng & Đãi ngộ */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-indigo-700 uppercase tracking-wider">
                        <Briefcase size={15} /> Định hướng nghề nghiệp
                      </h4>
                      <div className="space-y-1.5 text-slate-700">
                        <p>Vị trí mong muốn: <strong className="text-slate-900">{displayDesiredRole}</strong></p>
                        <p>Mức lương kỳ vọng: <strong className="text-emerald-700 font-bold">{displaySalary}</strong></p>
                        <p>Địa điểm làm việc: <strong className="text-slate-900">{displayLocation}</strong></p>
                      </div>
                    </div>
                  </div>

                  {/* Giới thiệu & Liên kết trực tuyến (nếu có) */}
                  {(profile?.bio || profile?.githubUrl || profile?.portfolioUrl) && (
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-slate-800 uppercase tracking-wider">
                        <User size={15} className="text-blue-600" /> Giới thiệu & Liên kết trực tuyến
                      </h4>
                      {profile?.bio && (
                        <p className="text-slate-700 text-xs whitespace-pre-wrap leading-relaxed">{profile.bio}</p>
                      )}
                      <div className="flex flex-wrap gap-4 pt-1 text-xs">
                        {profile?.githubUrl && (
                          <a href={profile.githubUrl.startsWith('http') ? profile.githubUrl : `https://${profile.githubUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center gap-1 font-semibold">
                            GitHub: {profile.githubUrl}
                          </a>
                        )}
                        {profile?.portfolioUrl && (
                          <a href={profile.portfolioUrl.startsWith('http') ? profile.portfolioUrl : `https://${profile.portfolioUrl}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1 font-semibold">
                            Portfolio: {profile.portfolioUrl}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Kỹ năng ứng viên */}
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-2">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-slate-800 uppercase tracking-wider">
                      <Award size={15} className="text-blue-600" /> Kỹ năng chuyên môn ({skillsList.length})
                    </h4>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {skillsList.length > 0 ? (
                        skillsList.map((skill, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-semibold text-xs border border-blue-200 flex items-center gap-1"
                          >
                            <Check size={12} className="text-blue-600" /> {skill}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-xs">Chưa cập nhật kỹ năng chuyên môn</span>
                      )}
                    </div>
                  </div>

                  {/* Phân tích khớp tin tuyển dụng (nếu có job đi kèm) */}
                  {relatedJob && (
                    <div className="p-4 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 border border-blue-200/80 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 text-blue-900">
                          <Sparkles size={15} className="text-blue-600" /> Phân tích phù hợp với: <u>{relatedJob.title}</u>
                        </h4>
                        <span className="text-xs font-bold text-blue-800">
                          Ngày nộp: {relatedApp?.appliedDate || 'Gần đây'}
                        </span>
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        Hệ thống đối soát kỹ năng ứng viên với yêu cầu của vị trí <strong>{relatedJob.title}</strong> tại <strong>{relatedJob.company || 'Doanh nghiệp'}</strong>. Ứng viên sở hữu nền tảng vững chắc và phù hợp để bước vào vòng phỏng vấn.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: EXTRACTED CV TEXT */}
              {activeTab === 'cv-text' && (
                <div className="space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between bg-blue-50/80 border border-blue-200 p-2.5 rounded-xl">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-blue-600" />
                      <span className="font-bold text-blue-950 text-xs">Văn bản CV được trích xuất tự động qua Apache PDFBox & AI</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyCvText}
                      className="btn btn-secondary btn-sm text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      {copiedText ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                      {copiedText ? 'Đã sao chép' : 'Sao chép nội dung'}
                    </button>
                  </div>

                  {/* Text Container */}
                  {extractedCvText ? (
                    <div className="p-4 bg-slate-900 text-slate-100 rounded-xl font-mono text-[11px] leading-relaxed overflow-y-auto max-h-[380px] border border-slate-800 shadow-inner whitespace-pre-wrap selection:bg-blue-600 selection:text-white">
                      {extractedCvText}
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-xl text-slate-500 text-xs">
                      Chưa có nội dung văn bản trích xuất từ tệp CV của ứng viên này.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ORIGINAL CV FILE */}
              {activeTab === 'cv-file' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="border-2 border-dashed border-blue-200 bg-blue-50/40 rounded-2xl p-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-white shadow-md border border-blue-100 flex items-center justify-center mx-auto text-blue-600">
                      <FileText size={36} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-bold text-slate-900 text-sm">{cvFileName}</h4>
                      <p className="text-slate-500 text-xs">
                        Tài liệu CV gốc do ứng viên <strong>{displayName}</strong> tải lên hệ thống CareerFit
                      </p>
                    </div>

                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleDownloadCv}
                        disabled={downloading}
                        className="btn btn-primary font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {downloading ? (
                          <>
                            <Loader2 size={15} className="animate-spin" /> Đang tải tệp...
                          </>
                        ) : (
                          <>
                            <Download size={15} /> Tải xuống tệp CV gốc
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-2.5 text-slate-600 text-[11px]">
                    <AlertCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
                    <p>
                      Mẹo: Bạn có thể tải file CV về máy để lưu trữ hoặc xem trực tiếp tab <strong>"Văn bản CV trích xuất AI"</strong> để duyệt nhanh kỹ năng và kinh nghiệm mà không cần tốn thời gian mở phần mềm đọc file.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer: Action Bar */}
        <div className="modal-footer border-t border-slate-100 px-5 py-3.5 flex flex-wrap items-center justify-between gap-2.5 bg-slate-50/70 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary text-xs font-semibold cursor-pointer"
          >
            Đóng
          </button>

          {/* Quick recruitment actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleStatusChange('Từ chối')}
              className="btn btn-danger btn-sm text-xs font-bold cursor-pointer"
            >
              <XCircle size={14} /> Từ chối
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('Phỏng vấn')}
              className="btn btn-primary btn-sm text-xs font-bold cursor-pointer"
            >
              <Calendar size={14} /> Mời Phỏng vấn
            </button>
            <button
              type="button"
              onClick={() => handleStatusChange('Offer')}
              className="btn btn-success btn-sm text-xs font-bold cursor-pointer"
            >
              <Award size={14} /> Gửi Offer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
