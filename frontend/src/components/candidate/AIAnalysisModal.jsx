import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AISkeletonLoading } from '../common/Skeleton';
import { generateAIDeepAnalysis } from '../../utils/matching';

export function AIAnalysisModal() {
  const {
    isAIModalOpen,
    setIsAIModalOpen,
    selectedJob,
    jobs = [],
    candidateProfile,
    applyForJob,
    setActivePage
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);

  // Fallback to first job if selectedJob is null
  const targetJob = selectedJob || jobs[0] || {
    id: 'job-1',
    title: 'Java Backend Fresher',
    company: 'FPT Software',
    location: 'Quận 9, TP.HCM',
    requiredSkills: ['Java', 'Spring Boot', 'SQL', 'Git']
  };

  useEffect(() => {
    if (isAIModalOpen) {
      setLoading(true);
      const timer = setTimeout(() => {
        const res = generateAIDeepAnalysis(candidateProfile, targetJob);
        setAnalysis(res);
        setLoading(false);
      }, 900);

      return () => clearTimeout(timer);
    }
  }, [isAIModalOpen, targetJob, candidateProfile]);

  if (!isAIModalOpen) return null;

  return (
    <Modal
      isOpen={isAIModalOpen}
      onClose={() => setIsAIModalOpen(false)}
      title="CareerFit AI - Phân tích Mức độ Phù hợp CV & Công việc"
    >
      {loading ? (
        <AISkeletonLoading />
      ) : (
        <div className="space-y-6 text-xs">
          {/* Header Job Summary */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
            <div className="space-y-1">
              <span className="px-2.5 py-0.5 bg-blue-500/30 text-blue-200 text-[10px] font-bold rounded-full border border-blue-400/30">
                AI Deep Matching
              </span>
              <h4 className="font-black text-white text-base tracking-tight">{targetJob.title}</h4>
              <p className="text-xs text-slate-300">{targetJob.company} • {targetJob.location}</p>
            </div>

            <div className="text-center bg-blue-600/90 border border-blue-400/40 text-white px-5 py-2.5 rounded-2xl shadow-lg shrink-0">
              <span className="text-2xl sm:text-3xl font-black">{analysis?.overallMatch || 75}%</span>
              <p className="text-[10px] font-bold tracking-wider uppercase text-blue-200">Match Score</p>
            </div>
          </div>

          {/* Detailed Breakdown Gauges */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl">
              <p className="text-lg font-black text-blue-700">{analysis?.skillMatch || 75}%</p>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">Skill Match</p>
            </div>
            <div className="p-3.5 bg-indigo-50/80 border border-indigo-200 rounded-2xl">
              <p className="text-lg font-black text-indigo-700">{analysis?.experienceMatch || 70}%</p>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">Experience Fit</p>
            </div>
            <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl">
              <p className="text-lg font-black text-emerald-700">{analysis?.projectRelevance || 80}%</p>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">Project Relevance</p>
            </div>
          </div>

          {/* Matched & Missing Skills */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2.5">
              <h5 className="font-extrabold text-emerald-900 text-xs">
                Kỹ năng đáp ứng tốt ({(analysis?.matchedSkills || []).length})
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {(analysis?.matchedSkills || []).map(sk => (
                  <span key={sk} className="px-2.5 py-0.5 bg-emerald-100/80 text-emerald-800 rounded-lg text-[11px] font-bold border border-emerald-300">
                    ✓ {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-2xl space-y-2.5">
              <h5 className="font-extrabold text-amber-900 text-xs">
                Kỹ năng cần bổ sung ({(analysis?.missingSkills || []).length})
              </h5>
              <div className="flex flex-wrap gap-1.5">
                {(analysis?.missingSkills || []).map(sk => (
                  <span key={sk} className="px-2.5 py-0.5 bg-amber-100/80 text-amber-900 rounded-lg text-[11px] font-bold border border-amber-300">
                    + {sk}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Strengths & Areas to improve */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <h5 className="font-black text-slate-900 mb-1">
                Điểm mạnh nổi bật:
              </h5>
              <ul className="list-disc list-inside text-slate-700 space-y-1 pl-1">
                {(analysis?.strengths || ['Nắm vững kiến thức nền tảng Java OOP', 'Kinh nghiệm thao tác truy vấn dữ liệu SQL']).map((str, i) => (
                  <li key={i}>{str}</li>
                ))}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <h5 className="font-black text-slate-900 mb-1">
                Đề xuất cải thiện để tối ưu:
              </h5>
              <ul className="list-disc list-inside text-slate-700 space-y-1 pl-1">
                {(analysis?.areasToImprove || ['Thực hành thêm về Spring Boot Framework', 'Bổ sung dự án cá nhân có sử dụng RESTful API']).map((area, i) => (
                  <li key={i}>{area}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* AI Explanation & Transparency Disclaimer */}
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1.5 text-amber-900">
            <p className="font-extrabold text-xs">
              Giải thích thuật toán CareerFit AI:
            </p>
            <p className="leading-relaxed text-amber-800 text-[11px]">
              {analysis?.explanation || 'Hệ thống so khớp đối chiếu trực tiếp danh sách kỹ năng trên hồ sơ với yêu cầu trong JD của doanh nghiệp.'}
            </p>
            <p className="text-[10px] font-bold text-amber-700 pt-1 border-t border-amber-200/60">
              * Lưu ý: Kết quả phân tích mang tính chất định hướng và hỗ trợ phát triển kỹ năng, không phải tỷ lệ cam kết trúng tuyển.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setIsAIModalOpen(false);
                setActivePage('learning-roadmap');
              }}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-colors cursor-pointer"
            >
              Xem Roadmap cải thiện
            </button>
            <button
              onClick={() => {
                setIsAIModalOpen(false);
                applyForJob(targetJob.id);
              }}
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-blue-500/20 cursor-pointer"
            >
              Ứng tuyển vị trí này
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}
