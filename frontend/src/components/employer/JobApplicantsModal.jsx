import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MatchBadge } from '../common/Badge';
import { calculateSkillMatch } from '../../utils/matching';
import { Modal } from '../common/Modal';
import { ScheduleInterviewModal } from './ScheduleInterviewModal';
import {
  Users,
  UserCheck,
  FileText,
  Calendar,
  Check,
  AlertTriangle,
  XCircle,
  Award,
  Briefcase,
  Mail,
  GraduationCap
} from 'lucide-react';

export function JobApplicantsModal({ job, isOpen, onClose }) {
  const {
    applications = [],
    candidateProfile,
    updateApplicationStatus,
    setViewingCVModalCandidate,
    viewingCVModalCandidate,
    showToast
  } = useApp();

  // State cho drawer xem chi tiết hồ sơ ứng viên
  const [detailApplicant, setDetailApplicant] = useState(null);
  // State cho modal lên lịch phỏng vấn
  const [activeInterviewAppId, setActiveInterviewAppId] = useState(null);

  if (!job || !isOpen) return null;

  // Lọc chính xác các ứng viên đã nộp vào tin tuyển dụng này
  const jobApps = applications.filter(a => a.jobId === job.id);

  const safeRequiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : (typeof job.requiredSkills === 'string'
        ? job.requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Ứng viên đã nộp - ${job.title}`}
      >
        <div className="space-y-4 text-xs">
          {/* Header tóm tắt vị trí tuyển dụng */}
          <div className="p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                  <Briefcase size={16} />
                </span>
                <h4 className="font-extrabold text-slate-900 text-sm">{job.title}</h4>
              </div>
              <p className="text-slate-600 mt-1">
                {job.category} • {job.jobType} • Mức lương: <strong className="text-blue-700">{job.salary}</strong>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 text-blue-800 rounded-lg font-bold text-xs shadow-2xs">
                <Users size={14} className="text-blue-600" />
                {jobApps.length} hồ sơ ứng tuyển
              </span>
            </div>
          </div>

          {/* Danh sách ứng viên của riêng tin này */}
          {jobApps.length === 0 ? (
            <div className="p-10 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-center space-y-2">
              <Users size={40} className="mx-auto text-slate-300" />
              <p className="font-bold text-slate-700 text-sm">Chưa có ứng viên nào nộp hồ sơ</p>
              <p className="text-slate-500 text-xs max-w-sm mx-auto">
                Khi có ứng viên nộp hồ sơ vào vị trí "{job.title}", hồ sơ và thông tin chi tiết của họ sẽ xuất hiện tại đây.
              </p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
              {jobApps.map(app => {
                const candSkills = app.candidateSkills || candidateProfile?.skills || ['Java', 'SQL', 'Git'];
                const match = calculateSkillMatch(candSkills, safeRequiredSkills);

                return (
                  <div
                    key={app.id}
                    className="p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-xs transition-all space-y-3"
                  >
                    {/* Top: Thông tin cơ bản + Match Badge */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {app.candidateName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                              onClick={() => setDetailApplicant({ app, match })}>
                            {app.candidateName}
                          </h4>
                          <div className="flex items-center gap-2 text-slate-500 text-[11px] flex-wrap mt-0.5">
                            <span className="flex items-center gap-1">
                              <GraduationCap size={13} className="text-slate-400" />
                              {app.candidateUniversity || 'Đại học CNTT'}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Mail size={13} className="text-slate-400" />
                              {app.candidateEmail}
                            </span>
                            <span>•</span>
                            <span>Nộp: {app.appliedDate}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <MatchBadge score={match.percentage} label={match.label} badgeClass={match.badgeClass} />
                      </div>
                    </div>

                    {/* Middle: Kỹ năng ứng viên */}
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[11px] font-bold text-slate-500 mr-1">Kỹ năng:</span>
                      {candSkills.slice(0, 5).map(sk => (
                        <span key={sk} className="skill-chip skill-chip-blue text-[10px] py-0.5 px-2">
                          {sk}
                        </span>
                      ))}
                      {candSkills.length > 5 && (
                        <span className="text-[10px] text-slate-400 font-semibold">+{candSkills.length - 5}</span>
                      )}
                    </div>

                    {/* Bottom: Trạng thái & Nút thao tác trực tiếp */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Trạng thái:</span>
                        <select
                          className={`form-control py-1 px-2.5 text-xs font-bold rounded-lg border cursor-pointer ${
                            app.status === 'Offer'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : app.status === 'Phỏng vấn'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-300'
                              : app.status === 'Từ chối'
                              ? 'bg-rose-50 text-rose-700 border-rose-300'
                              : 'bg-blue-50 text-blue-700 border-blue-300'
                          }`}
                          value={app.status}
                          onChange={e => {
                            const newSt = e.target.value;
                            if (newSt === 'Phỏng vấn') {
                              setActiveInterviewAppId(app.id);
                            } else {
                              updateApplicationStatus(app.id, newSt);
                            }
                          }}
                        >
                          <option value="Đã nộp">Đã nộp</option>
                          <option value="Đã xem">Đã xem</option>
                          <option value="Phỏng vấn">Phỏng vấn</option>
                          <option value="Offer">Offer</option>
                          <option value="Từ chối">Từ chối</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => setDetailApplicant({ app, match })}
                          className="btn btn-secondary btn-sm text-xs font-semibold flex items-center gap-1 hover:bg-slate-100"
                          title="Xem chi tiết hồ sơ năng lực & kinh nghiệm của ứng viên"
                        >
                          <UserCheck size={13} className="text-blue-600" /> Hồ sơ
                        </button>

                        <button
                          onClick={() => setViewingCVModalCandidate(app)}
                          className="btn btn-secondary btn-sm text-xs flex items-center gap-1 hover:bg-slate-100"
                          title="Xem tài liệu CV PDF"
                        >
                          <FileText size={13} className="text-slate-600" /> CV
                        </button>

                        <button
                          onClick={() => setActiveInterviewAppId(app.id)}
                          className="btn btn-primary btn-sm text-xs font-bold flex items-center gap-1 shadow-2xs"
                          title="Lên lịch phỏng vấn trực tuyến với ứng viên"
                        >
                          <Calendar size={13} /> Lịch PV
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button onClick={onClose} className="btn btn-secondary text-xs px-4">
              Đóng
            </button>
          </div>
        </div>
      </Modal>

      {/* MODAL CHI TIẾT HỒ SƠ ỨNG VIÊN */}
      {detailApplicant && (
        <Modal
          isOpen={!!detailApplicant}
          onClose={() => setDetailApplicant(null)}
          title={`Hồ sơ chi tiết Ứng viên - ${detailApplicant.app.candidateName}`}
        >
          <div className="space-y-4 text-xs">
            {/* Header ứng viên */}
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white text-blue-700 font-black text-lg flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                  {detailApplicant.app.candidateName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-base font-extrabold">{detailApplicant.app.candidateName}</h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {detailApplicant.app.candidateUniversity} • {detailApplicant.app.candidateEmail}
                  </p>
                </div>
              </div>
              <MatchBadge
                score={detailApplicant.match.percentage}
                label={detailApplicant.match.label}
                badgeClass={detailApplicant.match.badgeClass}
              />
            </div>

            {/* Thông tin nộp đơn */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl grid grid-cols-2 gap-3 text-slate-700">
              <p>Vị trí ứng tuyển: <strong className="text-slate-900">{job.title}</strong></p>
              <p>Ngày nộp đơn: <strong className="text-slate-900">{detailApplicant.app.appliedDate}</strong></p>
              <p>Trạng thái: <strong className="text-blue-700">{detailApplicant.app.status}</strong></p>
              <p>Mức lương vị trí: <strong className="text-slate-900">{job.salary}</strong></p>
            </div>

            {/* Phân tích kỹ năng so khớp */}
            <div className="space-y-3 p-4 bg-white border border-slate-200 rounded-xl">
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Phân tích kỹ năng so khớp</h4>

              <div className="space-y-1.5">
                <p className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                  <Check size={14} /> Kỹ năng đã đáp ứng ({detailApplicant.match.matchedSkills.length}):
                </p>
                <div className="flex flex-wrap gap-1">
                  {detailApplicant.match.matchedSkills.length > 0 ? (
                    detailApplicant.match.matchedSkills.map(sk => (
                      <span key={sk} className="skill-chip skill-chip-emerald">✓ {sk}</span>
                    ))
                  ) : (
                    <span className="text-slate-400 italic">Chưa trùng khớp kỹ năng chính</span>
                  )}
                </div>
              </div>

              {detailApplicant.match.missingSkills.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] font-bold text-amber-700 flex items-center gap-1">
                    <AlertTriangle size={14} /> Kỹ năng công việc yêu cầu thêm ({detailApplicant.match.missingSkills.length}):
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {detailApplicant.match.missingSkills.map(sk => (
                      <span key={sk} className="skill-chip skill-chip-amber">! {sk}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Hành động nhanh */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  const cand = detailApplicant.app;
                  setDetailApplicant(null);
                  setViewingCVModalCandidate(cand);
                }}
                className="btn btn-secondary text-xs font-semibold flex items-center gap-1"
              >
                <FileText size={14} /> Xem File CV
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    updateApplicationStatus(detailApplicant.app.id, 'Từ chối');
                    setDetailApplicant(null);
                  }}
                  className="btn btn-danger text-xs font-bold"
                >
                  <XCircle size={14} /> Từ chối
                </button>
                <button
                  onClick={() => {
                    const id = detailApplicant.app.id;
                    setDetailApplicant(null);
                    setActiveInterviewAppId(id);
                  }}
                  className="btn btn-primary text-xs font-bold"
                >
                  <Calendar size={14} /> Mời Phỏng vấn
                </button>
                <button
                  onClick={() => {
                    updateApplicationStatus(detailApplicant.app.id, 'Offer');
                    setDetailApplicant(null);
                    showToast('Đã chuyển trạng thái ứng viên sang OFFER!', 'success');
                  }}
                  className="btn btn-success text-xs font-bold"
                >
                  <Award size={14} /> Gửi Offer
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL LÊN LỊCH PHỎNG VẤN */}
      {activeInterviewAppId && (
        <ScheduleInterviewModal
          appId={activeInterviewAppId}
          onClose={() => setActiveInterviewAppId(null)}
        />
      )}

      {/* MODAL XEM CV TRỰC TUYẾN */}
      {viewingCVModalCandidate && (
        <Modal
          isOpen={!!viewingCVModalCandidate}
          onClose={() => setViewingCVModalCandidate(null)}
          title={`Chi tiết Hồ sơ & CV - ${viewingCVModalCandidate.candidateName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-blue-600 text-white font-black text-xl flex items-center justify-center border-2 border-white shadow-md shrink-0">
                {viewingCVModalCandidate.candidateName.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">{viewingCVModalCandidate.candidateName}</h4>
                <p className="text-slate-600">Trường: {viewingCVModalCandidate.candidateUniversity || 'Đại học FPT'} • Email: {viewingCVModalCandidate.candidateEmail}</p>
                <p className="text-slate-600">Kỹ năng: {(viewingCVModalCandidate.candidateSkills || candidateProfile?.skills || []).join(', ')}</p>
              </div>
            </div>

            <div className="border-2 border-slate-200 rounded-xl p-6 text-center bg-white space-y-3">
              <FileText size={44} className="mx-auto text-blue-600" />
              <h4 className="font-bold text-slate-800 text-sm">{candidateProfile?.cvFileName || 'CV_Ung_Vien_2026.pdf'}</h4>
              <p className="text-slate-500 text-xs">Bản xem trước tài liệu PDF trực tuyến</p>
              <div className="p-4 bg-slate-50 rounded-lg text-left font-mono text-[11px] text-slate-700 space-y-1 border border-slate-200">
                <p className="font-bold text-blue-700">=== TÓM TẮT NỘI DUNG CV ===</p>
                <p>- Họ tên: {viewingCVModalCandidate.candidateName}</p>
                <p>- Vị trí nộp: {job.title}</p>
                <p>- Dự án: REST API Spring Boot + MySQL + React</p>
                <p>- Kỹ năng nổi bật: Java Core, OOP, SQL, Git, RESTful API</p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setViewingCVModalCandidate(null)} className="btn btn-secondary text-xs">Đóng</button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
