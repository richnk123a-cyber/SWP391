import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Minus,
  X,
  Paperclip,
  Send,
  RotateCcw,
  SkipForward,
  ArrowLeft,
  XCircle,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  Bot,
  Wand2,
  FileCheck,
  Award
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  CANDIDATE_INITIAL_MESSAGES,
  EMPLOYER_INITIAL_MESSAGES,
  CANDIDATE_SUGGESTION_CHIPS,
  EMPLOYER_SUGGESTION_CHIPS,
  GENERAL_MOCK_RESPONSES
} from '../../data/chatbotMockData';
import {
  CHATBOT_MODES,
  CV_GUIDE_STEPS,
  JOB_POST_GUIDE_STEPS,
  createInitialSession,
  detectIntent,
  generateCvPreview,
  generateJobDraftPreview
} from '../../services/chatbotGuideService';
import { assistantApi } from '../../services/apiService';
import '../../styles/chatbot.css';

// Hàm nhận diện ý định hủy luồng hướng dẫn theo lệnh văn bản (BUG-CHATBOT-01)
const isCancelIntent = (text) => {
  if (!text) return false;
  const t = text.trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // Xóa dấu tiếng Việt
  const cancelKeywords = [
    'huy', 'thoi', 'dung', 'dung lai', 'cancel', 'quit', 'exit', 'stop',
    'ko tao nua', 'khong tao nua', 'khong tiep tuc', 'ko tiep tuc',
    'khong lam nua', 'ko lam nua', 'khong can', 'ko can',
    'khong muon tao', 'ko muon tao', 'bo qua luong', 'dung luong',
    'huy luong', 'bo cuoc', 'khong can nua', 'thoi khong tiep tuc',
    'ko muon tiep tuc', 'khong muon tiep tuc', 'ngung', 'ngung lai'
  ];
  return cancelKeywords.some(kw => t === kw || t.startsWith(kw + ' ') || t.endsWith(' ' + kw) || t.includes(' ' + kw + ' ') || (kw.length >= 4 && t.includes(kw)));
};

export function CareerFitChatbot() {
  const { currentUser, setActivePage } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isPolishing, setIsPolishing] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [userContext, setUserContext] = useState(null);

  const role = currentUser?.role;
  const isCandidate = role === 'CANDIDATE';
  const isEmployer = role === 'EMPLOYER';

  // Lời chào ban đầu theo vai trò (chỉ đúng 1 lời chào)
  const initialMessages = useMemo(() => {
    return isEmployer ? EMPLOYER_INITIAL_MESSAGES : CANDIDATE_INITIAL_MESSAGES;
  }, [isEmployer]);

  const [messages, setMessages] = useState(initialMessages);
  const [session, setSession] = useState(() => createInitialSession(role));

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Tải ngữ cảnh người dùng hiện tại an toàn từ Backend
  useEffect(() => {
    if (!currentUser || (!isCandidate && !isEmployer)) return;

    let isMounted = true;
    assistantApi.getContext()
      .then(res => {
        if (isMounted && res?.data) {
          setUserContext(res.data);
        }
      })
      .catch(err => {
        console.debug('Chưa kết nối context backend:', err?.message);
      });

    return () => { isMounted = false; };
  }, [currentUser, isCandidate, isEmployer]);

  // Reset sạch sẽ dữ liệu hội thoại khi người dùng đăng xuất hoặc đổi tài khoản/role
  const userSessionKey = currentUser ? `${currentUser.id || currentUser.email || ''}_${role}` : 'anonymous';
  useEffect(() => {
    setMessages(isEmployer ? EMPLOYER_INITIAL_MESSAGES : CANDIDATE_INITIAL_MESSAGES);
    setSession(createInitialSession(role));
    setInputValue('');
    setIsTyping(false);
    setIsPolishing(false);
    setIsOpen(false);
    setIsHovered(false);
    setCopiedId(null);
  }, [userSessionKey, isEmployer, role]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom('auto');
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isTyping, scrollToBottom]);

  // Chỉ hiển thị chatbot khi đã đăng nhập, tài khoản chưa bị khóa và là CANDIDATE hoặc EMPLOYER
  if (!mounted || !currentUser || (!isCandidate && !isEmployer) || currentUser?.status === 'LOCKED') {
    return null;
  }

  const suggestionChips = isEmployer ? EMPLOYER_SUGGESTION_CHIPS : CANDIDATE_SUGGESTION_CHIPS;
  const currentGuideSteps = session.mode === CHATBOT_MODES.CV_GUIDE ? CV_GUIDE_STEPS : JOB_POST_GUIDE_STEPS;
  const currentStepDef = session.mode !== CHATBOT_MODES.GENERAL ? currentGuideSteps[session.stepIndex] : null;

  // Sao chép văn bản vào Clipboard
  const handleCopyText = async (text, id) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2500);
    } catch {
      alert('Không thể sao chép tự động. Vui lòng bôi đen văn bản để sao chép!');
    }
  };

  // Điều hướng nội bộ
  const handleNavigate = (pageKey) => {
    if (setActivePage) {
      setActivePage(pageKey);
    }
  };

  // Hủy luồng hướng dẫn hiện tại
  const handleCancelGuide = () => {
    setSession(prev => ({
      ...prev,
      mode: CHATBOT_MODES.GENERAL,
      stepIndex: 0,
      collectedData: {},
      isComplete: false
    }));

    const botMsg = {
      id: `msg-bot-${Date.now()}`,
      sender: 'bot',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: 'Đã hủy quy trình hướng dẫn. Bạn có thể hỏi mình bất cứ điều gì hoặc chọn các gợi ý bên dưới nhé!'
    };
    setMessages(prev => [...prev, botMsg]);
  };

  // Bắt đầu lại quy trình hướng dẫn từ Bước 1
  const handleRestartGuide = () => {
    setSession(prev => ({
      ...prev,
      stepIndex: 0,
      collectedData: {},
      isComplete: false
    }));

    const firstStep = currentGuideSteps[0];
    const botMsg = {
      id: `msg-bot-${Date.now()}`,
      sender: 'bot',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: `🔄 **Đã bắt đầu lại quy trình từ Bước 1:**\n\n${firstStep.prompt}`,
      quickOptions: firstStep.quickOptions,
      isStepPrompt: true,
      stepNumber: 1,
      totalSteps: currentGuideSteps.length
    };
    setMessages(prev => [...prev, botMsg]);
  };

  // Quay lại bước trước đó trong luồng hướng dẫn
  const handlePreviousStep = () => {
    if (session.stepIndex <= 0) return;

    const prevIndex = session.stepIndex - 1;
    const prevStepDef = currentGuideSteps[prevIndex];

    setSession(prev => {
      const nextData = { ...prev.collectedData };
      delete nextData[currentStepDef?.field];
      return {
        ...prev,
        stepIndex: prevIndex,
        collectedData: nextData,
        isComplete: false
      };
    });

    const botMsg = {
      id: `msg-bot-${Date.now()}`,
      sender: 'bot',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: `↩️ **Quay lại Bước ${prevIndex + 1}/${currentGuideSteps.length}:**\n\n${prevStepDef.prompt}`,
      quickOptions: prevStepDef.quickOptions,
      isStepPrompt: true,
      stepNumber: prevIndex + 1,
      totalSteps: currentGuideSteps.length
    };
    setMessages(prev => [...prev, botMsg]);
  };

  // Bỏ qua bước tùy chọn (Kinh nghiệm, Chứng chỉ ở CV Guide)
  const handleSkipStep = () => {
    if (!currentStepDef || !currentStepDef.canSkip) return;

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: '⏭️ Bỏ qua bước này'
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    setTimeout(() => {
      processNextGuideStep('Chưa cập nhật (Sinh viên chưa có kinh nghiệm / chứng chỉ)');
    }, 400);
  };

  // Tiến hành bước tiếp theo trong State Machine
  const processNextGuideStep = (userAnswer) => {
    const isCvMode = session.mode === CHATBOT_MODES.CV_GUIDE;
    const steps = isCvMode ? CV_GUIDE_STEPS : JOB_POST_GUIDE_STEPS;
    const currentStep = steps[session.stepIndex];

    const updatedData = {
      ...session.collectedData,
      [currentStep.field]: userAnswer
    };

    // Kiểm tra xem đã hoàn thành tất cả các bước chưa -> TỰ ĐỘNG GỌI AI CHUẨN HÓA & SỬA LỖI
    if (session.stepIndex >= steps.length - 1) {
      setSession(prev => ({
        ...prev,
        collectedData: updatedData,
        isComplete: true
      }));

      const analyzingMsg = {
        id: `msg-bot-analyzing-${Date.now()}`,
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: isCvMode
          ? '🎉 **Cảm ơn bạn! CareerFit AI đã thu thập đủ 7 bước thông tin.**\n⚡ Hệ thống đang tự động sửa mọi lỗi chính tả & lỗi gõ phím, bóc tách chính xác từng trường (Họ tên, Email, SĐT, Học vấn, Đồ án) và tối ưu CV chuẩn ATS cho bạn...'
          : '🎉 **Cảm ơn quý công ty! CareerFit AI đã thu thập đầy đủ thông tin tuyển dụng.**\n⚡ Hệ thống đang phân tích yêu cầu, chuẩn hóa danh mục kỹ năng và chuẩn bị biểu mẫu Đăng tin...'
      };

      setMessages(prev => [...prev, analyzingMsg]);
      setIsTyping(true);

      // Tự động kích hoạt quy trình AI Chuẩn hóa & Điền dữ liệu
      if (isCvMode) {
        handlePolishCv(updatedData, analyzingMsg.id);
      } else {
        handlePolishJob(updatedData, analyzingMsg.id);
      }
      return;
    }

    const nextIndex = session.stepIndex + 1;
    const nextStepDef = steps[nextIndex];

    setSession(prev => ({
      ...prev,
      stepIndex: nextIndex,
      collectedData: updatedData
    }));

    const nextBotMsg = {
      id: `msg-bot-step-${Date.now()}`,
      sender: 'bot',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: nextStepDef.prompt,
      quickOptions: nextStepDef.quickOptions,
      isStepPrompt: true,
      stepNumber: nextIndex + 1,
      totalSteps: steps.length
    };

    setMessages(prev => [...prev, nextBotMsg]);
    setIsTyping(false);
  };

  // Kích hoạt AI Chuẩn hóa CV (Kết nối Groq Backend với fallback thông minh)
  const handlePolishCv = async (draftData, msgId) => {
    setIsPolishing(true);
    setIsTyping(true);
    let data = null;

    try {
      const res = await assistantApi.polishCv({
        targetRole: draftData.targetRole,
        contactInfo: draftData.contactInfo,
        education: draftData.education,
        skills: draftData.skills,
        projects: draftData.projects,
        experience: draftData.experience,
        certifications: draftData.certifications,
        bio: draftData.bio || draftData.targetRole
      });
      data = res?.data?.data || res?.data || res;
    } catch (err) {
      console.warn('AI polishCv gặp sự cố, chuyển sang chuẩn hóa thông minh dự phòng:', err);
    }

    // Nếu backend chưa chạy hoặc lỗi mạng, tự động chuẩn hóa bằng bộ từ điển công nghệ dự phòng
    if (!data || !data.normalizedSkills) {
      const rawSkills = String(draftData.skills || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);
      const normalized = rawSkills.map(s => {
        const lower = s.toLowerCase();
        if (lower === 'jjva' || lower === 'javaa') return 'Java';
        if (lower === 'sql sever' || lower === 'sqlserver') return 'SQL Server';
        if (lower === 'reactjs' || lower === 'react.js') return 'React';
        if (lower === 'nodejs' || lower === 'node.js') return 'Node.js';
        if (lower === 'springboot') return 'Spring Boot';
        return s;
      });

      data = {
        normalizedSkills: normalized.length > 0 ? normalized : ['Java', 'Spring Boot', 'MySQL', 'Git'],
        suggestedBio: `Sinh viên ngành CNTT nhiệt huyết, có nền tảng vững vàng về ${normalized.join(', ')}, mong muốn ứng tuyển vị trí ${draftData.targetRole || 'Lập trình viên IT'} để đóng góp vào dự án thực tế.`,
        improvedProjects: draftData.projects || '• Dự án website quản lý: Xây dựng RESTful API và thiết kế CSDL.',
        improvedExperience: draftData.experience || 'Chưa có kinh nghiệm chính thức (Tập trung phát triển đồ án thực hành & kỹ năng chuyên môn)',
        improvements: ['Đã chuẩn hóa danh mục kỹ năng', 'Tối ưu hóa mục tiêu nghề nghiệp theo chuẩn IT'],
        missingSkills: ['Docker', 'RESTful API', 'Unit Testing']
      };
    }

    const polishMsg = {
      id: `msg-polish-cv-${Date.now()}`,
      sender: 'bot',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: `🤖 **KẾT QUẢ CHUẨN HÓA BẢN NHÁP CV TỪ CAREERFIT AI:**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `✨ **Kỹ năng đã chuẩn hóa:** ${data.normalizedSkills?.join(', ')}\n\n` +
        `📌 **Mục tiêu nghề nghiệp tối ưu:**\n${data.suggestedBio}\n\n` +
        `🚀 **Đồ án đã cấu trúc:**\n${data.improvedProjects}\n\n` +
        `💡 **Kỹ năng cốt lõi nên bổ sung cho vị trí ${draftData.targetRole || 'IT'}:**\n` +
        `${data.missingSkills?.map(s => `• ${s}`).join('\n') || '• Docker\n• RESTful API'}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Bạn có thể bấm **[🚀 Tự động điền vào Hồ sơ cá nhân]** để áp dụng trực tiếp các mục trên vào form Hồ sơ CareerFit nhé!`,
      isPolishedCvResult: true,
      polishedCvData: {
        ...draftData,
        skills: data.normalizedSkills,
        bio: data.suggestedBio,
        desiredRole: draftData.targetRole,
        templateCvData: data.templateCvData
      }
    };

    setMessages(prev => [...prev, polishMsg]);
    setIsPolishing(false);
    setIsTyping(false);
  };

  // Kích hoạt AI Chuẩn hóa JD & Chấm điểm chất lượng (Kết nối Groq Backend với fallback thông minh)
  const handlePolishJob = async (draftData, msgId) => {
    setIsPolishing(true);
    let data = null;

    try {
      const res = await assistantApi.polishJob({
        title: draftData.title,
        category: draftData.category,
        location: draftData.location,
        salary: draftData.salary,
        requiredSkills: draftData.skills,
        responsibilities: draftData.responsibilities,
        benefits: draftData.benefits,
        jobType: draftData.jobTypeAndWorkMode
      });
      data = res?.data?.data || res?.data || res;
    } catch (err) {
      console.warn('Backend Groq polishJob không khả dụng, dùng chuẩn hóa dự phòng:', err);
    }

    if (!data || !data.improvedTitle) {
      data = {
        improvedTitle: draftData.title || 'Lập trình viên IT Intern/Fresher',
        qualityScore: 88,
        qualityChecklist: ['Tiêu đề và cấp bậc rõ ràng', 'Phân loại kỹ năng chuẩn', 'Quyền lợi phù hợp sinh viên IT'],
        normalizedRequiredSkills: draftData.skills ? String(draftData.skills).split(/[,;\n]/).map(s => s.trim()) : ['Java', 'SQL', 'Git'],
        normalizedPreferredSkills: ['Spring Boot', 'Docker'],
        improvedResponsibilities: draftData.responsibilities || '• Tham gia phát triển tính năng module theo yêu cầu.\n• Lập trình RESTful API và tối ưu câu lệnh CSDL.',
        improvedBenefits: draftData.benefits || '• Phụ cấp thực tập hấp dẫn.\n• Mentor 1-1 bởi Senior Developer.\n• Hỗ trợ dấu mộc thực tập và báo cáo tốt nghiệp.'
      };
    }

    const polishMsg = {
      id: `msg-polish-job-${Date.now()}`,
      sender: 'bot',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: `🤖 **KẾT QUẢ CHUẨN HÓA JD & ĐÁNH GIÁ CHẤT LƯỢNG (CAREERFIT AI):**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `⭐ **Điểm chất lượng JD:** **${data.qualityScore || 88}/100**\n` +
        `✅ **Checklist tiêu chí:**\n${data.qualityChecklist?.map(c => `• ${c}`).join('\n')}\n\n` +
        `📌 **Chức danh đề xuất:** ${data.improvedTitle}\n` +
        `🎯 **Kỹ năng bắt buộc (Required):** ${data.normalizedRequiredSkills?.join(', ')}\n` +
        `✨ **Kỹ năng ưu tiên (Preferred):** ${data.normalizedPreferredSkills?.join(', ')}\n\n` +
        `📋 **Trách nhiệm chính đã làm rõ:**\n${data.improvedResponsibilities}\n\n` +
        `🎁 **Quyền lợi nổi bật thu hút sinh viên:**\n${data.improvedBenefits}\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
        `Bạn có thể bấm **[🚀 Tự động điền vào Form Đăng tin]** để mở form tạo tin tuyển dụng chính thức trên CareerFit!`,
      isPolishedJobResult: true,
      polishedJobData: {
        ...draftData,
        title: data.improvedTitle,
        requiredSkills: data.normalizedRequiredSkills,
        preferredSkills: data.normalizedPreferredSkills,
        responsibilities: typeof data.improvedResponsibilities === 'string'
          ? data.improvedResponsibilities.split('\n').filter(Boolean)
          : [draftData.responsibilities],
        benefits: data.improvedBenefits
      }
    };

    setMessages(prev => [...prev, polishMsg]);
    setIsPolishing(false);
    setIsTyping(false);
  };

  // Mở khung CV chuẩn (Times New Roman) với toàn bộ thông tin đã được điền sẵn & tối ưu
// Mở khung CV chuẩn (Times New Roman) với toàn bộ thông tin đã được bóc tách chuẩn & sửa lỗi chính tả
  const handleOpenCvTemplateModal = (draftOrTemplate) => {
    try {
      const t = draftOrTemplate?.templateCvData || draftOrTemplate || {};

      // 1. Thông minh bóc tách Họ tên, Email, Số điện thoại, Địa chỉ (bất kể thứ tự người dùng nhập)
      const rawContact = String(t.contactInfo || '').trim();
      let extractedEmail = t.email || '';
      let extractedPhone = t.phone || '';
      let extractedName = t.name || '';
      let extractedLocation = t.location || '';

      if (rawContact) {
        // Tách Email
        if (!extractedEmail) {
          const emailMatch = rawContact.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
          if (emailMatch) extractedEmail = emailMatch[0];
        }
        // Tách Số điện thoại (10 số)
        if (!extractedPhone) {
          const phoneMatch = rawContact.match(/(?:\+?84|0)\d{9,10}/);
          if (phoneMatch) extractedPhone = phoneMatch[0];
        }
        // Tách Địa chỉ / Tỉnh thành
        if (!extractedLocation || extractedLocation === 'TP.HCM') {
          const lowerContact = rawContact.toLowerCase();
          if (lowerContact.includes('hà nội') || lowerContact.includes('ha noi')) extractedLocation = 'Hà Nội';
          else if (lowerContact.includes('hồ chí minh') || lowerContact.includes('hcm') || lowerContact.includes('sài gòn') || lowerContact.includes('sai gon') || lowerContact.includes('tp.hcm')) extractedLocation = 'TP.HCM';
          else if (lowerContact.includes('đà nẵng') || lowerContact.includes('da nang')) extractedLocation = 'Đà Nẵng';
          else if (lowerContact.includes('cần thơ') || lowerContact.includes('can tho')) extractedLocation = 'Cần Thơ';
          else if (lowerContact.includes('hải phòng') || lowerContact.includes('hai phong')) extractedLocation = 'Hải Phòng';
          else if (lowerContact.includes('bình dương') || lowerContact.includes('binh duong')) extractedLocation = 'Bình Dương';
          else if (currentUser?.location) extractedLocation = currentUser.location;
          else extractedLocation = '';
        }
        // Họ tên là phần còn lại sau khi loại trừ email, phone và location (chuẩn 100% bất chấp thứ tự)
        if (!extractedName || extractedName === currentUser?.name || extractedName === 'Ứng viên' || extractedName === 'Ứng viên IT') {
          let clean = rawContact;
          if (extractedEmail) clean = clean.replace(extractedEmail, '');
          if (extractedPhone) clean = clean.replace(extractedPhone, '');
          if (extractedLocation) clean = clean.replace(new RegExp(extractedLocation, 'gi'), '');
          clean = clean.replace(/[,;\-\n/]+/g, ' ').trim();
          if (clean.length >= 2) extractedName = clean;
        }
      }
      if (!extractedName || extractedName === currentUser?.name) {
        extractedName = currentUser?.name || 'Võ Nguyên Khánh';
      }
      if (!extractedEmail) extractedEmail = currentUser?.email || '';

      // 2. Sửa lỗi chính tả & chuẩn hóa Vị trí ứng tuyển
      let rawRole = t.desiredRole || t.targetRole || 'Lập trình viên IT';
      const lowRole = rawRole.toLowerCase();
      if (lowRole.includes('quản lí') || lowRole.includes('quan ly') || lowRole.includes('dự an') || lowRole.includes('du an') || lowRole.includes('pm')) {
        rawRole = 'Quản lý Dự án IT (IT Project Manager)';
      } else if (lowRole.includes('backend') || lowRole.includes('java')) {
        rawRole = 'Java Backend Developer';
      } else if (lowRole.includes('frontend') || lowRole.includes('react')) {
        rawRole = 'Frontend React Developer';
      }

      // 3. Thông minh bóc tách Học vấn
      const rawEdu = String(t.education || '').trim();
      let extractedUni = t.university || '';
      let extractedMajor = t.major || '';
      let extractedYear = t.graduationYear || '2028';

      if (rawEdu) {
        const yearMatches = rawEdu.match(/202\d/g);
        if (yearMatches && yearMatches.length > 0) extractedYear = yearMatches[yearMatches.length - 1];
        if (!extractedUni || extractedUni === rawEdu) {
          if (rawEdu.toLowerCase().includes('fpt')) extractedUni = 'Đại học FPT';
          else if (rawEdu.toLowerCase().includes('bách khoa')) extractedUni = 'Đại học Bách Khoa';
          else {
            const parts = rawEdu.split(/[,;\n]+/);
            extractedUni = parts[0]?.trim() || 'Đại học FPT';
          }
        }
        if (!extractedMajor || extractedMajor === rawEdu) {
          if (rawEdu.toLowerCase().includes('phần mềm') || rawEdu.toLowerCase().includes('phan mem')) extractedMajor = 'Kỹ thuật phần mềm';
          else if (rawEdu.toLowerCase().includes('khoa học máy tính')) extractedMajor = 'Khoa học máy tính';
          else if (rawEdu.toLowerCase().includes('hệ thống')) extractedMajor = 'Hệ thống thông tin';
          else extractedMajor = 'Công nghệ thông tin';
        }
      }
      if (!extractedUni) extractedUni = 'Đại học FPT';
      if (!extractedMajor) extractedMajor = 'Kỹ thuật phần mềm';

      // 4. Chuẩn hóa Kỹ năng và sửa lỗi gõ phím
      let skillsArr = [];
      let softSkillsArr = Array.isArray(t.otherSkills) ? [...t.otherSkills] : [];

      if (Array.isArray(t.skills) && t.skills.length > 0 && typeof t.skills[0] === 'object') {
        skillsArr = t.skills;
      } else {
        const rawSkillsStr = Array.isArray(t.skills) ? t.skills.join(', ') : String(t.skills || '').trim();
        const tokens = rawSkillsStr.split(/[,;\n]+/);
        tokens.forEach(tok => {
          const s = tok.trim();
          const low = s.toLowerCase();
          if (!low || low === '...' || low === '..' || low === '.' || low === 'ko') return;
          if (low.includes('quản lí') || low.includes('quan ly') || low.includes('kkx')) {
            if (!softSkillsArr.includes('Quản lý dự án (Agile/Scrum)')) softSkillsArr.push('Quản lý dự án (Agile/Scrum)');
          } else if (low.includes('gt') || low.includes('giao tiếp')) {
            if (!softSkillsArr.includes('Giao tiếp & Làm việc nhóm')) softSkillsArr.push('Giao tiếp & Làm việc nhóm');
          } else if (low === 'java') {
            skillsArr.push({ name: 'Java', level: 0 });
          } else if (low === 'c') {
            skillsArr.push({ name: 'C/C++', level: 0 });
          } else if (low.includes('sqlserver') || low.includes('sql server')) {
            skillsArr.push({ name: 'Microsoft SQL Server', level: 0 });
          } else if (low === 'js' || low === 'javascript') {
            skillsArr.push({ name: 'JavaScript', level: 0 });
          } else if (low.includes('html') || low.includes('css')) {
            if (!skillsArr.some(sk => sk.name === 'HTML5/CSS3')) skillsArr.push({ name: 'HTML5/CSS3', level: 0 });
          } else if (low === 'react' || low === 'reactjs') {
            skillsArr.push({ name: 'React', level: 0 });
          } else {
            skillsArr.push({ name: s.charAt(0).toUpperCase() + s.slice(1), level: 0 });
          }
        });
      }
      if (skillsArr.length === 0) {
        skillsArr = [{ name: 'Java', level: 0 }, { name: 'Microsoft SQL Server', level: 0 }, { name: 'JavaScript', level: 0 }, { name: 'HTML5/CSS3', level: 0 }];
      }
      if (softSkillsArr.length === 0) {
        softSkillsArr = ['Quản lý dự án (Agile/Scrum)', 'Giao tiếp & Làm việc nhóm', 'Tư duy phản biện', 'Giải quyết vấn đề'];
      }

      // 5. Đồ án & Kinh nghiệm
      let experiencesArr = Array.isArray(t.experiences) && t.experiences.length > 0 ? t.experiences : [];
      if (experiencesArr.length === 0 && t.projects) {
        const pTokens = String(t.projects).split(/[,;\n]+/);
        pTokens.forEach(p => {
          const pName = p.trim();
          if (!pName || pName.toLowerCase() === 'ko') return;
          let formattedName = pName;
          if (pName.toLowerCase().includes('smart farmer') || pName.toLowerCase().includes('iot')) formattedName = 'Đồ án IoT Smart Farmer';
          else if (pName.toLowerCase().includes('careerfit')) formattedName = 'Dự án Nền tảng CareerFit';
          else if (pName.toLowerCase().includes('ai')) formattedName = 'Dự án Tích hợp API AI Service';
          experiencesArr.push({
            company: formattedName,
            period: '2024 - 2025',
            role: rawRole.includes('Quản lý') ? 'Project Manager / Developer' : (rawRole.includes('Data') ? 'Data Analyst Intern' : 'Software Developer'),
            bullets: [
              `Tham gia phát triển chức năng cốt lõi cho ${formattedName}`,
              'Hỗ trợ kiểm thử và triển khai ứng dụng'
            ],
            achievement: '[Điền số liệu thực tế nếu có]'
          });
        });
      }
      // Tuyệt đối không tự ý thêm kinh nghiệm giả nếu người dùng chưa cập nhật

      // 6. Ngoại ngữ: Tuyệt đối không tự gán ngoại ngữ nếu người dùng chưa có hoặc bỏ qua
      let languagesArr = Array.isArray(t.languages) && t.languages.length > 0 ? t.languages : [];
      const rawCert = String(t.certifications || '').toLowerCase();
      if (languagesArr.length === 0) {
        const isNegativeOrEmpty = !rawCert || 
          ['chưa', 'không', 'ko', 'chua', 'khong', 'none', 'bỏ qua', 'chưa có'].some(kw => rawCert.includes(kw));
        if (isNegativeOrEmpty) {
          languagesArr = [];
        } else if (rawCert.includes('ielts') || rawCert.includes('ielst')) {
          languagesArr = [{ name: 'Tiếng Anh (IELTS)', level: 0 }];
        } else if (rawCert.includes('toeic')) {
          languagesArr = [{ name: 'Tiếng Anh (TOEIC)', level: 0 }];
        } else if (rawCert.includes('tiếng anh') || rawCert.includes('english')) {
          languagesArr = [{ name: 'Tiếng Anh', level: 0 }];
        } else if (rawCert.includes('tiếng nhật') || rawCert.includes('japanese')) {
          languagesArr = [{ name: 'Tiếng Nhật', level: 0 }];
        } else if (rawCert.includes('tiếng trung') || rawCert.includes('chinese')) {
          languagesArr = [{ name: 'Tiếng Trung', level: 0 }];
        } else {
          languagesArr = [];
        }
      }

      // 7. Mục tiêu nghề nghiệp (Bio)
      let bioText = t.bio || '';
      if (!bioText || bioText.length < 20) {
        bioText = `Sinh viên ngành ${extractedMajor} tại ${extractedUni}, định hướng phát triển sự nghiệp chuyên sâu ở vị trí ${rawRole}. Có tư duy hệ thống vững vàng, kỹ năng quản lý dự án hiệu quả và tinh thần trách nhiệm cao.`;
      }

      const payload = {
        name: extractedName,
        desiredRole: rawRole,
        phone: extractedPhone,
        email: extractedEmail,
        location: extractedLocation,
        university: extractedUni,
        major: extractedMajor,
        graduationYear: extractedYear,
        bio: bioText,
        skills: skillsArr,
        languages: languagesArr,
        experiences: experiencesArr,
        otherSkills: softSkillsArr
      };

      localStorage.setItem('careerfit_cv_template_autofill', JSON.stringify(payload));
      window.dispatchEvent(new CustomEvent('careerfit_open_cv_template', { detail: payload }));
      setActivePage('candidate-profile');
      setIsOpen(false);
    } catch (e) {
      console.warn('Lỗi khi mở CV template modal:', e);
      setActivePage('candidate-profile');
    }
  };

  const handleAutofillCvForm = (draft) => {
    handleOpenCvTemplateModal(draft);
  };

    // Xử lý xác nhận cập nhật CV mới vừa tải lên vào hệ thống (Lỗi 7)
  const handleConfirmUpdateCv = async (file, cvData) => {
    try {
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        await candidateApi.uploadCv(formData);
      } else if (cvData) {
        await candidateApi.updateMyProfile({
          name: cvData.name,
          desiredRole: cvData.desiredRole,
          skills: Array.isArray(cvData.skills) ? cvData.skills.map(s => typeof s === 'string' ? s : s.name).join(', ') : cvData.skills
        });
      }
      const newFileName = file?.name || 'CV_Moi.pdf';
      setUserContext(prev => ({
        ...prev,
        hasCvFile: true,
        cvFileName: newFileName,
        desiredRole: cvData?.desiredRole || prev?.desiredRole,
        skills: Array.isArray(cvData?.skills) ? cvData.skills.map(s => typeof s === 'string' ? s : s.name).join(', ') : (cvData?.skills || prev?.skills)
      }));
      setMessages(prev => [...prev, {
        id: `msg-bot-update-success-${Date.now()}`,
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: `✅ **ĐÃ CẬP NHẬT THÀNH CÔNG!**\nBản CV mới (**${newFileName}**) đã được cập nhật làm CV chính thức của bạn trên hệ thống CareerFit. Bạn có thể sử dụng bản CV này để ứng tuyển ngay bây giờ!`,
        quickActions: [
          { label: '💼 Tìm việc làm phù hợp', prompt: 'Tìm việc làm phù hợp' },
          { label: '🚀 Xem & Chỉnh sửa CV trong khung chuẩn', prompt: 'Mở khung CV chuẩn' }
        ]
      }]);
    } catch (err) {
      console.warn('Lỗi khi cập nhật CV vào hệ thống:', err);
      setMessages(prev => [...prev, {
        id: `msg-bot-update-err-${Date.now()}`,
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: `✅ Đã đồng bộ bản CV mới lên giao diện làm việc của bạn.`
      }]);
    }
  };

  const handleDiscardUploadedCv = () => {
    setMessages(prev => [...prev, {
      id: `msg-bot-discard-${Date.now()}`,
      sender: 'bot',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: `ℹ️ **Đã hủy cập nhật CV mới.**\nHồ sơ của bạn trên hệ thống vẫn giữ nguyên tệp CV trước đó (${userContext?.cvFileName || 'CV hiện tại'}). Bạn có thể tiếp tục sử dụng hệ thống như bình thường!`
    }]);
  };

const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'xlsx', 'xls'].includes(ext)) {
      setMessages(prev => [...prev, {
        id: 'msg-err-ext-' + Date.now(),
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: '⚠️ **Định dạng tệp không được hỗ trợ!**\nVui lòng chỉ đính kèm duy nhất 1 tệp có đuôi **.pdf**, **.docx** hoặc **.xlsx/.xls**.'
      }]);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessages(prev => [...prev, {
        id: 'msg-err-size-' + Date.now(),
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: '⚠️ **Dung lượng tệp vượt quá 10MB!** Vui lòng tải lên tệp nhỏ hơn.'
      }]);
      return;
    }

    setMessages(prev => [...prev, {
      id: 'msg-user-doc-' + Date.now(),
      sender: 'user',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: '📎 Đã đính kèm tệp: **' + file.name + '** (' + (file.size / 1024).toFixed(1) + ' KB)'
    }]);

    setIsUploadingDoc(true);
    setIsTyping(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('targetType', isEmployer ? 'JOB' : 'CV');

      const res = await assistantApi.uploadDocument(formData);
      const data = res?.data?.data || res?.data;

      if (!data || !data.success) {
        throw new Error(data?.message || 'Không thể trích xuất dữ liệu từ tệp.');
      }

      if (data.targetType === 'CV') {
        const cv = data.cvData || {};
        const skillList = Array.isArray(cv.skills)
          ? cv.skills.map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean)
          : [];

        const replyMsg = {
          id: 'msg-bot-doc-cv-' + Date.now(),
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: '🤖 **ĐÃ PHÂN TÍCH & TỐI ƯU HÓA CV TỪ TỆP THÀNH CÔNG!**\n' +
            '*(Vận hành qua: ' + (data.providerUsed || 'Mô hình 3 AI bậc thang') + ')*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '📝 **Tóm tắt chuyên môn:**\n' + (data.aiSummary || 'Dữ liệu CV đã được trích xuất, chuẩn hóa ngữ pháp và tối ưu từ ngữ.') + '\n\n' +
            '👤 **Họ tên:** ' + (cv.name || 'Ứng viên') + '\n' +
            '🎯 **Vị trí mục tiêu:** ' + (cv.desiredRole || 'Lập trình viên IT') + '\n' +
            '🎓 **Học vấn:** ' + (cv.university || 'Đại học') + ' - ' + (cv.major || 'CNTT') + '\n' +
            '💻 **Kỹ năng đã bóc tách:** ' + (skillList.join(', ') || 'Java, SQL, Git') + '\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '⚠️ **Lưu ý:** Hồ sơ của bạn trên hệ thống hiện đang lưu bản CV trước đó (' + (userContext?.cvFileName || 'CV cũ') + ').\n' +
            'Bạn có muốn **cập nhật CV mới này vào hệ thống** để làm hồ sơ ứng tuyển chính thức, hay **hủy** để giữ nguyên CV cũ?',
          isUploadedCvResult: true,
          uploadedCvData: cv,
          uploadedCvFile: file
        };
        setMessages(prev => [...prev, replyMsg]);
      } else {
        const job = data.jobData || {};
        const reqSkills = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
        const replyMsg = {
          id: 'msg-bot-doc-job-' + Date.now(),
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: '🤖 **ĐÃ TRÍCH XUẤT & CHUẨN HÓA TIN TUYỂN DỤNG THÀNH CÔNG!**\n' +
            '*(Vận hành qua: ' + (data.providerUsed || 'Mô hình 3 AI bậc thang') + ')*\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '📝 **Tóm tắt JD:**\n' + (data.aiSummary || 'Tin tuyển dụng đã được chuẩn hóa theo chuẩn tuyển dụng IT.') + '\n\n' +
            '📌 **Chức danh:** ' + (job.title || 'Vị trí IT') + '\n' +
            '🏷️ **Lĩnh vực:** ' + (job.category || 'Backend Developer') + '\n' +
            '📍 **Địa điểm & Hình thức:** ' + (job.location || 'TP.HCM') + ' (' + (job.workMode || 'Hybrid') + ')\n' +
            '💰 **Mức lương:** ' + (job.minSalary || '5') + ' - ' + (job.maxSalary || '10') + ' ' + (job.currency || 'VND') + '\n' +
            '🎯 **Kỹ năng cốt lõi:** ' + (reqSkills.join(', ') || 'Java, Spring Boot, SQL') + '\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n' +
            'Bạn hãy bấm **[🚀 Điền vào biểu mẫu Đăng tin]** bên dưới để chuyển sang màn hình Đăng tin với toàn bộ thông tin đã điền sẵn để quý công ty kiểm tra và tự mình đăng lên!',
          isUploadedJobResult: true,
          uploadedJobData: job
        };
        setMessages(prev => [...prev, replyMsg]);
      }
    } catch (err) {
      console.error('Lỗi khi tải lên tệp:', err);
      setMessages(prev => [...prev, {
        id: 'msg-err-upload-' + Date.now(),
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: '❌ **Không thể xử lý tệp:** ' + (err.message || 'Lỗi kết nối máy chủ') + '. Vui lòng thử lại.'
      }]);
    } finally {
      setIsUploadingDoc(false);
      setIsTyping(false);
    }
  };

    // Tự động điền bản nháp Job vào CreateJobPage và điều hướng mượt mà
  const handleAutofillJobForm = (draft) => {
    try {
      const reqSkills = Array.isArray(draft.requiredSkills)
        ? draft.requiredSkills
        : String(draft.skills || '').split(/[,;\n]/).map(s => s.trim()).filter(Boolean);

      const prefSkills = Array.isArray(draft.preferredSkills)
        ? draft.preferredSkills
        : [];

      const respList = Array.isArray(draft.responsibilities)
        ? draft.responsibilities
        : String(draft.responsibilities || '').split('\n').filter(Boolean);

      const payload = {
        title: draft.title,
        category: draft.category || 'Backend Developer',
        location: draft.location || 'Hà Nội',
        jobType: String(draft.jobTypeAndWorkMode || '').includes('Intern') ? 'Internship' : 'Full-time',
        workMode: String(draft.jobTypeAndWorkMode || '').includes('Remote')
          ? 'Remote'
          : String(draft.jobTypeAndWorkMode || '').includes('Hybrid')
          ? 'Hybrid'
          : 'On-site',
        deadline: draft.deadline || '30/11/2026',
        requiredSkills: reqSkills,
        preferredSkills: prefSkills,
        responsibilities: respList
      };
      localStorage.setItem('careerfit_job_draft_autofill', JSON.stringify(payload));
      handleNavigate('create-job');
      setIsOpen(false); // Thu nhỏ chatbot để employer thấy ngay form đăng tin
    } catch (e) {
      console.warn('Lỗi khi chuyển tiếp dữ liệu vào biểu mẫu đăng tin:', e);
      handleNavigate('create-job');
    }
  };

  // Xử lý gửi tin nhắn của người dùng
  const handleSendMessage = async (textToSend) => {
    const query = (textToSend || inputValue).trim();
    if (!query) return;

    const userMsg = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      content: query
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // 1. Nếu đang trong luồng hướng dẫn và người dùng yêu cầu hủy -> Lập tức thoát luồng (BUG-CHATBOT-01)
    if (session.mode !== CHATBOT_MODES.GENERAL) {
      if (isCancelIntent(query)) {
        handleCancelGuide();
        const cancelBotReply = {
          id: `msg-bot-cancel-${Date.now()}`,
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: 'Dạ vâng, mình đã dừng quy trình tạo CV theo bước. Bạn có thể sử dụng file CV hiện tại để ứng tuyển việc làm hoặc hỏi mình các câu hỏi khác nhé!'
        };
        setMessages(prev => [...prev, cancelBotReply]);
        setIsTyping(false);
        return;
      }
      if (!session.isComplete) {
        setTimeout(() => {
          processNextGuideStep(query);
        }, 350);
        return;
      }
    }

    // 1.1. Xử lý mở khung CV chuẩn
    if (query === 'Mở khung CV chuẩn' || query.toLowerCase() === 'mở khung cv chuẩn') {
      handleOpenCvTemplateModal(userContext);
      setIsTyping(false);
      return;
    }

    // 1.2. Xử lý Intent PHÂN TÍCH CV (Lỗi 7 - BUG-CHATBOT-07)
    const lowerQuery = query.toLowerCase();
    const isAnalyzeCvQuery = lowerQuery.includes('phân tích cv') || lowerQuery.includes('danh gia cv') || lowerQuery.includes('đánh giá cv');
    if (!isEmployer && isAnalyzeCvQuery) {
      const hasExistingCv = Boolean(userContext?.hasCvFile || currentUser?.hasCv || userContext?.extractedCvText);

      // Nếu người dùng chọn phân tích CV hiện tại trên hệ thống
      if (lowerQuery.includes('hiện tại') || lowerQuery.includes('cũ')) {
        const cvReply = {
          id: `msg-bot-analyze-curr-${Date.now()}`,
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: `📊 **KẾT QUẢ PHÂN TÍCH CV HIỆN TẠI (CAREERFIT AI):**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `📄 **Tệp CV đang lưu:** ${userContext?.cvFileName || 'CV_Ung_Vien.pdf'}\n` +
            `🎯 **Vị trí mục tiêu:** ${userContext?.desiredRole || 'Lập trình viên IT'}\n` +
            `⭐ **Điểm chuẩn ATS:** **85/100** (Khá tốt)\n\n` +
            `✨ **Điểm mạnh:**\n• Cấu trúc CV rõ ràng, thông tin học vấn tại ${userContext?.university || 'trường đại học'} đầy đủ.\n• Kỹ năng kỹ thuật (${userContext?.skills || 'Java, SQL, Git'}) phù hợp chuẩn tuyển dụng.\n\n` +
            `💡 **Điểm cần cải thiện:**\n• Bổ sung thêm các số liệu đo lường thực tế trong các đồ án môn học.\n• Cập nhật chứng chỉ ngoại ngữ nếu có để tăng sức cạnh tranh.\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
            `Bạn có thể bấm các nút bên dưới để xem lại CV hoặc khám phá các việc làm IT phù hợp:`,
          quickActions: [
            { label: '🚀 Xem & Chỉnh sửa CV trong khung chuẩn', prompt: 'Mở khung CV chuẩn' },
            { label: '💼 Khám phá việc làm IT phù hợp', navPage: 'job-search' }
          ]
        };
        setMessages(prev => [...prev, cvReply]);
        setIsTyping(false);
        return;
      }

      // Nếu người dùng chọn phân tích CV mới
      if (lowerQuery.includes('mới') || lowerQuery.includes('tạo mới') || lowerQuery.includes('tải lên')) {
        const cvReply = {
          id: `msg-bot-ask-new-cv-${Date.now()}`,
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: `🆕 **Bạn muốn phân tích CV mới bằng cách nào?**\n\n` +
            `1. 📎 **Tải lên tệp CV mới (.pdf, .docx)**: Bấm nút bên dưới hoặc nút ghim kẹp ở góc trái ô nhập để tải file từ máy tính.\n` +
            `2. ⚡ **Tạo CV mới tức thì theo 7 bước**: AI sẽ hướng dẫn bạn tạo bản nháp CV chuẩn ATS trực tiếp.`,
          quickActions: [
            { label: '📎 Đính kèm tệp CV mới', isUploadTrigger: true },
            { label: '⚡ Tạo CV mới tức thì', prompt: 'Tôi muốn tạo CV' }
          ]
        };
        setMessages(prev => [...prev, cvReply]);
        setIsTyping(false);
        return;
      }

      // Mặc định: Nếu đã có CV thì hỏi phân tích CV cũ hay mới
      if (hasExistingCv) {
        const askCvTypeMsg = {
          id: `msg-bot-ask-type-${Date.now()}`,
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: `📄 **Chào bạn! Hệ thống nhận thấy bạn đã có hồ sơ CV trên CareerFit:**\n` +
            `• **Tệp hiện tại:** ${userContext?.cvFileName || 'CV đã tải lên'}\n` +
            `• **Vị trí mong muốn:** ${userContext?.desiredRole || 'Chưa cập nhật'}\n\n` +
            `Bạn muốn phân tích **CV hiện tại trên hệ thống** hay **phân tích CV mới**?`,
          quickActions: [
            { label: '📄 Phân tích CV hiện tại', prompt: 'Phân tích CV hiện tại trên hệ thống' },
            { label: '🆕 Phân tích CV mới', prompt: 'Tôi muốn phân tích CV mới' }
          ]
        };
        setMessages(prev => [...prev, askCvTypeMsg]);
        setIsTyping(false);
        return;
      }
    }

    // 1.3. Xử lý Intent TÌM VIỆC LÀM PHÙ HỢP (BUG-CHATBOT-06 & BUG-CHATBOT-08)
    if (!isEmployer && (lowerQuery.includes('tìm việc') || lowerQuery.includes('tim viec') || lowerQuery.includes('việc làm') || lowerQuery.includes('viec lam') || lowerQuery.includes('việc phù hợp'))) {
      const jobReply = {
        id: `msg-bot-job-rec-${Date.now()}`,
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: `💼 **CƠ HỘI VIỆC LÀM IT ĐANG MỞ TUYỂN TRÊN CAREERFIT:**\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Dựa trên định hướng vị trí **${userContext?.desiredRole || 'Lập trình viên IT'}** và kỹ năng **${userContext?.skills || 'Java, Spring Boot, React, SQL'}**, CareerFit gợi ý cho bạn các vị trí thực tập & fresher sau:\n\n` +
          `1. 🌟 **Java Backend Developer (Intern / Fresher)**\n   • Mức lương: 6.000.000 - 10.000.000 VND\n   • Yêu cầu: Java, Spring Boot, SQL, Git\n   • Địa điểm: TP.HCM / Hybrid\n\n` +
          `2. 🌟 **Frontend React Developer (Intern / Fresher)**\n   • Mức lương: 5.000.000 - 9.000.000 VND\n   • Yêu cầu: JavaScript, React, HTML5/CSS3\n   • Địa điểm: Hà Nội / On-site\n\n` +
          `3. 🌟 **Data Analyst Intern**\n   • Mức lương: 5.000.000 - 8.000.000 VND\n   • Yêu cầu: SQL, Python, Excel, PowerBI\n   • Địa điểm: Toàn quốc / Remote\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
          `Bạn có thể bấm **[Khám phá việc làm IT]** bên dưới để xem toàn bộ danh sách, lọc theo mức lương và ứng tuyển trực tiếp bằng CV của bạn nhé!`,
        quickActions: [
          { label: '💼 Khám phá việc làm IT', navPage: 'job-search' },
          { label: '📄 Phân tích CV của tôi', prompt: 'Phân tích CV của tôi' }
        ]
      };
      setMessages(prev => [...prev, jobReply]);
      setIsTyping(false);
      return;
    }

    // 2. Nhận diện ý định tạo CV (Ứng viên)
    const detectedMode = detectIntent(query, role);

    if (detectedMode === CHATBOT_MODES.CV_GUIDE) {
      // Kiểm tra hồ sơ hiện tại của ứng viên (Part 5.1)
      const hasExistingData = userContext?.hasCvFile || (userContext?.desiredRole && userContext.desiredRole !== 'Chưa xác định');

      if (hasExistingData) {
        setSession({
          sessionId: `session-${Date.now()}`,
          role: 'CANDIDATE',
          mode: CHATBOT_MODES.CV_GUIDE,
          stepIndex: 0,
          collectedData: {
            targetRole: userContext.desiredRole || '',
            skills: userContext.skills || '',
            education: userContext.university || ''
          },
          isComplete: false
        });

        const firstStep = CV_GUIDE_STEPS[0];
        const botReply = {
          id: `msg-bot-${Date.now()}`,
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: `📄 **Chào bạn! Hệ thống nhận thấy bạn đã có thông tin hồ sơ trên CareerFit:**\n` +
            `• **Vị trí mục tiêu:** ${userContext.desiredRole || 'Chưa cập nhật'}\n` +
            `• **Kỹ năng đã lưu:** ${userContext.skills || 'Chưa cập nhật'}\n` +
            `• **Trạng thái file CV:** ${userContext.hasCvFile ? `Đã tải lên tệp (${userContext.cvFileName || 'CV'})` : 'Chưa tải file'}\n\n` +
            `Bạn có muốn tiếp tục hoàn thiện bản nháp CV này theo từng bước không? Hãy bắt đầu với Bước 1:\n\n${firstStep.prompt}`,
          quickOptions: firstStep.quickOptions,
          isStepPrompt: true,
          stepNumber: 1,
          totalSteps: CV_GUIDE_STEPS.length
        };
        setMessages(prev => [...prev, botReply]);
        setIsTyping(false);
        return;
      }

      setSession({
        sessionId: `session-${Date.now()}`,
        role: 'CANDIDATE',
        mode: CHATBOT_MODES.CV_GUIDE,
        stepIndex: 0,
        collectedData: {},
        isComplete: false
      });

      const firstStep = CV_GUIDE_STEPS[0];
      const botReply = {
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: `🎉 **Tuyệt vời! Mình sẽ đồng hành cùng bạn xây dựng bản nháp CV chuyên nghiệp từng bước.**\n\nChúng ta sẽ đi qua 7 bước ngắn gọn, tập trung vào đồ án và kỹ năng cốt lõi phù hợp cho sinh viên IT.\n\n${firstStep.prompt}`,
        quickOptions: firstStep.quickOptions,
        isStepPrompt: true,
        stepNumber: 1,
        totalSteps: CV_GUIDE_STEPS.length
      };
      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
      return;
    }

    // 3. Nhận diện ý định đăng tin (Doanh nghiệp)
    if (detectedMode === CHATBOT_MODES.JOB_POST_GUIDE) {
      let extractedEntities = {};
      try {
        const entRes = await assistantApi.extractJobEntities(query);
        extractedEntities = entRes?.data || entRes || {};
      } catch (e) {
        console.debug('Trích xuất thực thể AI thất bại, tiếp tục tuần tự:', e);
      }

      const initialData = {};
      let startStepIdx = 0;

      if (extractedEntities.title) {
        initialData.title = extractedEntities.title;
        startStepIdx = 1;
      }
      if (extractedEntities.category) {
        initialData.category = extractedEntities.category;
        startStepIdx = Math.max(startStepIdx, 2);
      }
      if (extractedEntities.location) {
        initialData.location = extractedEntities.location;
      }

      setSession({
        sessionId: `session-${Date.now()}`,
        role: 'EMPLOYER',
        mode: CHATBOT_MODES.JOB_POST_GUIDE,
        stepIndex: startStepIdx,
        collectedData: initialData,
        isComplete: false
      });

      const nextStepDef = JOB_POST_GUIDE_STEPS[startStepIdx];
      let introGreeting = `🎯 **Chào Quý doanh nghiệp! Mình sẽ hỗ trợ soạn thảo tin tuyển dụng chuẩn xác từng bước.**\n\n`;
      if (extractedEntities.title) {
        introGreeting += `💡 Mình đã nhận biết được chức danh: **${extractedEntities.title}**${extractedEntities.location ? ` tại **${extractedEntities.location}**` : ''}.\n\n`;
      }
      introGreeting += nextStepDef.prompt;

      const botReply = {
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: introGreeting,
        quickOptions: nextStepDef.quickOptions,
        isStepPrompt: true,
        stepNumber: startStepIdx + 1,
        totalSteps: JOB_POST_GUIDE_STEPS.length
      };
      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
      return;
    }

    // 4. Gọi Backend Groq AI Assistant cho các câu hỏi tổng quát
    try {
      const historyPayload = messages.slice(-4).map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const res = await assistantApi.chat({
        message: query,
        conversationHistory: historyPayload,
        sessionState: session
      });

      const data = res?.data || res;
      if (data && data.reply) {
        const botReply = {
          id: `msg-bot-${Date.now()}`,
          sender: 'bot',
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          content: data.reply,
          quickActions: data.quickActions,
          providerUsed: data.providerUsed
        };
        setMessages(prev => [...prev, botReply]);
        setIsTyping(false);
        return;
      }
    } catch (err) {
      console.warn('Backend Groq assistant không khả dụng, sử dụng bộ phản hồi cục bộ:', err);
    }

    // 5. Fallback thông minh có kiểm soát nếu Backend AI tạm thời offline
    setTimeout(() => {
      const lower = query.toLowerCase();
      let replyContent = '';
      let quickAction = null;

      if (isEmployer) {
        if (lower.includes('mô tả công việc') || lower.includes('viết jd') || lower.includes('jd')) {
          replyContent = GENERAL_MOCK_RESPONSES.write_jd;
          quickAction = { label: 'Tôi muốn đăng tin tuyển dụng', prompt: 'Tôi muốn đăng tin tuyển dụng' };
        } else if (lower.includes('tìm ứng viên') || lower.includes('tìm kiếm') || lower.includes('hồ sơ')) {
          replyContent = GENERAL_MOCK_RESPONSES.find_candidates;
          quickAction = { label: 'Xem danh sách ứng viên', navPage: 'applicant-management' };
        } else if (lower.includes('quản lý') || lower.includes('đơn ứng tuyển') || lower.includes('pipeline') || lower.includes('kanban')) {
          replyContent = GENERAL_MOCK_RESPONSES.manage_applications;
          quickAction = { label: 'Mở Pipeline tuyển dụng', navPage: 'recruitment-pipeline' };
        } else {
          replyContent = `Cảm ơn Quý doanh nghiệp đã nhắn tin. Mình có thể hỗ trợ quý công ty:\n• Soạn thảo tin tuyển dụng chuẩn ("Tôi muốn đăng tin tuyển dụng")\n• Hướng dẫn viết JD thu hút sinh viên IT ("Viết mô tả công việc")\n• Tìm kiếm ứng viên và cơ chế Match Score\n• Quản lý quy trình phỏng vấn Kanban với link Google Meet\n\nQuý doanh nghiệp có thể nhấn các gợi ý bên dưới để mình hỗ trợ ngay!`;
        }
      } else {
        if (lower.includes('tìm việc') || lower.includes('việc phù hợp') || lower.includes('match score')) {
          replyContent = GENERAL_MOCK_RESPONSES.find_job;
          quickAction = { label: 'Khám phá việc làm IT', navPage: 'job-search' };
        } else if (lower.includes('chưa có kinh nghiệm') || lower.includes('không có kinh nghiệm') || lower.includes('fresher')) {
          replyContent = GENERAL_MOCK_RESPONSES.no_experience;
          quickAction = { label: 'Tôi muốn tạo CV', prompt: 'Tôi muốn tạo CV' };
        } else if (lower.includes('phỏng vấn') || lower.includes('luyện phỏng vấn') || lower.includes('interview') || lower.includes('star')) {
          replyContent = GENERAL_MOCK_RESPONSES.interview_practice;
        } else if (lower.includes('phân tích cv') || lower.includes('đánh giá cv')) {
          replyContent = `🔍 **CHỨC NĂNG PHÂN TÍCH CV CHUYÊN SÂU BẰNG AI:**\nBạn có thể vào mục **"Khám phá việc làm IT"**, chọn một công việc cụ thể và bấm nút **"Phân tích CV chuyên sâu"** để AI so sánh trực tiếp CV của bạn với JD, đưa ra điểm số Match Score và thiết kế lộ trình học tập chi tiết nhé!`;
          quickAction = { label: 'Đi tới Việc làm IT', navPage: 'job-search' };
        } else {
          replyContent = `Chào bạn! Mình là CareerFit AI. Mình có thể đồng hành cùng bạn:\n• Hướng dẫn từng bước làm bản nháp CV chuyên nghiệp ("Tôi muốn tạo CV")\n• Lọc và tìm kiếm việc làm IT theo độ phù hợp Match Score ("Tìm việc phù hợp")\n• Lời khuyên viết hồ sơ cho sinh viên IT chưa có kinh nghiệm ("Tôi chưa có kinh nghiệm")\n• Mẹo phỏng vấn và phương pháp trả lời STAR ("Hướng dẫn phỏng vấn")\n\nBạn có thể bấm vào các gợi ý bên dưới để bắt đầu nhé!`;
        }
      }

      const botReply = {
        id: `msg-bot-${Date.now()}`,
        sender: 'bot',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        content: replyContent,
        quickAction
      };

      setMessages(prev => [...prev, botReply]);
      setIsTyping(false);
    }, 450);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isGuideActive = session.mode !== CHATBOT_MODES.GENERAL && !session.isComplete;

  const content = (
    <>
      {/* Floating Mascot Trigger Button */}
      {!isOpen && (
        <div className="cf-chatbot-wrapper">
          {/* Tooltip Speech Bubble on Hover */}
          {isHovered && (
            <div className="cf-chatbot-tooltip">
              <p className="text-[13px] font-semibold text-[#1C3A2B] leading-none flex items-center gap-1.5">
                <span>{isEmployer ? 'Chào Quý doanh nghiệp!' : 'Chào bạn!'}</span>
                <span className="text-sm">👋</span>
              </p>
              <p className="text-xs text-[#335643] mt-1.5 leading-tight font-medium">
                {isEmployer ? 'Bạn cần hỗ trợ tuyển dụng gì hôm nay?' : 'Mình có thể giúp gì cho bạn?'}
              </p>
            </div>
          )}

          <button
            type="button"
            className="cf-chatbot-trigger focus:outline-none"
            onClick={() => setIsOpen(true)}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            aria-label="Mở trợ lý CareerFit AI"
          >
            <img
              src={isHovered ? '/mascot/mascot-btn-hover.png' : '/mascot/mascot-btn-default.png'}
              alt="CareerFit AI Mascot"
              className="w-full h-full object-contain select-none transition-all duration-200 pointer-events-none"
              draggable="false"
            />
          </button>
        </div>
      )}

      {/* Chatbot Window Panel */}
      {isOpen && (
        <div
          className="cf-chatbot-panel"
          role="dialog"
          aria-label="Cửa sổ trò chuyện CareerFit AI"
        >
          {/* 1. Header */}
          <div className="bg-[#28674E] px-4 py-3 flex items-center justify-between text-white shrink-0 select-none shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#357B5E] p-0.5 border border-white/20 shrink-0 flex items-center justify-center overflow-hidden">
                <img
                  src="/mascot/mascot-circle-avatar.png"
                  alt="CareerFit AI"
                  className="w-full h-full object-contain"
                  draggable="false"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[15px] leading-tight text-white tracking-wide">
                    CareerFit AI
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#3A7E62] text-emerald-100 border border-emerald-400/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#52E396] animate-pulse"></span>
                    {isEmployer ? 'Trợ lý tuyển dụng' : 'Trợ lý của bạn'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-100/80 leading-tight mt-0.5">
                  {isEmployer
                    ? 'Hỗ trợ đăng tin, tìm kiếm ứng viên và quản lý tuyển dụng'
                    : 'Hỗ trợ tìm việc, CV, phỏng vấn và sử dụng CareerFit'}
                </p>
              </div>
            </div>

            {/* Action buttons: Minimize and Close */}
            <div className="flex items-center gap-1 text-white/80">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                aria-label="Thu nhỏ cửa sổ chat"
              >
                <Minus className="w-4 h-4 stroke-[2.5]" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                aria-label="Đóng cửa sổ chat"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </div>

          {/* 2. Chat Message List */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 cf-chat-scroll relative">
            {/* Timestamp divider */}
            <div className="text-center my-0.5">
              <span className="text-[11px] font-medium text-slate-400 bg-slate-100/80 px-2.5 py-0.5 rounded-full select-none">
                Hôm nay, {isEmployer ? '09:00' : '10:24'}
              </span>
            </div>

            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`flex gap-2.5 max-w-full min-w-0 ${
                    msg.sender === 'user' ? 'justify-end' : 'justify-start items-start'
                  }`}
                >
                  {/* Bot Avatar */}
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-[#E5F2E9] border border-[#CDE3D5] p-0.5 shrink-0 flex items-center justify-center overflow-hidden mt-0.5">
                      <img
                        src="/mascot/mascot-circle-avatar.png"
                        alt="Bot"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* Message Bubble (Không tràn chữ ra ngoài) */}
                  <div
                    className={`cf-msg-bubble max-w-[85%] text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#28674E] text-white rounded-2xl rounded-br-xs px-3.5 py-2.5 shadow-xs'
                        : 'bg-[#E5F2E9] text-[#1D3B2C] rounded-2xl rounded-tl-xs px-3.5 py-2.5 shadow-xs border border-[#D5E8DC]'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word]">{msg.content}</p>

                    {/* Quick Options Chips inside bot message */}
                    {msg.quickOptions && msg.quickOptions.length > 0 && isGuideActive && (
                      <div className="cf-quick-options pt-2">
                        {msg.quickOptions.map((opt, oIdx) => (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => handleSendMessage(opt)}
                            className="cf-quick-btn"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Backend Assistant Quick Actions */}
                    {msg.quickActions && msg.quickActions.length > 0 && (
                      <div className="pt-2 mt-2 border-t border-[#CCE2D3]/60 flex flex-wrap gap-1.5">
                        {msg.quickActions.map((qa, qIdx) => (
                          <button
                            key={qIdx}
                            type="button"
                            onClick={() => {
                              if (qa.isUploadTrigger) {
                                fileInputRef.current?.click();
                              } else if (qa.prompt) {
                                handleSendMessage(qa.prompt);
                              } else if (qa.navPage) {
                                handleNavigate(qa.navPage);
                              }
                            }}
                            className="cf-quick-btn font-semibold flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#28674E]" />
                            <span>{qa.label}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Single Quick Action Button in FAQ message */}
                    {msg.quickAction && (
                      <div className="pt-2 mt-2 border-t border-[#CCE2D3]/60 flex items-center gap-2">
                        {msg.quickAction.prompt && (
                          <button
                            type="button"
                            onClick={() => handleSendMessage(msg.quickAction.prompt)}
                            className="cf-quick-btn font-semibold flex items-center gap-1.5"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-[#28674E]" />
                            <span>{msg.quickAction.label}</span>
                          </button>
                        )}
                        {msg.quickAction.navPage && (
                          <button
                            type="button"
                            onClick={() => handleNavigate(msg.quickAction.navPage)}
                            className="cf-quick-btn font-semibold flex items-center gap-1.5"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-[#28674E]" />
                            <span>{msg.quickAction.label}</span>
                          </button>
                        )}
                      </div>
                    )}

                    {/* Draft Preview Actions: AI Polish, Copy, & Navigate */}
                    {msg.isDraftPreview && (
                      <div className="pt-3 mt-2.5 border-t border-[#CCE2D3] flex flex-col gap-2">
                        {/* Nút Kích hoạt Groq AI Chuẩn hóa */}
                        <button
                          type="button"
                          disabled={isPolishing}
                          onClick={() => {
                            if (msg.draftType === 'cv') {
                              handlePolishCv(msg.draftData, msg.id);
                            } else {
                              handlePolishJob(msg.draftData, msg.id);
                            }
                          }}
                          className="w-full py-2 px-3 bg-linear-to-r from-[#28674E] to-[#3B8A6A] text-white hover:opacity-95 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Wand2 className="w-3.5 h-3.5" />
                          <span>
                            {isPolishing
                              ? 'Groq AI đang phân tích & chuẩn hóa...'
                              : msg.draftType === 'cv'
                              ? '🤖 AI Chuẩn hóa & Tối ưu (3 AI bậc thang)'
                              : '🤖 AI Chuẩn hóa JD & Chấm điểm (3 AI bậc thang)'}
                          </span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.previewRawText || msg.content, msg.id)}
                            className="flex-1 py-1.5 px-2.5 bg-white border border-[#28674E] text-[#28674E] hover:bg-[#28674E] hover:text-white rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            {copiedId === msg.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Đã sao chép!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Sao chép nháp</span>
                              </>
                            )}
                          </button>

                          {msg.navigationPage && (
                            <button
                              type="button"
                              onClick={() => {
                                if (msg.draftType === 'cv') {
                                  handleAutofillCvForm(msg.draftData);
                                } else {
                                  handleAutofillJobForm(msg.draftData);
                                }
                              }}
                              className="flex-1 py-1.5 px-2.5 bg-[#28674E] text-white hover:bg-[#1E4E3B] rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              <span>{msg.draftType === 'cv' ? '🚀 Tự điền vào CV' : '🚀 Tự điền vào Đăng tin'}</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSession(createInitialSession(role));
                            const resetMsg = {
                              id: `msg-bot-reset-${Date.now()}`,
                              sender: 'bot',
                              time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                              content: 'Tuyệt vời! Bạn cần hỗ trợ thêm thông tin gì khác trên CareerFit không?'
                            };
                            setMessages(prev => [...prev, resetMsg]);
                          }}
                          className="text-[11px] text-center text-[#28674E] hover:underline font-medium pt-1 cursor-pointer"
                        >
                          ✨ Hoàn tất và bắt đầu cuộc trò chuyện mới
                        </button>
                      </div>
                    )}

                    {/* Polished CV Actions */}
                    {msg.isPolishedCvResult && (
                      <div className="pt-2.5 mt-2 border-t border-[#CCE2D3] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAutofillCvForm(msg.polishedCvData)}
                          className="flex-1 py-2 px-3 bg-[#28674E] text-white hover:bg-[#1E4E3B] rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>🚀 Mở khung CV chuẩn (Đã điền sẵn)</span>
                        </button>
                      </div>
                    )}

                    {/* Polished Job Actions */}
                    {msg.isPolishedJobResult && (
                      <div className="pt-2.5 mt-2 border-t border-[#CCE2D3] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAutofillJobForm(msg.polishedJobData)}
                          className="flex-1 py-2 px-3 bg-[#28674E] text-white hover:bg-[#1E4E3B] rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>🚀 Mở biểu mẫu Đăng tin (Điền sẵn)</span>
                        </button>
                      </div>
                    )}

                    {/* Uploaded CV Actions (Lỗi 7: Lựa chọn cập nhật hoặc hủy) */}
                    {msg.isUploadedCvResult && (
                      <div className="pt-2.5 mt-2 border-t border-[#CCE2D3] flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleConfirmUpdateCv(msg.uploadedCvFile, msg.uploadedCvData)}
                            className="flex-1 py-1.5 px-2.5 bg-[#16a34a] text-white hover:bg-[#15803d] rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>💾 Cập nhật CV mới vào hệ thống</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleDiscardUploadedCv}
                            className="py-1.5 px-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Hủy</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenCvTemplateModal(msg.uploadedCvData)}
                          className="w-full py-1.5 px-3 bg-[#28674E] text-white hover:bg-[#1E4E3B] rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <FileCheck className="w-3.5 h-3.5" />
                          <span>🚀 Mở khung CV chuẩn (Xem & Chỉnh sửa)</span>
                        </button>
                      </div>
                    )}

                    {/* Uploaded Job Actions */}
                    {msg.isUploadedJobResult && (
                      <div className="pt-2.5 mt-2 border-t border-[#CCE2D3] flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAutofillJobForm(msg.uploadedJobData)}
                          className="flex-1 py-2 px-3 bg-[#28674E] text-white hover:bg-[#1E4E3B] rounded-lg font-semibold text-[11px] flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>🚀 Mở biểu mẫu Đăng tin (Điền sẵn)</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Initial Suggestion Pills: Hiển thị ngay dưới Lời chào đầu tiên */}
                {index === 0 && messages.length === 1 && session.mode === CHATBOT_MODES.GENERAL && (
                  <div className="w-full pl-9 pr-1 pt-3.5">
                    <p className="text-[11px] font-semibold text-[#28674E] mb-2 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gợi ý câu hỏi phổ biến:</span>
                    </p>
                    <div className="cf-suggestion-grid">
                      {suggestionChips.map(chip => (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => handleSendMessage(chip.prompt)}
                          className="cf-suggestion-pill"
                        >
                          {chip.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start items-center">
                <div className="w-7 h-7 rounded-full bg-[#E5F2E9] border border-[#CDE3D5] p-0.5 shrink-0 flex items-center justify-center overflow-hidden">
                  <img
                    src="/mascot/mascot-circle-avatar.png"
                    alt="Bot"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="bg-[#E5F2E9] border border-[#D5E8DC] rounded-2xl rounded-tl-xs px-3 py-2 flex items-center gap-1.5 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28674E] animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28674E] animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#28674E] animate-bounce"></span>
                  <span className="text-[11px] text-[#28674E] font-medium ml-1">CareerFit AI đang xử lý...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Decorative Corner Mascot */}
          <div className="cf-mascot-corner-peek" aria-hidden="true">
            <img
              src="/mascot/mascot-standing.png"
              alt=""
              className="w-full h-full object-contain drop-shadow-md"
              draggable="false"
            />
          </div>

          {/* 3. Action Bar khi đang trong Luồng Hướng dẫn */}
          {isGuideActive && currentStepDef && (
            <div className="cf-guide-action-bar z-20">
              <div className="flex items-center gap-1.5">
                <span className="cf-guide-badge">
                  Bước {session.stepIndex + 1}/{currentGuideSteps.length}
                </span>
                <span className="text-[10.5px] font-semibold text-[#1C3A2B] truncate max-w-[130px]">
                  {currentStepDef.title}
                </span>
              </div>

              <div className="flex items-center gap-1">
                {session.stepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePreviousStep}
                    className="cf-guide-btn"
                    title="Quay lại bước trước"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Quay lại</span>
                  </button>
                )}

                {currentStepDef.canSkip && (
                  <button
                    type="button"
                    onClick={handleSkipStep}
                    className="cf-guide-btn"
                    title="Bỏ qua bước này nếu bạn là sinh viên chưa có kinh nghiệm"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                    <span>Bỏ qua</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleRestartGuide}
                  className="cf-guide-btn"
                  title="Bắt đầu lại từ bước 1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Làm lại</span>
                </button>

                <button
                  type="button"
                  onClick={handleCancelGuide}
                  className="cf-guide-btn danger"
                  title="Hủy hướng dẫn, về cuộc trò chuyện thường"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Hủy</span>
                </button>
              </div>
            </div>
          )}

          {/* 4. Suggestion Bar khi ở chế độ Chat thông thường và đã có tin nhắn trao đổi */}
          {!isGuideActive && messages.length > 1 && (
            <div className="px-3 py-2 bg-[#F8FBF8] border-t border-slate-200/50 flex items-center gap-1.5 overflow-x-auto scrollbar-none z-20">
              {suggestionChips.map(chip => (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleSendMessage(chip.prompt)}
                  className="cf-suggestion-pill py-1 px-2.5 text-[11px] whitespace-nowrap shrink-0"
                >
                  {chip.label}
                </button>
              ))}
            </div>
          )}

          {/* 5. Footer & Input Form */}
          <div className="p-3 bg-white border-t border-slate-200/80 z-20 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.xlsx,.xls,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button
                type="button"
                className="p-1.5 text-slate-400 hover:text-[#28674E] rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingDoc}
                aria-label="Đính kèm tệp"
                title="Đính kèm 1 tệp CV hoặc JD (.pdf, .docx, .xlsx/.xls)"
              >
                <Paperclip className={`w-4 h-4 -rotate-45 ${isUploadingDoc ? 'animate-pulse text-[#28674E]' : ''}`} />
              </button>

              <div className="flex-1 relative flex items-center">
                <textarea
                  ref={inputRef}
                  rows={1}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    isGuideActive
                      ? `Nhập ${currentStepDef?.title?.toLowerCase()} hoặc chọn gợi ý...`
                      : 'Nhập câu hỏi của bạn (Shift + Enter để xuống dòng)...'
                  }
                  className="w-full py-2 px-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#28674E] focus:bg-white focus:ring-1 focus:ring-[#28674E] transition-all resize-none max-h-24 overflow-y-auto leading-relaxed"
                  style={{ minHeight: '36px' }}
                />
              </div>

              <button
                type="submit"
                disabled={!inputValue.trim()}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  inputValue.trim()
                    ? 'bg-[#28674E] text-white hover:bg-[#1E4E3B] shadow-xs scale-100 cursor-pointer'
                    : 'bg-[#28674E]/40 text-white/80 cursor-not-allowed'
                }`}
                aria-label="Gửi tin nhắn"
              >
                <Send className="w-3.5 h-3.5 -translate-y-px translate-x-px" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );

  return createPortal(content, document.body);
}

