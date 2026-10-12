import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AISkeletonLoading } from '../common/Skeleton';
import { generateAIDeepAnalysis, generatePersonalJobRoadmap } from '../../utils/matching';
import { aiApi } from '../../services/apiService';
import { Sparkles, FileText, CheckCircle2, Map } from 'lucide-react';

export function AIAnalysisModal() {
  const {
    isAIModalOpen,
    setIsAIModalOpen,
    selectedJob,
    jobs = [],
    candidateProfile,
    applyForJob,
    setActivePage,
    savePersonalRoadmap,
    setActiveRoadmapType,
    setActivePersonalJobId
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [personalRoadmap, setPersonalRoadmap] = useState(null);
  const [aiEngineUsed, setAiEngineUsed] = useState('CareerFit Intelligent Engine');

  // Fallback to first job if selectedJob is null
  const targetJob = selectedJob || jobs[0] || {
    id: 'job-1',
    title: 'Java Backend Fresher',
    company: 'FPT Software',
    location: 'Quận 9, TP.HCM',
    requiredSkills: ['Java', 'Spring Boot', 'SQL', 'Git']
  };

  useEffect(() => {
    let isMounted = true;
    if (isAIModalOpen) {
      setLoading(true);

      const runAnalysis = async () => {
        // 1. Phân tích nền tảng dựa trên đối chiếu CSDL & văn bản CV trích xuất
        const localRes = generateAIDeepAnalysis(candidateProfile, targetJob);

        // 2. Tự động sinh Roadmap cá nhân cho công việc cụ thể này dựa trên kỹ năng còn thiếu
        const generatedRoadmap = generatePersonalJobRoadmap(candidateProfile, targetJob);
        if (isMounted) {
          setPersonalRoadmap(generatedRoadmap);
          if (savePersonalRoadmap) {
            savePersonalRoadmap(generatedRoadmap);
          }
        }

        // 3. Thử gọi backend AI Orchestration qua aiApi.execute
        try {
          const aiPayload = {
            featureCode: 'CV_MATCH_EVALUATION',
            featureName: 'Đánh giá độ đáp ứng kỹ năng CV ứng viên',
            prompt: 'Bạn là chuyên gia thẩm định CV IT. Hãy đọc CV ứng viên, đối chiếu với yêu cầu kỹ năng của nhà tuyển dụng và đưa ra nhận xét chuyên sâu.',
            userQuery: `Đánh giá mức độ phù hợp của ứng viên với vị trí ${targetJob.title} tại ${targetJob.company}.`,
            userId: candidateProfile?.userId || candidateProfile?.id || 'candidate',
            userRole: 'CANDIDATE',
            answerInDatabase: true,
            databaseSummaryText: JSON.stringify({
              candidateName: candidateProfile?.name,
              profileSkills: candidateProfile?.skills || [],
              extractedCvTextSnippet: (candidateProfile?.extractedCvText || '').slice(0, 1500),
              jobTitle: targetJob.title,
              jobRequiredSkills: targetJob.requiredSkills || [],
              jobRequirements: targetJob.requirements || [],
              skillMatchPercentage: localRes.skillMatch,
              matchedSkills: localRes.matchedSkills,
              missingSkills: localRes.missingSkills,
              roadmapTopicsCount: (generatedRoadmap.topics || []).length
            })
          };

          const aiResponse = await aiApi.execute(aiPayload);
          if (isMounted && aiResponse && aiResponse.success && aiResponse.finalAnswer) {
            setAiEngineUsed(aiResponse.decisiveAiName || 'Hệ sinh thái AI Đa mô hình');
            if (aiResponse.reasoningChain) {
              localRes.explanation = aiResponse.reasoningChain;
            }
          }

          // 4. Với các kỹ năng chưa có trong CSDL (cần tra cứu Internet), kích hoạt AI Skill Discovery chuyên ngành IT
          const missingOnlineSkills = (generatedRoadmap.topics || [])
            .filter(t => t.sourceType === 'INTERNET_AI_VERIFIED')
            .map(t => t.skillName);
          const uniqueMissing = [...new Set(missingOnlineSkills)];

          if (uniqueMissing.length > 0) {
            for (const skill of uniqueMissing) {
              try {
                const discoveryRes = await aiApi.discoverSkill({
                  skillName: skill,
                  jobTitle: targetJob.title,
                  company: targetJob.company,
                  jobRequirements: Array.isArray(targetJob.requirements) ? targetJob.requirements.join('\n') : String(targetJob.requirements || ''),
                  startIndex: 1
                });
                const discData = discoveryRes?.data || discoveryRes;
                if (discData && discData.success && discData.topics && discData.topics.length > 0) {
                  const enrichedTopics = (generatedRoadmap.topics || []).map(top => {
                    if (top.skillName === skill) {
                      const matchIdx = top.id.endsWith('1') ? 0 : 1;
                      const aiTopic = discData.topics[matchIdx] || discData.topics[0];
                      if (aiTopic) {
                        return {
                          ...top,
                          title: aiTopic.title || top.title,
                          resource: aiTopic.resource || top.resource,
                          url: aiTopic.url || top.url,
                          description: aiTopic.description || top.description,
                          itDomainRole: discData.itExplanation,
                          aiConfidence: discData.confidence,
                          decisiveAiName: discData.decisiveAi
                        };
                      }
                    }
                    return top;
                  });
                  generatedRoadmap.topics = enrichedTopics;
                  if (isMounted) {
                    setPersonalRoadmap({ ...generatedRoadmap });
                    if (savePersonalRoadmap) {
                      savePersonalRoadmap({ ...generatedRoadmap });
                    }
                  }
                }
              } catch (discoveryErr) {
                console.debug('AI Skill Discovery fallback active:', discoveryErr);
              }
            }
          }
        } catch {
          // Khi backend offline hoặc timeout, local algorithm chuẩn 100% tự động phục vụ trơn tru
          if (isMounted) {
            setAiEngineUsed('CareerFit AI Evaluator (Trực tiếp từ CSDL & CV)');
          }
        }

        if (isMounted) {
          setAnalysis(localRes);
          setLoading(false);
        }
      };

      runAnalysis();
    }

    return () => {
      isMounted = false;
    };
  }, [isAIModalOpen, targetJob, candidateProfile]);

  const handleOpenPersonalRoadmap = () => {
    if (personalRoadmap && savePersonalRoadmap) {
      savePersonalRoadmap(personalRoadmap);
    }
    if (setActiveRoadmapType) {
      setActiveRoadmapType('PERSONAL');
    }
    if (setActivePersonalJobId) {
      setActivePersonalJobId(targetJob.id);
    }
    setIsAIModalOpen(false);
    setActivePage('learning-roadmap');
  };

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
          <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 text-amber-900">
            <div className="flex items-center justify-between">
              <p className="font-extrabold text-xs flex items-center gap-1.5 text-amber-950">
                <Sparkles size={14} className="text-amber-600" />
                Giải thích thuật toán CareerFit AI:
              </p>
              <span className="text-[10px] px-2 py-0.5 bg-amber-200/60 text-amber-900 font-bold rounded-full">
                {aiEngineUsed}
              </span>
            </div>
            <p className="leading-relaxed text-amber-800 text-[11px]">
              {analysis?.explanation || 'Hệ thống so khớp đối chiếu trực tiếp danh sách kỹ năng trên hồ sơ với yêu cầu trong JD của doanh nghiệp.'}
            </p>
            {candidateProfile?.hasCV && (
              <p className="text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                <CheckCircle2 size={12} className="text-emerald-600 shrink-0" />
                Đã phân tích kèm dữ liệu trích xuất từ tệp CV: <strong>{candidateProfile.cvFileName}</strong>
              </p>
            )}
            <p className="text-[10px] font-bold text-amber-700 pt-1 border-t border-amber-200/60">
              * Lưu ý: Kết quả phân tích mang tính chất định hướng và hỗ trợ phát triển kỹ năng, không phải tỷ lệ cam kết trúng tuyển.
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={handleOpenPersonalRoadmap}
              className="px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Map size={14} className="text-blue-600" />
              Xem Roadmap cá nhân hóa ({personalRoadmap?.topics?.length || 0} bài học)
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
