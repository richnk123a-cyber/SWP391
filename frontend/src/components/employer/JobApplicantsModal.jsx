import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MatchBadge } from '../common/Badge';
import { calculateSkillMatch } from '../../utils/matching';
import { rankJobApplicants, MAX_ALLOWED_DEVIATION, MAX_EVALUATION_ATTEMPTS } from '../../utils/employerRanking';
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
  GraduationCap,
  Trophy,
  RotateCcw,
  ListFilter,
  CheckCircle2,
  Info,
  Loader2,
  TrendingUp,
  ShieldCheck,
  ChevronRight,
  Sparkles
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

  // States cho tính năng Đánh giá & Xếp hạng ứng viên độc lập
  const [rankingResult, setRankingResult] = useState(null);
  const [isRankingLoading, setIsRankingLoading] = useState(false);
  const [rankingProgress, setRankingProgress] = useState('');
  const [isRankedView, setIsRankedView] = useState(false);
  const [historyModalCandidate, setHistoryModalCandidate] = useState(null);

  if (!job || !isOpen) return null;

  // Lọc chính xác các ứng viên đã nộp vào tin tuyển dụng này
  const jobApps = applications.filter(a => a.jobId === job.id);

  const safeRequiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : (typeof job.requiredSkills === 'string'
        ? job.requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);

  // Xử lý thực thi Xếp hạng ứng viên độc lập
  const handleExecuteRanking = () => {
    if (jobApps.length === 0) {
      showToast('Tin tuyển dụng này hiện chưa có ứng viên nộp hồ sơ để xếp hạng!', 'warning');
      return;
    }

    setIsRankingLoading(true);
    setRankingProgress('Đang khởi tạo thuật toán thẩm định độc lập phía Nhà tuyển dụng...');

    setTimeout(() => {
      setRankingProgress('Vòng 1: Đánh giá độ đáp ứng kỹ năng độc lập & đối chiếu điểm ứng viên...');
    }, 400);

    setTimeout(() => {
      setRankingProgress('Vòng 2 & 3: Tự động tái thẩm định các hồ sơ có độ lệch > 10%...');
    }, 900);

    setTimeout(() => {
      const result = rankJobApplicants(job, jobApps, {
        maxDeviation: MAX_ALLOWED_DEVIATION,
        maxAttempts: MAX_EVALUATION_ATTEMPTS
      });

      setRankingResult(result);
      setIsRankedView(true);
      setIsRankingLoading(false);
      setRankingProgress('');

      if (result.qualifiedCount > 0) {
        showToast(
          `Đã hoàn tất xếp hạng ${result.qualifiedCount}/${result.totalEvaluated} ứng viên từ cao xuống thấp (Độ lệch ≤ ${result.maxDeviation}%).`,
          'success'
        );
      }
      if (result.disqualifiedCount > 0) {
        showToast(
          `Phát hiện ${result.disqualifiedCount} ứng viên lệch quá ${result.maxDeviation}% sau 3 lần thẩm định (Đã dừng đánh giá).`,
          'warning'
        );
      }
    }, 1400);
  };

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
            <div className="text-right shrink-0 flex items-center gap-2">
              {isRankedView && rankingResult && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg font-bold text-xs shadow-2xs">
                  <Trophy size={14} className="text-amber-600" />
                  Đang xem Bảng xếp hạng ({rankingResult.qualifiedCount}/{rankingResult.totalEvaluated})
                </span>
              )}
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-200 text-blue-800 rounded-lg font-bold text-xs shadow-2xs">
                <Users size={14} className="text-blue-600" />
                {jobApps.length} hồ sơ ứng tuyển
              </span>
            </div>
          </div>

          {/* Banner thông báo trạng thái khi đang xếp hạng (Loading Animation) */}
          {isRankingLoading && (
            <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-lg border border-blue-500/30 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 size={24} className="animate-spin text-amber-300" />
                <div>
                  <h5 className="font-bold text-sm text-white flex items-center gap-2">
                    <Sparkles size={16} className="text-amber-300" />
                    Hệ thống đang thẩm định độc lập & xếp hạng ứng viên...
                  </h5>
                  <p className="text-blue-200 text-xs mt-0.5">{rankingProgress}</p>
                </div>
              </div>
              <div className="w-full bg-blue-950/80 rounded-full h-1.5 overflow-hidden">
                <div className="bg-gradient-to-r from-amber-400 to-emerald-400 h-1.5 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          )}

          {/* Banner thông tin chi tiết bảng xếp hạng sau khi đã thẩm định */}
          {isRankedView && rankingResult && !isRankingLoading && (
            <div className="p-4 bg-gradient-to-r from-amber-500/10 via-blue-500/10 to-indigo-500/10 border border-amber-200/80 rounded-2xl space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-500 text-white shadow-xs">
                    <Trophy size={16} />
                  </span>
                  <div>
                    <h5 className="font-extrabold text-slate-900 text-xs sm:text-sm uppercase tracking-wide">
                      Bảng xếp hạng ứng viên theo độ đáp ứng (Thẩm định độc lập)
                    </h5>
                    <p className="text-[11px] text-slate-600">
                      Sắp xếp từ điểm cao nhất đến thấp nhất • Đánh giá độc lập từ góc độ NTD & đối chiếu với ứng viên.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="px-2.5 py-1 bg-white border border-emerald-300 text-emerald-800 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    Sai số cho phép: ≤ {rankingResult.maxDeviation}%
                  </span>
                  <span className="px-2.5 py-1 bg-white border border-blue-300 text-blue-800 rounded-lg font-bold text-[11px] flex items-center gap-1 shadow-2xs">
                    <TrendingUp size={13} className="text-blue-600" />
                    Tái thẩm định: Tối đa {rankingResult.maxAttempts} lần
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-slate-600 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Đủ điều kiện xếp hạng: {rankingResult.qualifiedCount} ứng viên
                  </span>
                  {rankingResult.disqualifiedCount > 0 && (
                    <span className="text-rose-700 font-bold flex items-center gap-1">
                      <AlertTriangle size={13} /> Dừng đánh giá (lệch quá {rankingResult.maxDeviation}% sau 3 lần): {rankingResult.disqualifiedCount} ứng viên
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setIsRankedView(false)}
                  className="text-blue-700 hover:text-blue-900 font-bold underline cursor-pointer flex items-center gap-1"
                >
                  <ListFilter size={12} /> Xem danh sách hồ sơ ban đầu
                </button>
              </div>
            </div>
          )}

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
              {/* TRƯỜNG HỢP 1: ĐANG XEM DANH SÁCH XẾP HẠNG (RANKED VIEW) */}
              {isRankedView && rankingResult ? (
                <>
                  {/* Nhóm ứng viên đủ điều kiện được xếp hạng (từ cao đến thấp) */}
                  {rankingResult.rankedCandidates.map(app => {
                    const candSkills = app.candidateSkills || [];
                    const match = calculateSkillMatch(candSkills, safeRequiredSkills);

                    // Huy hiệu thứ hạng (Rank Badge)
                    const isRank1 = app.rank === 1;
                    const isRank2 = app.rank === 2;
                    const isRank3 = app.rank === 3;

                    return (
                      <div
                        key={app.id}
                        className={`p-4 bg-white border rounded-xl hover:shadow-xs transition-all space-y-3 ${
                          isRank1
                            ? 'border-amber-400 bg-gradient-to-r from-amber-50/40 via-white to-amber-50/20 shadow-xs ring-1 ring-amber-300/60'
                            : isRank2
                            ? 'border-slate-300 bg-gradient-to-r from-slate-50/40 via-white to-slate-50/20'
                            : isRank3
                            ? 'border-amber-700/30 bg-gradient-to-r from-amber-900/5 via-white to-amber-900/5'
                            : 'border-slate-200'
                        }`}
                      >
                        {/* Top: Thứ hạng + Thông tin cơ bản + Điểm số 2 bên */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex items-center gap-3">
                            {/* Huy hiệu Rank */}
                            <div
                              className={`w-11 h-11 rounded-2xl flex flex-col items-center justify-center shrink-0 shadow-sm font-black text-white ${
                                isRank1
                                  ? 'bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 ring-2 ring-amber-200 shadow-amber-200'
                                  : isRank2
                                  ? 'bg-gradient-to-br from-slate-400 via-slate-500 to-slate-600 ring-2 ring-slate-200'
                                  : isRank3
                                  ? 'bg-gradient-to-br from-amber-700 via-amber-800 to-amber-900 ring-2 ring-amber-100'
                                  : 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white'
                              }`}
                              title={`Thứ hạng #${app.rank}`}
                            >
                              {isRank1 ? (
                                <>
                                  <Trophy size={14} className="text-white drop-shadow-xs" />
                                  <span className="text-[10px] leading-none mt-0.5">#1</span>
                                </>
                              ) : isRank2 ? (
                                <>
                                  <Award size={14} className="text-white drop-shadow-xs" />
                                  <span className="text-[10px] leading-none mt-0.5">#2</span>
                                </>
                              ) : isRank3 ? (
                                <>
                                  <Award size={14} className="text-white drop-shadow-xs" />
                                  <span className="text-[10px] leading-none mt-0.5">#3</span>
                                </>
                              ) : (
                                <span className="text-xs font-bold">#{app.rank}</span>
                              )}
                            </div>

                            <div>
                              <div className="flex items-center gap-2">
                                <h4
                                  className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                                  onClick={() => setDetailApplicant({ app, match })}
                                >
                                  {app.candidateName}
                                </h4>
                                {isRank1 && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300">
                                    ★ Phù hợp nhất
                                  </span>
                                )}
                              </div>
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

                          {/* Điểm Thẩm định độc lập & So khớp điểm ứng viên */}
                          <div className="flex flex-col sm:items-end gap-1.5 shrink-0 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-bold text-slate-500">Điểm NTD:</span>
                              <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-lg font-black text-xs shadow-2xs">
                                {app.employerScore}%
                              </span>
                              <span className="text-[11px] text-slate-400">•</span>
                              <span className="text-[11px] font-semibold text-slate-600">UV: {app.candidateScore}%</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Độ lệch: {app.deviation}% (≤10%)
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                {app.successfulAttempt === 1
                                  ? 'Đạt Vòng 1'
                                  : `Đạt sau Vòng ${app.successfulAttempt}`}
                              </span>
                              <button
                                type="button"
                                onClick={() => setHistoryModalCandidate(app)}
                                className="text-[10px] text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
                                title="Xem nhật ký 3 lần thẩm định"
                              >
                                Xem lịch sử
                              </button>
                            </div>
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

                        {/* Bottom: Trạng thái & Nút thao tác */}
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

                  {/* Nhóm ứng viên KHÔNG ĐỦ ĐIỀU KIỆN XẾP HẠNG (sau 3 lần thẩm định độc lập vẫn lệch quá 10%) */}
                  {rankingResult.unrankedCandidates.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-dashed border-rose-200 space-y-3">
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-800">
                        <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                        <div>
                          <h5 className="font-extrabold text-xs uppercase tracking-wide">
                            Ứng viên không được xếp hạng ({rankingResult.unrankedCandidates.length})
                          </h5>
                          <p className="text-[11px] text-rose-700 mt-0.5">
                            Hệ thống đã tự động thẩm định lại 3 lần nhưng kết quả giữa NTD và Ứng viên vẫn lệch quá {rankingResult.maxDeviation}%. Theo quy định, hệ thống dừng đánh giá và loại khỏi bảng xếp hạng.
                          </p>
                        </div>
                      </div>

                      {rankingResult.unrankedCandidates.map(app => {
                        const candSkills = app.candidateSkills || candidateProfile?.skills || [];
                        const match = calculateSkillMatch(candSkills, safeRequiredSkills);

                        return (
                          <div
                            key={app.id}
                            className="p-3.5 bg-slate-50/80 border border-rose-200 rounded-xl space-y-2.5 opacity-90 hover:opacity-100 transition-opacity"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center shrink-0">
                                  {app.candidateName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <h4 className="font-bold text-slate-800 text-xs">{app.candidateName}</h4>
                                  <p className="text-[11px] text-slate-500">
                                    {app.candidateUniversity} • {app.candidateEmail}
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-md font-bold text-[10px] border border-rose-300">
                                  Dừng đánh giá sau 3 lần (Lệch {app.deviation}%)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setHistoryModalCandidate(app)}
                                  className="btn btn-secondary btn-sm text-[10px] py-1 px-2 font-bold flex items-center gap-1"
                                >
                                  <Info size={12} className="text-rose-600" /> Xem 3 lần thử
                                </button>
                              </div>
                            </div>

                            <p className="text-[11px] text-rose-700 font-medium bg-white p-2 rounded-lg border border-rose-100">
                              ⚠️ {app.statusReason}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* TRƯỜNG HỢP 2: DANH SÁCH THÔNG THƯỜNG BAN ĐẦU */
                jobApps.map(app => {
                  const candSkills = app.candidateSkills || [];
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
                            <h4
                              className="font-bold text-slate-900 text-sm hover:text-blue-600 cursor-pointer"
                              onClick={() => setDetailApplicant({ app, match })}
                            >
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
                })
              )}
            </div>
          )}

          {/* FOOTER: NÚT XẾP HẠNG ỨNG VIÊN CẠNH NÚT ĐÓNG */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              {isRankedView && rankingResult && (
                <button
                  type="button"
                  onClick={() => setIsRankedView(false)}
                  className="btn btn-ghost text-xs font-semibold text-slate-600 hover:text-blue-600 flex items-center gap-1.5"
                >
                  <ListFilter size={13} /> Quay lại danh sách ban đầu
                </button>
              )}
              {!isRankedView && rankingResult && (
                <button
                  type="button"
                  onClick={() => setIsRankedView(true)}
                  className="btn btn-ghost text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5"
                >
                  <Trophy size={13} /> Xem kết quả xếp hạng đã lưu
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Nút Xếp hạng ứng viên cạnh nút Đóng theo đúng yêu cầu */}
              <button
                type="button"
                onClick={handleExecuteRanking}
                disabled={jobApps.length === 0 || isRankingLoading}
                className="btn btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5 shadow-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all"
                title="Hệ thống đánh giá % độ đáp ứng độc lập từ phía NTD, so khớp với ứng viên và xếp hạng từ cao đến thấp"
              >
                {isRankingLoading ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-amber-300" />
                    <span>Đang thẩm định...</span>
                  </>
                ) : (
                  <>
                    <Trophy size={14} className="text-amber-300" />
                    <span>{rankingResult ? 'Đánh giá & Xếp hạng lại' : 'Xếp hạng ứng viên'}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="btn btn-secondary text-xs px-4 py-2 rounded-xl"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* MODAL NHẬT KÝ THẨM ĐỊNH (AUDIT TRAIL MODAL - 3 LẦN ĐÁNH GIÁ ĐỘC LẬP) */}
      {historyModalCandidate && (
        <Modal
          isOpen={!!historyModalCandidate}
          onClose={() => setHistoryModalCandidate(null)}
          title={`Nhật ký thẩm định độc lập - ${historyModalCandidate.candidateName}`}
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl shadow-md flex items-center justify-between gap-4">
              <div>
                <h4 className="font-extrabold text-sm">{historyModalCandidate.candidateName}</h4>
                <p className="text-xs text-blue-200 mt-0.5">
                  Vị trí: {job.title} • Điểm ứng viên: <strong className="text-amber-300">{historyModalCandidate.candidateScore}%</strong>
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block px-3 py-1 rounded-lg text-xs font-bold ${
                    historyModalCandidate.isQualified
                      ? 'bg-emerald-500 text-white'
                      : 'bg-rose-500 text-white'
                  }`}
                >
                  {historyModalCandidate.isQualified
                    ? `Xếp hạng #${historyModalCandidate.rank} (Đạt)`
                    : 'Không xếp hạng'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-slate-700">
              <p className="font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-blue-600" /> Nguyên tắc thẩm định độc lập:
              </p>
              <p className="text-[11px] text-slate-600">
                1. Điểm thẩm định từ NTD được tính độc lập với tự khai báo của ứng viên.
                <br />
                2. So sánh điểm NTD và Ứng viên: Ngưỡng sai số cho phép ≤ {MAX_ALLOWED_DEVIATION}%.
                <br />
                3. Nếu độ lệch vượt quá {MAX_ALLOWED_DEVIATION}%, hệ thống tự động tái thẩm định tối đa {MAX_EVALUATION_ATTEMPTS} lần.
                <br />
                4. Nếu sau 3 lần vẫn không đạt tiêu chuẩn độ lệch, hệ thống dừng đánh giá ứng viên đó.
              </p>
            </div>

            {/* Chi tiết từng vòng đánh giá */}
            <div className="space-y-2.5">
              <h5 className="font-bold text-slate-900 uppercase tracking-wide text-[11px]">
                Chi tiết tiến trình đánh giá ({historyModalCandidate.history?.length || 0} lần thử):
              </h5>

              {historyModalCandidate.history?.map((step, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex flex-col gap-1.5 ${
                    step.passed
                      ? 'bg-emerald-50/70 border-emerald-300'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1">
                      {step.passed ? (
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      ) : (
                        <XCircle size={14} className="text-rose-600" />
                      )}
                      LẦN THẨM ĐỊNH {step.attempt} / {MAX_EVALUATION_ATTEMPTS}
                    </span>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        step.passed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {step.passed ? 'HỢP LỆ (≤ 10%)' : 'LỆCH QUÁ MỨC (> 10%)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-white p-2 rounded-lg border border-slate-200">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Điểm NTD</span>
                      <strong className="text-xs text-blue-700">{step.employerScore}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Điểm Ứng viên</span>
                      <strong className="text-xs text-slate-700">{step.candidateScore}%</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Độ chênh lệch</span>
                      <strong
                        className={`text-xs ${
                          step.passed ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        {step.deviation}%
                      </strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-700 mt-0.5">
                    {step.note}
                  </p>
                </div>
              ))}
            </div>

            {/* Kết luận */}
            <div
              className={`p-3 rounded-xl border font-semibold text-xs ${
                historyModalCandidate.isQualified
                  ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                  : 'bg-rose-100 text-rose-900 border-rose-300'
              }`}
            >
              {historyModalCandidate.isQualified ? (
                <p>
                  ✓ <strong>Kết luận:</strong> Ứng viên đã vượt qua vòng thẩm định ở lần {historyModalCandidate.successfulAttempt}. Được xếp hạng #{historyModalCandidate.rank} trên bảng xếp hạng độ đáp ứng của vị trí tuyển dụng.
                </p>
              ) : (
                <p>
                  ✗ <strong>Kết luận:</strong> Sau cả 3 lần thẩm định độc lập, kết quả giữa Nhà tuyển dụng và Ứng viên vẫn lệch quá {MAX_ALLOWED_DEVIATION}%. Hệ thống ngừng đánh giá và loại ứng viên này khỏi bảng xếp hạng.
                </p>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setHistoryModalCandidate(null)}
                className="btn btn-secondary text-xs px-4"
              >
                Đóng nhật ký
              </button>
            </div>
          </div>
        </Modal>
      )}

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
                <p className="text-slate-600">Kỹ năng: {(viewingCVModalCandidate.candidateSkills || []).join(', ')}</p>
              </div>
            </div>

            <div className="border-2 border-slate-200 rounded-xl p-6 text-center bg-white space-y-3">
              <FileText size={44} className="mx-auto text-blue-600" />
                            <h4 className="font-bold text-slate-800 text-sm">{viewingCVModalCandidate.cvFileName || viewingCVModalCandidate.candidateCvFileName || 'CV_Ung_Vien.pdf'}</h4>
              <p className="text-slate-500 text-xs">Bản xem trước hồ sơ ứng tuyển</p>
              <div className="p-4 bg-slate-50 rounded-lg text-left font-mono text-[11px] text-slate-700 space-y-1 border border-slate-200">
                <p className="font-bold text-blue-700">=== TÓM TẮT HỒ Sơ ỨNG VIÊN ===</p>
                <p>- Họ tên: {viewingCVModalCandidate.candidateName || 'Ứng viên'}</p>
                <p>- Vị trí ứng tuyển: {job.title}</p>
                <p>- Email: {viewingCVModalCandidate.candidateEmail || 'Chưa cung cấp'}</p>
                <p>- Trường / Học vấn: {viewingCVModalCandidate.candidateUniversity || 'Chưa cập nhật'}</p>
                <p>- Kỹ năng ứng viên: {(viewingCVModalCandidate.candidateSkills || []).join(', ') || 'Chưa cập nhật'}</p>
                {viewingCVModalCandidate.coverLetter && <p>- Thư giới thiệu: {viewingCVModalCandidate.coverLetter}</p>}
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
