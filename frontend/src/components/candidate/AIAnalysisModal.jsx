import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Modal } from '../common/Modal';
import { AISkeletonLoading } from '../common/Skeleton';
import { generateAIDeepAnalysis, generatePersonalJobRoadmap, syncPersonalJobRoadmapWithProfile, synchronizeMatchedSkills, synthesizeCandidateCvText, getAllCandidateSkills } from '../../utils/matching';
import { aiApi } from '../../services/apiService';
import { Sparkles, FileText, CheckCircle2, Map, AlertTriangle, PlusCircle } from 'lucide-react';
import './AIAnalysisModal.css';

export function AIAnalysisModal() {
  const {
    isAIModalOpen,
    setIsAIModalOpen,
    selectedJob,
    jobs = [],
    candidateProfile,
    currentUser,
    applyForJob,
    setActivePage,
    savePersonalRoadmap,
    personalRoadmaps = [],
    setActiveRoadmapType,
    setActivePersonalJobId,
    saveCvEvaluation
  } = useApp();

  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState(null);
  const [personalRoadmap, setPersonalRoadmap] = useState(null);
  const [aiEngineUsed, setAiEngineUsed] = useState('CareerFit Intelligent Engine');
  const [roadmapAlreadyExisted, setRoadmapAlreadyExisted] = useState(false);
  const [newlyCompletedSkills, setNewlyCompletedSkills] = useState([]);
  const [newlyAddedSkills, setNewlyAddedSkills] = useState([]);

  // useMemo để targetJob giữ nguyên reference khi selectedJob không đổi
  // tránh useEffect re-trigger vô tận do object mới tạo mỗi lần re-render
  const targetJob = useMemo(() => selectedJob || jobs[0] || {
    id: 'job-1',
    title: 'Java Backend Fresher',
    company: 'FPT Software',
    location: 'Quận 9, TP.HCM',
    requiredSkills: ['Java', 'Spring Boot', 'SQL', 'Git']
  }, [selectedJob, jobs]);

  useEffect(() => {
    let isMounted = true;
    if (isAIModalOpen) {
      setLoading(true);
      setRoadmapAlreadyExisted(false);

      const runAnalysis = async () => {
        try {
          // Tự động kiểm tra và chữa lành nếu candidateProfile vẫn còn lưu vết văn bản biên bản cuộc họp cũ
          let effectiveProfile = candidateProfile;
          if (candidateProfile?.extractedCvText?.toLowerCase()?.includes('biên bản cuộc họp') &&
              candidateProfile?.cvFileName && !candidateProfile.cvFileName.toLowerCase().includes('meeting')) {
            effectiveProfile = {
              ...candidateProfile,
              extractedCvText: synthesizeCandidateCvText(candidateProfile, candidateProfile.cvFileName)
            };
          }

          // 1. Phân tích nền tảng dựa trên đối chiếu CSDL & văn bản CV trích xuất
          const localRes = generateAIDeepAnalysis(effectiveProfile, targetJob);
          const initialSynced = synchronizeMatchedSkills(localRes.matchedSkills, localRes.missingSkills, effectiveProfile, targetJob);
          localRes.matchedSkills = initialSynced.matchedSkills;
          localRes.missingSkills = initialSynced.missingSkills;
          // xác định kỹ năng đạt/thiếu và tạo nhận xét.
          if (isMounted) {
            setAnalysis({ ...localRes });
          }
          if (saveCvEvaluation) {
            saveCvEvaluation(effectiveProfile, targetJob, currentUser, {
              analysis: localRes,
              modelName: aiEngineUsed,
              analyzedAt: new Date().toISOString()
            });
          }

          // 2. Kiểm tra và đồng bộ Roadmap cá nhân cho công việc này
          const existingRoadmap = personalRoadmaps.find(
            r => String(r.jobId) === String(targetJob.id) || String(r.id) === String(targetJob.id)
          );

          let activeRoadmap = null;
          let newlyCompleted = [];
          let newlyAdded = [];

          if (existingRoadmap) {
            // ✅ Roadmap đã tồn tại — Đồng bộ theo đúng quy tắc người dùng yêu cầu:
            // - Đánh dấu completed cho các bài học của kỹ năng vừa bổ sung vào profile/CV (kỹ năng thiếu giảm đi)
            // - Bổ sung bài học mới nếu có kỹ năng thiếu mới phát sinh
            // - Giữ nguyên toàn bộ cấu trúc và tiến độ đã học trước đó
            const syncResult = syncPersonalJobRoadmapWithProfile(existingRoadmap, candidateProfile, targetJob);
            activeRoadmap = syncResult.updatedRoadmap;
            newlyCompleted = syncResult.newlyCompletedSkills;
            newlyAdded = syncResult.newlyAddedSkills;

            if (isMounted) {
              setPersonalRoadmap(activeRoadmap);
              setRoadmapAlreadyExisted(true);
              setNewlyCompletedSkills(newlyCompleted);
              setNewlyAddedSkills(newlyAdded);
            }

            if (syncResult.hasChanged && savePersonalRoadmap) {
              savePersonalRoadmap(activeRoadmap);
            }
          } else {
            // 3. Chưa có roadmap — tạo mới từ local algorithm
            activeRoadmap = generatePersonalJobRoadmap(candidateProfile, targetJob);
            if (isMounted) {
              setPersonalRoadmap(activeRoadmap);
              setRoadmapAlreadyExisted(false);
              setNewlyCompletedSkills([]);
              setNewlyAddedSkills([]);
              if (savePersonalRoadmap) {
                savePersonalRoadmap(activeRoadmap);
              }
            }
          }

          // 4. Gọi backend AI Orchestration để đánh giá lại các chỉ số với CV & kỹ năng mới nhất
          // Hard timeout 75s tổng thể — đảm bảo modal LUÔN dừng dù AI chậm đến đâu
          const hardTimeout = new Promise((resolve) => setTimeout(resolve, 75000, '__timeout__'));

          const aiWork = (async () => {
            try {
              const { profileSkills: candProfileSkills, cvSkills: candCvSkills, combinedSkills: candCombinedSkills } = getAllCandidateSkills(effectiveProfile);

              const aiPayload = {
                featureCode: 'CV_MATCH_EVALUATION',
                featureName: 'Đánh giá độ đáp ứng kỹ năng CV ứng viên',
                prompt: 'Bạn là chuyên gia thẩm định hồ sơ kỹ thuật IT cấp cao (Senior IT Technical Recruiter & CV Auditor). QUY ĐỊNH BẮT BUỘC: TOÀN BỘ CÂU TRẢ LỜI, SUY LUẬN VÀ GIẢI THÍCH PHẢI VIẾT 100% HOÀN TOÀN BẰNG TIẾNG VIỆT (tuyệt đối không dùng tiếng Anh trong các trường reasoning, answer, unrelatedDocumentWarning, strengths, areasToImprove). Nhiệm vụ của bạn là kiểm tra tính chân thực và chấm điểm mức độ phù hợp của CV với vị trí tuyển dụng. ĐỊNH DANH TÀI LIỆU: Nếu hồ sơ hoặc văn bản chứa thông tin ứng viên ngành CNTT (kỹ năng lập trình, chuyên ngành SE/IT, học vấn, mục tiêu/dự án phát triển phần mềm), BẮT BUỘC xác nhận isValidCv = true và documentType = "CV Công nghệ Thông tin". CHỈ TỪ CHỐI (isValidCv = false, experienceMatch = 0, projectRelevance = 0) khi tài liệu rõ ràng là biên bản cuộc họp, hợp đồng, hóa đơn, bài tiểu luận triết học hoặc CV ngành nghề hoàn toàn phi IT (kế toán, y tế, phục vụ bàn...). BẮT BUỘC KẾT HỢP CẢ 2 NGUỒN KỸ NĂNG: Bạn BẮT BUỘC phải kết hợp đầy đủ cả 2 nguồn: (1) Kỹ năng khai trên web (profileSkills) VÀ (2) Kỹ năng khai trong bản CV (cvDeclaredSkills & trích xuất văn bản CV: như Java, SQL, Git, Giao tiếp & Làm việc nhóm, Tư duy phản biện, Quản lý thời gian, Giải quyết vấn đề, Dẫn dắt/Lãnh đạo...). TUYỆT ĐỐI KHÔNG ĐƯỢC chỉ so sánh mỗi kỹ năng trên web mà bỏ sót kỹ năng trong CV! Bất kỳ kỹ năng nào có ở 1 trong 2 nơi đều được tính là ứng viên đã có. CHẤM ĐIỂM NGỮ NGHĨA (PHÂN BIỆT KỸ NĂNG MỀM VS KỸ THUẬT): Kỹ năng mềm "Giao tiếp & Làm việc nhóm" CHỈ khớp với kỹ năng mềm khác ("Teamwork", "Kỹ năng giao tiếp"). TUYỆT ĐỐI CẤM suy luận kỹ năng kỹ thuật/công cụ (Git, Docker, SQL, Linux, AWS, React, JavaScript...) từ kỹ năng mềm. Ví dụ: "Làm việc nhóm" KHÔNG BAO GIỜ khớp "Git". Kỹ năng kỹ thuật chỉ MATCHED khi ứng viên TỰ KHAI RÕ TRONG CV hoặc profile (ghi "Git", "GitHub", "version control" mới được tính là có Git). ĐỐI VỚI VỊ TRÍ THỰC TẬP (INTERNSHIP / FRESHER): Với sinh viên CNTT/Kỹ thuật phần mềm (SE), BẮT BUỘC chấm điểm kinh nghiệm (experienceMatch) từ 45% đến 85% dựa trên học vấn, đồ án và hoạt động thực tế, TUYỆT ĐỐI KHÔNG ĐƯỢC CHẤM 0% KINH NGHIỆM.',
                userQuery: `Đánh giá mức độ phù hợp của ứng viên với vị trí ${targetJob.title} (${targetJob.jobType || targetJob.level || 'Internship'}) tại ${targetJob.company}. Toàn bộ giải thích và phân tích phải viết bằng tiếng Việt.`,
                userId: candidateProfile?.userId || candidateProfile?.id || 'candidate',
                userRole: 'CANDIDATE',
                answerInDatabase: true,
                databaseSummaryText: JSON.stringify({
                  candidateName: candidateProfile?.name,
                  candidateDesiredRole: candidateProfile?.desiredRole,
                  candidateUniversity: candidateProfile?.university,
                  candidateMajor: candidateProfile?.major,
                  candidateBio: candidateProfile?.bio,
                  profileSkills: candProfileSkills,
                  cvDeclaredSkills: candCvSkills,
                  combinedCandidateSkills: candCombinedSkills,
                  extractedCvTextSnippet: (candidateProfile?.extractedCvText || '').slice(0, 10000),
                  jobTitle: targetJob.title,
                  jobCompany: targetJob.company,
                  jobType: targetJob.jobType || targetJob.level || 'Internship',
                  jobLevel: targetJob.level || targetJob.jobType || 'Internship',
                  jobRequiredSkills: targetJob.requiredSkills || [],
                  jobRequirements: targetJob.requirements || [],
                  skillMatchPercentage: localRes.skillMatch,
                  experienceMatchPercentage: localRes.experienceMatch,
                  overallMatchPercentage: localRes.overallMatch,
                  matchedSkills: localRes.matchedSkills,
                  missingSkills: localRes.missingSkills,
                  roadmapTopicsCount: (activeRoadmap.topics || []).length
                })
              };

              // 5. Xác định kỹ năng cần AI Discovery (INTERNET_AI_VERIFIED)
              // Chỉ tìm kiếm cho các kỹ năng chưa hoàn thành mà chưa có link bài học chính thức
              const missingOnlineSkills = (activeRoadmap.topics || [])
                .filter(t => t.sourceType === 'INTERNET_AI_VERIFIED' && !t.completed)
                .map(t => t.skillName);
              const uniqueMissing = [...new Set(missingOnlineSkills)];

              // Chạy SONG SONG: execute CV eval + tất cả discoverSkill cùng lúc
              const discoverPromises = uniqueMissing.map(skill =>
                aiApi.discoverSkill({
                  skillName: skill,
                  jobTitle: targetJob.title,
                  company: targetJob.company,
                  jobRequirements: Array.isArray(targetJob.requirements)
                    ? targetJob.requirements.join('\n')
                    : String(targetJob.requirements || ''),
                  startIndex: 1
                }).then(res => ({ skill, res })).catch(() => ({ skill, res: null }))
              );

              const [aiResponse, ...discoveryResults] = await Promise.all([
                aiApi.execute(aiPayload).catch(() => null),
                ...discoverPromises
              ]);

              if (isMounted && aiResponse && aiResponse.success) {
                setAiEngineUsed(aiResponse.decisiveAiName || 'Hệ sinh thái AI Đa mô hình');

                // Trích xuất dữ liệu có cấu trúc từ AI
                let aiData = aiResponse.structuredData;
                if (!aiData && aiResponse.finalAnswer) {
                  try {
                    const trimmed = String(aiResponse.finalAnswer).trim();
                    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
                      aiData = JSON.parse(trimmed);
                    }
                  } catch (e) {
                    // Ignore parse error
                  }
                }

                if (aiData) {
                  if (aiData.isValidCv !== undefined) {
                    localRes.isValidCv = Boolean(aiData.isValidCv);
                  }
                  if (aiData.documentType) {
                    localRes.documentType = String(aiData.documentType);
                  }
                  if (aiData.unrelatedDocumentWarning) {
                    localRes.unrelatedDocumentWarning = String(aiData.unrelatedDocumentWarning);
                  }
                  if (aiData.experienceMatch !== undefined) {
                    localRes.experienceMatch = Math.max(0, Math.min(100, Math.round(Number(aiData.experienceMatch))));
                  }
                  if (aiData.projectRelevance !== undefined) {
                    localRes.projectRelevance = Math.max(0, Math.min(100, Math.round(Number(aiData.projectRelevance))));
                  }
                  if (aiData.skillMatch !== undefined) {
                    localRes.skillMatch = Math.max(0, Math.min(100, Math.round(Number(aiData.skillMatch))));
                  }
                  if (aiData.overallMatch !== undefined) {
                    localRes.overallMatch = Math.max(0, Math.min(100, Math.round(Number(aiData.overallMatch))));
                  }
                  if (Array.isArray(aiData.matchedSkills)) {
                    localRes.matchedSkills = aiData.matchedSkills;
                  }
                  if (Array.isArray(aiData.missingSkills)) {
                    localRes.missingSkills = aiData.missingSkills;
                  }
                  if (Array.isArray(aiData.strengths) && aiData.strengths.length > 0) {
                    localRes.strengths = aiData.strengths;
                  }
                  if (Array.isArray(aiData.areasToImprove) && aiData.areasToImprove.length > 0) {
                    localRes.areasToImprove = aiData.areasToImprove;
                  }
                  if (aiData.answer) {
                    localRes.explanation = aiData.answer;
                  } else if (aiResponse.reasoningChain) {
                    localRes.explanation = aiResponse.reasoningChain;
                  }

                  // ĐỒNG BỘ TUYỆT ĐỐI VỚI HỒ SƠ ỨNG VIÊN
                  const aiSynced = synchronizeMatchedSkills(
                    localRes.matchedSkills,
                    localRes.missingSkills,
                    candidateProfile,
                    targetJob
                  );
                  localRes.matchedSkills = aiSynced.matchedSkills;
                  localRes.missingSkills = aiSynced.missingSkills;
                  if (localRes.isValidCv !== false) {
                    const reqCount = (targetJob.requiredSkills || []).length;
                    if (reqCount > 0) {
                      localRes.skillMatch = Math.min(100, Math.round((localRes.matchedSkills.length / reqCount) * 100));
                    }
                    localRes.overallMatch = Math.round(
                      (localRes.skillMatch * 0.5) + (localRes.experienceMatch * 0.3) + (localRes.projectRelevance * 0.2)
                    );
                  }
                  setAnalysis({ ...localRes });
                  if (saveCvEvaluation) {
                    saveCvEvaluation(candidateProfile, targetJob, currentUser, {
                      analysis: localRes,
                      modelName: aiResponse?.decisiveAiName || aiEngineUsed,
                      analyzedAt: new Date().toISOString()
                    });
                  }
                } else if (aiResponse.reasoningChain) {
                  localRes.explanation = aiResponse.reasoningChain;
                  const aiSynced = synchronizeMatchedSkills(
                    localRes.matchedSkills,
                    localRes.missingSkills,
                    candidateProfile,
                    targetJob
                  );
                  localRes.matchedSkills = aiSynced.matchedSkills;
                  localRes.missingSkills = aiSynced.missingSkills;
                  if (localRes.isValidCv !== false) {
                    const reqCount = (targetJob.requiredSkills || []).length;
                    if (reqCount > 0) {
                      localRes.skillMatch = Math.min(100, Math.round((localRes.matchedSkills.length / reqCount) * 100));
                    }
                    localRes.overallMatch = Math.round(
                      (localRes.skillMatch * 0.5) + (localRes.experienceMatch * 0.3) + (localRes.projectRelevance * 0.2)
                    );
                  }
                  setAnalysis({ ...localRes });
                  if (saveCvEvaluation) {
                    saveCvEvaluation(candidateProfile, targetJob, currentUser, {
                      analysis: localRes,
                      modelName: aiResponse?.decisiveAiName || aiEngineUsed,
                      analyzedAt: new Date().toISOString()
                    });
                  }
                }
              }

              // Áp dụng kết quả discovery vào roadmap
              let hasDiscoveryUpdate = false;
              for (const { skill, res: discoveryRes } of discoveryResults) {
                const discData = discoveryRes?.data || discoveryRes;
                if (discData && discData.success && discData.topics && discData.topics.length > 0) {
                  activeRoadmap.topics = (activeRoadmap.topics || []).map(top => {
                    if (top.skillName === skill && !top.completed) {
                      const matchIdx = top.id.endsWith('1') ? 0 : 1;
                      const aiTopic = discData.topics[matchIdx] || discData.topics[0];
                      if (aiTopic) {
                        hasDiscoveryUpdate = true;
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
                }
              }

              if (isMounted) {
                setPersonalRoadmap({ ...activeRoadmap });
                if (hasDiscoveryUpdate && savePersonalRoadmap) {
                  savePersonalRoadmap({ ...activeRoadmap });
                }
              }
            } catch {
              // Khi backend offline hoặc timeout, local algorithm chuẩn 100% tự động phục vụ trơn tru
              if (isMounted) {
                setAiEngineUsed('CareerFit AI Evaluator (Trực tiếp từ CSDL & CV)');
              }
            }
          })();

          // Race giữa AI work và hard timeout — đảm bảo modal luôn dừng trong 75s
          await Promise.race([aiWork, hardTimeout]);

          // Đảm bảo đồng bộ tuyệt đối với hồ sơ ứng viên trước khi hiển thị
          const finalSynced = synchronizeMatchedSkills(
            localRes.matchedSkills,
            localRes.missingSkills,
            candidateProfile,
            targetJob
          );
          localRes.matchedSkills = finalSynced.matchedSkills;
          localRes.missingSkills = finalSynced.missingSkills;

          if (isMounted) {
            setAnalysis({ ...localRes });
          }
          if (saveCvEvaluation) {
            saveCvEvaluation(candidateProfile, targetJob, currentUser, {
              analysis: localRes,
              modelName: aiEngineUsed,
              analyzedAt: new Date().toISOString()
            });
          }
        } catch (err) {
          console.error('AIAnalysisModal critical error:', err);
        } finally {
          // finally đảm bảo setLoading(false) LUÔN chạy dù có exception ở bất kỳ bước nào
          if (isMounted) {
            setLoading(false);
          }
        }
      };

      runAnalysis().catch((err) => {
        console.error('runAnalysis unhandled:', err);
        if (isMounted) setLoading(false);
      });
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
              <span className="text-2xl sm:text-3xl font-black">{analysis?.overallMatch ?? 0}%</span>
              <p className="text-[10px] font-bold tracking-wider uppercase text-blue-200">Match Score</p>
            </div>
          </div>

          {/* Cảnh báo tài liệu không hợp lệ / không phải CV IT */}
          {analysis?.unrelatedDocumentWarning && (
            <div className="p-4 bg-rose-50 border-2 border-rose-300 rounded-2xl flex items-start gap-3 text-rose-900 shadow-sm animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h5 className="font-extrabold text-xs text-rose-900">Cảnh báo tài liệu không hợp lệ / Không phải CV IT</h5>
                  {analysis?.documentType && (
                    <span className="px-2 py-0.5 bg-rose-200/90 text-rose-900 text-[10px] font-bold rounded-md border border-rose-300">
                      {analysis.documentType}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-rose-700 leading-relaxed font-medium">{analysis.unrelatedDocumentWarning}</p>
              </div>
            </div>
          )}

          {/* Thông báo Roadmap đã từng được tạo cho công việc này */}
          {roadmapAlreadyExisted && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-start gap-3 text-emerald-900 shadow-sm animate-fadeIn">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h5 className="font-extrabold text-xs text-emerald-900">
                    Lộ trình học tập đã được đồng bộ với Hồ sơ & CV mới nhất
                  </h5>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-200/80 text-emerald-800 font-bold rounded-md">
                    Tiến độ được bảo lưu
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed font-medium">
                  Hệ thống giữ nguyên toàn bộ lộ trình và tiến độ học tập bạn đã lưu cho vị trí "<strong>{targetJob.title}</strong>". Các chỉ số đánh giá đã được tính toán lại theo kỹ năng và CV mới nhất của bạn.
                </p>
                {newlyCompletedSkills.length > 0 && (
                  <div className="p-2.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-[11px] text-emerald-950 font-semibold flex items-center gap-2 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                    <span>
                      Đã tự động đánh dấu <strong>HOÀN THÀNH</strong> bài học cho kỹ năng bạn vừa bổ sung vào Hồ sơ/CV: <strong>{newlyCompletedSkills.join(', ')}</strong>.
                    </span>
                  </div>
                )}
                {newlyAddedSkills.length > 0 && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-[11px] text-blue-950 font-semibold flex items-center gap-2 mt-1">
                    <PlusCircle className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>
                      Đã tự động <strong>BỔ SUNG</strong> bài học vào lộ trình cho kỹ năng còn thiếu mới: <strong>{newlyAddedSkills.join(', ')}</strong>.
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Detailed Breakdown Gauges */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className={`p-3.5 rounded-2xl border transition-all ${analysis?.skillMatch === 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-blue-50/80 border-blue-200'}`}>
              <p className={`text-lg font-black ${analysis?.skillMatch === 0 ? 'text-rose-700' : 'text-blue-700'}`}>{analysis?.skillMatch ?? 0}%</p>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">Skill Match</p>
            </div>
            <div className={`p-3.5 rounded-2xl border transition-all ${analysis?.experienceMatch === 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-indigo-50/80 border-indigo-200'}`}>
              <p className={`text-lg font-black ${analysis?.experienceMatch === 0 ? 'text-rose-700' : 'text-indigo-700'}`}>{analysis?.experienceMatch ?? 0}%</p>
              <p className="text-[11px] text-slate-600 font-bold mt-0.5">Experience Fit</p>
            </div>
            <div className={`p-3.5 rounded-2xl border transition-all ${analysis?.projectRelevance === 0 ? 'bg-rose-50/80 border-rose-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
              <p className={`text-lg font-black ${analysis?.projectRelevance === 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{analysis?.projectRelevance ?? 0}%</p>
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
                {analysis?.isValidCv === false ? (
                  <li className="text-slate-500 italic">Chưa thể đánh giá điểm mạnh do tệp tải lên không phải CV chuyên ngành CNTT.</li>
                ) : (
                  (analysis?.strengths && analysis.strengths.length > 0
                    ? analysis.strengths
                    : ['Nắm vững kiến thức nền tảng kỹ thuật', 'Hồ sơ có định hướng phù hợp vị trí']
                  ).map((str, i) => (
                    <li key={i}>{str}</li>
                  ))
                )}
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-200">
              <h5 className="font-black text-slate-900 mb-1">
                Đề xuất cải thiện để tối ưu:
              </h5>
              <ul className="list-disc list-inside text-slate-700 space-y-1 pl-1">
                {(analysis?.areasToImprove && analysis.areasToImprove.length > 0
                  ? analysis.areasToImprove
                  : ['Thực hành thêm về các framework yêu cầu', 'Bổ sung dự án cá nhân có sử dụng RESTful API']
                ).map((area, i) => (
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
              {roadmapAlreadyExisted ? (
                <>
                  Xem Roadmap đã tạo
                  <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md text-[10px] font-extrabold">
                    ✓ Đã lưu
                  </span>
                </>
              ) : (
                <>Xem Roadmap cá nhân hóa ({personalRoadmap?.topics?.length || 0} bài học)</>
              )}
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
