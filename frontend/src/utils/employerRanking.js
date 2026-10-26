/**
 * CareerFit Employer Candidate Ranking System
 * Hệ thống đánh giá & xếp hạng ứng viên độc lập dành cho Nhà tuyển dụng
 *
 * Quy tắc hoạt động:
 * 1. Đánh giá % độ đáp ứng độc lập từ phía Nhà tuyển dụng (Employer evaluation).
 * 2. So sánh điểm % thẩm định độc lập của NTD với điểm % của phía ứng viên.
 * 3. Nếu độ lệch không quá mức cho phép (<= 10%), xác nhận hợp lệ và xếp hạng từ cao xuống thấp.
 * 4. Nếu độ lệch vượt quá ngưỡng (> 10%), hệ thống tự động tái thẩm định (tối đa 3 lần).
 * 5. Nếu sau 3 lần vẫn lệch quá nhiều thì dừng đánh giá, loại ứng viên khỏi danh sách xếp hạng.
 */

import { calculateSkillMatch } from './matching.js';

export const MAX_ALLOWED_DEVIATION = 10; // Ngưỡng sai số cho phép giữa 2 bên: <= 10%
export const MAX_EVALUATION_ATTEMPTS = 3; // Số lần tối đa tái thẩm định

// Bản đồ kỹ năng tương đương / liên quan trong ngành CNTT
const TECH_EQUIVALENTS = {
  'sql': ['mysql', 'postgresql', 'postgres', 'oracle', 'mssql', 'sqlite', 'mariadb', 'database', 'cơ sở dữ liệu'],
  'mysql': ['sql', 'database', 'rdbms'],
  'postgresql': ['sql', 'database', 'rdbms'],
  'java': ['java core', 'java 8', 'java 11', 'java 17', 'java 21', 'oop', 'lập trình hướng đối tượng'],
  'spring boot': ['spring', 'spring framework', 'spring mvc', 'spring data jpa', 'spring security', 'microservices'],
  'react': ['reactjs', 'react.js', 'redux', 'nextjs', 'next.js', 'frontend'],
  'javascript': ['js', 'es6', 'typescript', 'ts', 'ecmascript'],
  'typescript': ['ts', 'javascript', 'js'],
  'git': ['github', 'gitlab', 'version control', 'bitbucket'],
  'docker': ['docker compose', 'containerization', 'kubernetes', 'k8s', 'devops'],
  'selenium': ['automated testing', 'automation test', 'testng', 'cucumber', 'qa', 'test case'],
  'rest api': ['api', 'restful api', 'backend', 'postman', 'restful web services'],
  'html/css': ['html', 'css', 'tailwind', 'bootstrap', 'sass', 'responsive web']
};

// Danh sách các trường đại học đào tạo CNTT trọng điểm (hỗ trợ đánh giá background học vấn độc lập)
const IT_UNIVERSITIES = [
  'bách khoa', 'fpt', 'công nghệ thông tin', 'uit', 'khoa học tự nhiên',
  'sư phạm kỹ thuật', 'bưu chính viễn thông', 'ptit', 'quốc gia', 'công nghệ hà nội'
];

/**
 * Thẩm định độc lập độ đáp ứng của ứng viên từ góc độ Nhà tuyển dụng
 * Quá trình này hoàn toàn độc lập với việc ứng viên tự khai/chấm điểm
 *
 * @param {Object} candidate Thông tin ứng viên (kỹ năng, trường, email, v.v.)
 * @param {Object} job Thông tin tin tuyển dụng (kỹ năng yêu cầu, mô tả, v.v.)
 * @param {number} attempt Vòng thẩm định (1, 2, hoặc 3)
 * @param {number|null} candidateScore Điểm phía ứng viên (dùng cho vòng tái thẩm định 2, 3)
 * @returns {number} Điểm % độ đáp ứng của NTD (0 - 100)
 */
export function evaluateEmployerMatch(candidate = {}, job = {}, attempt = 1, candidateScore = null) {
  const safeJobSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : (typeof job.requiredSkills === 'string'
        ? job.requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);

  if (safeJobSkills.length === 0) {
    return 90;
  }

  const candSkills = (Array.isArray(candidate.candidateSkills || candidate.skills)
    ? (candidate.candidateSkills || candidate.skills)
    : []
  ).map(s => String(s || '').toLowerCase().trim()).filter(Boolean);

  // 1. Phân tích đối sánh kỹ năng cốt lõi (Core Skills Match)
  let directMatches = 0;
  let equivalentMatches = 0;

  safeJobSkills.forEach(reqSkill => {
    const cleanReq = String(reqSkill || '').toLowerCase().trim();
    if (!cleanReq) return;

    // A. Khớp chính xác
    const isDirect = candSkills.some(cs => cs === cleanReq || cs.includes(cleanReq) || cleanReq.includes(cs));
    if (isDirect) {
      directMatches++;
      return;
    }

    // B. Khớp tương đương công nghệ
    const equivalents = TECH_EQUIVALENTS[cleanReq] || [];
    const hasEquiv = equivalents.some(eq =>
      candSkills.some(cs => cs === eq || cs.includes(eq) || eq.includes(cs))
    );
    if (hasEquiv) {
      equivalentMatches++;
    }
  });

  const totalRequired = safeJobSkills.length;
  const coreSkillScore = (directMatches / totalRequired) * 100;
  const equivScore = (equivalentMatches / totalRequired) * 75;

  // 2. Phân tích nền tảng học vấn & chuyên ngành từ phía NTD
  const uni = String(candidate.candidateUniversity || candidate.university || '').toLowerCase();
  const isItUni = IT_UNIVERSITIES.some(u => uni.includes(u));
  const educationBonus = isItUni ? 8 : 4;

  // 3. Phân tích kinh nghiệm / độ dày kỹ năng bổ trợ
  const totalSkillsCount = candSkills.length;
  const skillBreadthBonus = Math.min(10, totalSkillsCount * 1.5);

  // 4. Tính toán điểm cơ sở theo từng vòng thẩm định độc lập
  let baseScore = 0;

  if (attempt === 1) {
    // Vòng 1: Tiêu chí tuyển dụng độc lập chuẩn mực theo từ khóa cốt lõi
    baseScore = (coreSkillScore * 0.85) + (educationBonus * 0.8) + (skillBreadthBonus * 0.5);
  } else if (attempt === 2) {
    // Vòng 2: Mở rộng thẩm định có xét đến công nghệ tương đương & kỹ năng bổ trợ
    const combinedSkills = Math.min(100, coreSkillScore + equivScore * 0.8);
    baseScore = (combinedSkills * 0.82) + educationBonus + (skillBreadthBonus * 0.8);

// Đánh giá độc lập theo tiêu chí vòng 2
  } else {
    // Vòng 3: Thẩm định toàn diện (Holistic Assessment)
    const combinedSkills = Math.min(100, coreSkillScore + equivScore * 0.9);
    baseScore = (combinedSkills * 0.80) + (educationBonus * 1.2) + skillBreadthBonus;

// Đánh giá độc lập toàn diện theo tiêu chí vòng 3
  }

  // Làm tròn và đảm bảo điểm nằm trong khoảng 0 - 100
  return Math.min(100, Math.max(0, Math.round(baseScore)));
}

/**
 * Lấy điểm % phía ứng viên (Candidate side score)
 */
export function getCandidateSideScore(app = {}, job = {}) {
  if (typeof app.candidateMatchScore === 'number' && !isNaN(app.candidateMatchScore)) {
    return Math.min(100, Math.max(0, Math.round(app.candidateMatchScore)));
  }

  const candSkills = app.candidateSkills || app.skills || [];
  const safeJobSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : (typeof job.requiredSkills === 'string'
        ? job.requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);

  const result = calculateSkillMatch(candSkills, safeJobSkills, app.extractedCvText || '');
  return typeof result.percentage === 'number' ? result.percentage : 50;
}

/**
 * Thuật toán Xếp hạng ứng viên độc lập dành cho Nhà tuyển dụng
 *
 * @param {Object} job Tin tuyển dụng
 * @param {Array} applications Danh sách ứng viên đã nộp vào tin
 * @param {Object} options Tùy chọn (ngưỡng sai số, số lần thử)
 * @returns {Object} Kết quả xếp hạng chi tiết
 */
export function rankJobApplicants(job = {}, applications = [], options = {}) {
  const maxDeviation = typeof options.maxDeviation === 'number' ? options.maxDeviation : MAX_ALLOWED_DEVIATION;
  const maxAttempts = typeof options.maxAttempts === 'number' ? options.maxAttempts : MAX_EVALUATION_ATTEMPTS;

  if (!job || !Array.isArray(applications) || applications.length === 0) {
    return {
      rankedCandidates: [],
      unrankedCandidates: [],
      totalEvaluated: 0,
      qualifiedCount: 0,
      disqualifiedCount: 0,
      maxDeviation,
      maxAttempts
    };
  }

  const evaluatedList = applications.map(app => {
    const candidateScore = getCandidateSideScore(app, job);
    const history = [];
    let isQualified = false;
    let finalEmployerScore = null;
    let finalDeviation = null;
    let successfulAttempt = null;

    // Chạy quy trình tái thẩm định tối đa 3 lần
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const employerScore = evaluateEmployerMatch(app, job, attempt, candidateScore);
      const deviation = Math.abs(employerScore - candidateScore);
      const passed = deviation <= maxDeviation;

      history.push({
        attempt,
        employerScore,
        candidateScore,
        deviation,
        passed,
        note: passed
          ? `Lần ${attempt}: Điểm NTD (${employerScore}%) và Ứng viên (${candidateScore}%) chênh lệch ${deviation}% (≤ ${maxDeviation}%). Đạt tiêu chuẩn thẩm định.`
          : `Lần ${attempt}: Điểm NTD (${employerScore}%) lệch ${deviation}% so với Ứng viên (${candidateScore}%) (> ${maxDeviation}% cho phép). Cần thẩm định lại.`
      });

      if (passed) {
        isQualified = true;
        finalEmployerScore = employerScore;
        finalDeviation = deviation;
        successfulAttempt = attempt;
        break;
      }
    }

    // Nếu sau 3 lần vẫn không đạt tiêu chuẩn độ lệch
    if (!isQualified) {
      const lastAttempt = history[history.length - 1];
      return {
        ...app,
        candidateScore,
        employerScore: lastAttempt.employerScore,
        finalScore: null,
        deviation: lastAttempt.deviation,
        isQualified: false,
        attemptsCount: history.length,
        successfulAttempt: null,
        history,
        evaluationStatus: 'DISQUALIFIED_AFTER_3_ATTEMPTS',
        statusReason: `Đã thẩm định độc lập 3 lần nhưng độ lệch kết quả giữa NTD (${lastAttempt.employerScore}%) và Ứng viên (${candidateScore}%) vẫn là ${lastAttempt.deviation}% (> ${maxDeviation}%). Hệ thống dừng đánh giá ứng viên này.`
      };
    }

    return {
      ...app,
      candidateScore,
      employerScore: finalEmployerScore,
      finalScore: finalEmployerScore,
      deviation: finalDeviation,
      isQualified: true,
      attemptsCount: history.length,
      successfulAttempt,
      history,
      evaluationStatus: 'QUALIFIED',
      statusReason: `Thẩm định thành công ở lần ${successfulAttempt} (Độ lệch ${finalDeviation}% ≤ ${maxDeviation}%).`
    };
  });

  // Tách nhóm: Đủ điều kiện xếp hạng và Không đủ điều kiện xếp hạng
  const qualifiedList = evaluatedList.filter(item => item.isQualified);
  const unrankedList = evaluatedList.filter(item => !item.isQualified);

  // Xếp hạng từ cao đến thấp theo điểm % NTD (finalScore)
  qualifiedList.sort((a, b) => {
    // 1. Điểm NTD cao hơn xếp trước
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    // 2. Điểm bằng nhau -> độ lệch thấp hơn xếp trước (độ tin cậy cao hơn)
    if (a.deviation !== b.deviation) {
      return a.deviation - b.deviation;
    }
    // 3. Xếp theo số lần thẩm định (vòng 1 ưu tiên hơn vòng 2, 3)
    return a.attemptsCount - b.attemptsCount;
  });

  // Gán thứ hạng Rank: #1, #2, #3...
  qualifiedList.forEach((item, index) => {
    item.rank = index + 1;
  });

  return {
    rankedCandidates: qualifiedList,
    unrankedCandidates: unrankedList,
    totalEvaluated: evaluatedList.length,
    qualifiedCount: qualifiedList.length,
    disqualifiedCount: unrankedList.length,
    maxDeviation,
    maxAttempts
  };
}
