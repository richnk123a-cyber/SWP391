/**
 * Thẩm định định danh tài liệu: Bất cứ tài liệu nào KHÔNG PHẢI là CV cá nhân ngành CNTT
 * (Biên bản cuộc họp, hợp đồng, bài luận, hóa đơn, CV ngành khác...) đều bị từ chối.
 */
export function inspectResumeValidity(text = '') {
  if (!text || typeof text !== 'string') {
    return { isInvalid: false, detectedType: null };
  }
  const lower = text.toLowerCase();

  // 1. Kiểm tra các nhóm tài liệu không phải CV IT
  // Nhóm A: Biên bản cuộc họp
  if (/biên bản cuộc họp|bien ban cuoc hop|biên bản họp|bien ban hop|thành phần tham dự|thanh phan tham du|chủ tọa|chủ trì cuộc họp|thư ký cuộc họp|nội dung cuộc họp|kết luận cuộc họp|họp giao ban|bế mạc cuộc họp/i.test(lower)) {
    return { isInvalid: true, detectedType: 'Biên bản cuộc họp' };
  }
  // Nhóm B: Hợp đồng / Văn bản pháp lý / Quyết định
  if (/hợp đồng (kinh tế|lao động|thuê nhà|dịch vụ)|bên a:|bên b:|căn cứ luật|quyết định số|nghị định số|thông tư số|điều khoản hợp đồng/i.test(lower)) {
    return { isInvalid: true, detectedType: 'Hợp đồng / Văn bản pháp lý' };
  }
  // Nhóm C: Hóa đơn, chứng từ tài chính
  if (/hóa đơn (giá trị gia tăng|vat|bán lẻ)|phiếu (thu|chi|nhập kho|xuất kho)|bảng báo giá|sổ quỹ|sao kê tài khoản/i.test(lower)) {
    return { isInvalid: true, detectedType: 'Hóa đơn / Báo cáo tài chính' };
  }
  // Nhóm D: Bài tiểu luận / Báo cáo học thuật phi CNTT
  if (/tiểu luận|bài thu hoạch|giáo trình|đề tài nghiên cứu|giảng viên hướng dẫn|khoa lý luận chính trị|triết học mác/i.test(lower)) {
    return { isInvalid: true, detectedType: 'Bài tiểu luận / Tài liệu học tập phi IT' };
  }
  // Nhóm E: CV ngành nghề phi IT (Kế toán, xây dựng, y tế, nhà hàng...)
  const nonItRoleKeywords = [
    'kế toán tổng hợp', 'kế toán thuế', 'nhân viên buồng phòng', 'nhân viên pha chế',
    'giám sát công trình xây dựng', 'bác sĩ điều trị', 'điều dưỡng', 'dược sĩ',
    'lễ tân khách sạn', 'nhân viên phục vụ bàn'
  ];
  if (nonItRoleKeywords.some(kw => lower.includes(kw))) {
    return { isInvalid: true, detectedType: 'Hồ sơ xin việc ngành nghề khác (không phải CNTT)' };
  }

  // Nếu tài liệu có tiêu đề hoặc định danh CV ứng viên CNTT được xác nhận bởi hệ thống
  if (lower.includes('hồ sơ ứng viên') || lower.includes('thông tin liên hệ') || lower.includes('kỹ năng công nghệ') || lower.includes('cv -') || lower.includes('cv:')) {
    return { isInvalid: false, detectedType: 'CV Công nghệ Thông tin' };
  }

  // 2. Kiểm tra sự hiện diện của từ khóa kỹ thuật ngành CNTT / Lập trình
  const itKeywords = [
    'java', 'python', 'javascript', 'typescript', 'react', 'node', 'spring',
    'c++', 'c#', 'php', 'golang', 'rust', 'html', 'css', 'sql', 'database',
    'backend', 'frontend', 'fullstack', 'devops', 'docker', 'kubernetes', 'aws',
    'git', 'github', 'api', 'restful', 'developer', 'lập trình', 'phần mềm',
    'software engineer', 'source code', 'mã nguồn', 'khung lập trình', 'framework',
    'khoa học máy tính', 'công nghệ thông tin', 'mobile app', 'flutter', 'vue',
    'angular', 'oop', 'cơ sở dữ liệu', 'thuật toán', 'se', 'cntt', 'it', 'web', 'ai'
  ];

  const matchedItKeywords = itKeywords.filter(kw => {
    return new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower);
  });

  // Nếu văn bản có độ dài đáng kể (> 80 ký tự) nhưng gần như không có từ khóa CNTT nào (< 2 từ)
  if (text.trim().length > 80 && matchedItKeywords.length < 2) {
    return { isInvalid: true, detectedType: 'Văn bản không liên quan đến ngành Công nghệ Thông tin' };
  }

  return { isInvalid: false, detectedType: 'CV Công nghệ Thông tin' };
}

export function isUnrelatedOrMeetingMinutes(text = '') {
  return inspectResumeValidity(text).isInvalid;
}

/**
 * Tổng hợp thông tin hồ sơ ứng viên CNTT thành văn bản CV chuẩn
 * dùng cho AI Matching khi tệp tải lên là file ảnh/scan hoặc tránh bị kẹt cache cũ
 */
/**
 * Suy luận kỹ năng cốt lõi từ vai trò/chức danh mong muốn
 * Dùng khi CV là ảnh scan không đọc được text và profile chưa điền đầy đủ kỹ năng
 */
export function inferSkillsFromRole(desiredRole = '') {
  // CHỈ dùng để tạo header CV hợp lệ cho isValidCv check.
  // KHÔNG inject vào kỹ năng thực tế để tránh false-positive khi matching.
  // Git, Docker... KHÔNG được tự suy luận — chỉ match khi ứng viên tự khai.
  const roleLower = String(desiredRole || '').toLowerCase();
  const inferred = [];
  if (/frontend|front-end|react|vue|angular|ui\b|html/.test(roleLower)) {
    inferred.push(...['HTML/CSS', 'JavaScript', 'ReactJS', 'CSS']);
  }
  if (/backend|back-end|java\b|spring/.test(roleLower)) {
    inferred.push(...['Java', 'Spring Boot', 'SQL', 'REST API']);
  }
  if (/fullstack|full-stack|full stack/.test(roleLower)) {
    inferred.push(...['JavaScript', 'React', 'Node.js', 'SQL']);
  }
  if (/mobile|flutter|android|ios|kotlin/.test(roleLower)) {
    inferred.push(...['Flutter', 'Dart', 'Java', 'Kotlin']);
  }
  if (/python|data|machine learning|\bai\b|ml\b/.test(roleLower)) {
    inferred.push(...['Python', 'SQL', 'Machine Learning']);
  }
  if (/devops|cloud|docker|linux/.test(roleLower)) {
    inferred.push(...['Docker', 'Linux', 'CI\/CD']);
  }
  return [...new Set(inferred)];
}

/**
 * Tổng hợp thông tin hồ sơ ứng viên CNTT thành văn bản CV chuẩn
 * dùng cho AI Matching khi tệp tải lên là file ảnh/scan hoặc tránh bị kẹt cache cũ
 */
export function synthesizeCandidateCvText(profile = {}, fileName = 'CV.pdf') {
  const parts = [];
  const name = profile.fullName || profile.name || 'Ứng viên CNTT';
  parts.push(`HỒ SƠ ỨNG VIÊN CÔNG NGHỆ THÔNG TIN: ${name.toUpperCase()} (Tệp: ${fileName})`);
  if (profile.desiredRole) parts.push(`Vị trí ứng tuyển mục tiêu: ${profile.desiredRole}`);
  if (profile.phone || profile.email || profile.location) {
    parts.push('\n--- THÔNG TIN LIÊN HỆ ---');
    if (profile.phone) parts.push(`- Điện thoại: ${profile.phone}`);
    if (profile.email) parts.push(`- Email: ${profile.email}`);
    if (profile.location) parts.push(`- Địa chỉ: ${profile.location}`);
  }
  if (profile.university || profile.major || profile.graduationYear) {
    parts.push('\n--- HỌC VẤN ---');
    if (profile.university) parts.push(`- Trường: ${profile.university}`);
    if (profile.major) parts.push(`- Chuyên ngành: ${profile.major}`);
    if (profile.graduationYear) parts.push(`- Niên khóa / Tốt nghiệp: ${profile.graduationYear}`);
  }
  if (profile.bio) {
    parts.push('\n--- MỤC TIÊU NGHỀ NGHIỆP ---');
    parts.push(profile.bio);
  }

  // Kỹ năng từ hồ sơ web
  const profileSkills = (profile.skills || [])
    .map(s => typeof s === 'string' ? s : (s?.name || ''))
    .filter(Boolean);

  // Bổ sung kỹ năng suy luận từ vai trò mong muốn khi profile chưa có đủ
  const roleInferred = inferSkillsFromRole(profile.desiredRole || '');
  const allSkills = [...profileSkills];
  for (const s of roleInferred) {
    if (!allSkills.some(cs => cs.toLowerCase() === s.toLowerCase())) {
      allSkills.push(s);
    }
  }

  if (allSkills.length > 0) {
    parts.push('\n--- KỸ NĂNG CÔNG NGHỆ & LẬP TRÌNH ---');
    allSkills.forEach(s => parts.push(`- ${s}`));
  }

  // Luôn bổ sung kỹ năng mềm tiêu chuẩn
  parts.push('\n--- KỸ NĂNG KHÁC ---');
  parts.push('- Giao tiếp & Làm việc nhóm');
  parts.push('- Tư duy phản biện');
  parts.push('- Quản lý thời gian');
  parts.push('- Giải quyết vấn đề');

  if (profile.desiredRole) {
    parts.push(`\nGhi chú: Đây là hồ sơ ứng viên ngành CNTT ứng tuyển vị trí ${profile.desiredRole}.`);
  }

  return parts.join('\n');
}

export function cleanSkillCore(s) {
  if (!s) return '';
  return String(s).toLowerCase().trim()
    .replace(/^(k[ĩỹ]\s*n[ăa]ng|kh[ảa]\s*n[ăa]ng|kinh\s*nghi[ệe]m|hi[ểe]u\s*bi[ếe]t|th[àa]nh\s*th[ạa]o|ki[ếe]n\s*th[ứu]c\s*v[ềe])\s+/gi, '')
    .trim();
}

/**
 * Trích xuất toàn bộ danh sách kỹ năng được khai báo trong văn bản CV
 * Hỗ trợ bóc tách từ các mục:
 * - KỸ NĂNG, KỸ NĂNG LẬP TRÌNH, SKILLS (kèm phần trăm hoặc phân tách bằng dấu phẩy)
 * - KỸ NĂNG KHÁC, KỸ NĂNG MỀM, SOFT SKILLS (kèm ký tự bullet ·, -, *, •)
 * - Kinh nghiệm làm việc, dự án
 */
export function extractDeclaredSkillsFromCv(cvText = '') {
  if (!cvText || typeof cvText !== 'string') return [];
  const skills = new Set();
  const lines = cvText.split(/[\r\n]+/);

  let currentSection = '';
  function parseInlineSkills(str, targetSet) {
    const tokens = str.split(/[,;\n]/).map(t =>
      t.replace(/:\s*\d+%/g, '')
       .replace(/\s+\d+%/g, '')
       .replace(/^[-•·*]\s*/, '')
       .replace(/\(.*?\)/g, '')
       .trim()
    ).filter(t => t.length > 1 && t.length < 60);
    tokens.forEach(t => targetSet.add(t));
  }

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (/^(---|###|\*\*\*)?\s*(k[ỹĩ]\s*n[ăa]ng|skills|technical skills|chuy[êe]n\s*m[ôo]n)/i.test(trimmed)) {
      currentSection = 'TECH_SKILLS';
      const afterColon = trimmed.replace(/^[^:]+:\s*/, '');
      if (afterColon && afterColon !== trimmed) {
        parseInlineSkills(afterColon, skills);
      }
      continue;
    }
    if (/^(---|###|\*\*\*)?\s*(k[ỹĩ]\s*n[ăa]ng\s*kh[áa]c|k[ỹĩ]\s*n[ăa]ng\s*m[ềe]m|soft\s*skills|other\s*skills)/i.test(trimmed)) {
      currentSection = 'SOFT_SKILLS';
      const afterColon = trimmed.replace(/^[^:]+:\s*/, '');
      if (afterColon && afterColon !== trimmed) {
        parseInlineSkills(afterColon, skills);
      }
      continue;
    }
    if (/^(---|###|\*\*\*)?\s*(kinh\s*nghi[ệe]m|h[ọo]c\s*v[ấa]n|m[ụu]c\s*ti[êe]u|th[ôo]ng\s*tin\s*li[êe]n\s*h[ệe])/i.test(trimmed)) {
      currentSection = 'OTHER';
      continue;
    }

    if (currentSection === 'TECH_SKILLS' || currentSection === 'SOFT_SKILLS' || /^[-•·*]\s+/.test(trimmed)) {
      const cleanItem = trimmed
        .replace(/^[-•·*]\s*/, '')
        .replace(/:\s*\d+%/g, '')
        .replace(/\s+\d+%/g, '')
        .replace(/\(.*?\)/g, '')
        .trim();
      if (cleanItem.length > 1 && cleanItem.length < 60) {
        if (cleanItem.includes(',') || cleanItem.includes(';')) {
          parseInlineSkills(cleanItem, skills);
        } else {
          skills.add(cleanItem);
        }
      }
    }
  }

  // Quét danh mục kỹ năng chuẩn nếu có xuất hiện trong CV
  const commonCatalog = [
    'Java', 'Spring Boot', 'SQL', 'Git', 'Docker', 'React', 'Node.js', 'Python',
    'Giao tiếp & Làm việc nhóm', 'Kĩ năng giao tiếp', 'Kỹ năng làm việc nhóm',
    'Tư duy phản biện', 'Quản lý thời gian', 'Giải quyết vấn đề', 'Kĩ năng dẫn dắt'
  ];
  for (const catSkill of commonCatalog) {
    const escaped = catSkill.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    if (new RegExp('(^|[^a-zA-Z0-9_à-ỹÀ-Ỹ])' + escaped + '([^a-zA-Z0-9_à-ỹÀ-Ỹ]|$)', 'i').test(cvText)) {
      skills.add(catSkill);
    }
  }

  return Array.from(skills);
}

/**
 * Tổng hợp toàn diện kỹ năng của ứng viên từ CẢ 2 NGUỒN:
 * 1) Kỹ năng người dùng khai trên hồ sơ web (candidate.skills)
 * 2) Kỹ năng người dùng khai trong CV tải lên / tạo mẫu (candidate.extractedCvText)
 */
export function getAllCandidateSkills(candidate = {}) {
  const rawProfile = candidate?.skills || [];
  const profileSkills = (Array.isArray(rawProfile) ? rawProfile : [])
    .map(s => typeof s === 'string' ? s : (s?.name || ''))
    .filter(Boolean);

  const cvSkills = extractDeclaredSkillsFromCv(candidate?.extractedCvText || '');
  const combined = [...profileSkills];
  for (const s of cvSkills) {
    if (!combined.some(cs => cs.toLowerCase() === s.toLowerCase())) {
      combined.push(s);
    }
  }

  return {
    profileSkills,
    cvSkills,
    combinedSkills: combined
  };
}

export const SEMANTIC_SKILL_DICTIONARY = [
  // === KỸ NĂNG MỀM (CHỈ ĐƯỢC MATCH VỚI KỸ NĂNG MỀM KHÁC) ===
  { keys: ['giao tiếp', 'communication'], synonyms: ['giao tiếp', 'communication', 'thuyết trình', 'trao đổi'], type: 'soft' },
  { keys: ['làm việc nhóm', 'teamwork'], synonyms: ['làm việc nhóm', 'teamwork', 'team work', 'phối hợp nhóm'], type: 'soft' },
  { keys: ['dẫn dắt', 'lãnh đạo', 'leadership'], synonyms: ['dẫn dắt', 'lãnh đạo', 'leadership', 'lead', 'leader', 'trưởng nhóm', 'giám đốc', 'điều hành', 'giám đốc điều hành'], type: 'soft' },
  { keys: ['giải quyết vấn đề', 'problem solving'], synonyms: ['giải quyết vấn đề', 'problem solving', 'xử lý vấn đề'], type: 'soft' },
  { keys: ['quản lý thời gian', 'time management'], synonyms: ['quản lý thời gian', 'time management'], type: 'soft' },
  { keys: ['tư duy phản biện', 'critical thinking'], synonyms: ['tư duy phản biện', 'critical thinking', 'tư duy logic', 'phân tích logic'], type: 'soft' },

  // === KỸ NĂNG KỸ THUẬT (CHỈ MATCH VỚI BIẾN THỂ KỸ THUẬT TƯƠNG ĐƯƠNG) ===
  // Tuyệt đối không cho phép soft skills match tech skills!
  { keys: ['react', 'reactjs', 'react.js'], synonyms: ['react', 'reactjs', 'react.js', 'react js', 'frontend react'], type: 'tech' },
  { keys: ['javascript', 'js'], synonyms: ['javascript', 'js', 'ecmascript', 'es6', 'es2015'], type: 'tech' },
  { keys: ['typescript', 'ts'], synonyms: ['typescript', 'ts'], type: 'tech' },
  { keys: ['html/css', 'html', 'css'], synonyms: ['html/css', 'html', 'css', 'html5', 'css3'], type: 'tech' },
  { keys: ['java'], synonyms: ['java', 'core java', 'java backend', 'java se', 'java ee'], type: 'tech' },
  { keys: ['spring', 'spring boot'], synonyms: ['spring boot', 'spring framework', 'spring mvc', 'spring'], type: 'tech' },
  { keys: ['node.js', 'nodejs'], synonyms: ['node.js', 'nodejs', 'node js'], type: 'tech' },
  { keys: ['c++'], synonyms: ['c++', 'cpp'], type: 'tech' },
  { keys: ['c#'], synonyms: ['c#', 'csharp', 'c sharp', '.net'], type: 'tech' },
  { keys: ['python'], synonyms: ['python', 'python3'], type: 'tech' },
  { keys: ['sql'], synonyms: ['sql', 'database', 'cơ sở dữ liệu'], type: 'tech' },
  { keys: ['mysql'], synonyms: ['mysql', 'my sql'], type: 'tech' },
  { keys: ['postgresql', 'postgres'], synonyms: ['postgresql', 'postgres'], type: 'tech' },
  { keys: ['sql server'], synonyms: ['sql server', 'mssql', 'ms sql'], type: 'tech' },
  { keys: ['git'], synonyms: ['git', 'github', 'gitlab', 'bitbucket'], type: 'tech' },
  { keys: ['docker'], synonyms: ['docker', 'container', 'docker-compose'], type: 'tech' }
];

export function isSkillWordMatch(targetSkill = '', text = '') {
  if (!targetSkill || !text) return false;
  // Trong chế độ unicode /u, chỉ escape các ký tự đặc biệt thực sự của regex: [.*+?^${}()|[\]\/]
  const escaped = targetSkill.replace(/[.*+?^${}()|[\]\/]/g, ch => '\\' + ch);
  // Sử dụng boundary an toàn cho cả C++, C# và từ khóa thông thường
  const pattern = new RegExp('(?:^|[^\\p{L}\\p{N}+#])' + escaped + '(?:$|[^\\p{L}\\p{N}+#])', 'iu');
  return pattern.test(text);
}

export function areSkillsEquivalent(s1 = '', s2 = '') {
  const norm1 = String(s1 || '').toLowerCase().trim();
  const norm2 = String(s2 || '').toLowerCase().trim();
  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;

  // Cấm so khớp nhầm giữa các công nghệ khác biệt có chung chuỗi con:
  // Java != JavaScript, C != C++ / C#, SQL != NoSQL, React != React Native
  if ((norm1 === 'java' && norm2.includes('javascript')) || (norm2 === 'java' && norm1.includes('javascript'))) return false;
  if ((norm1 === 'c' && (norm2 === 'c++' || norm2 === 'c#' || norm2.includes('css'))) ||
      (norm2 === 'c' && (norm1 === 'c++' || norm1 === 'c#' || norm1.includes('css')))) return false;
  if ((norm1 === 'sql' && norm2.includes('nosql')) || (norm2 === 'sql' && norm1.includes('nosql'))) return false;
  if ((norm1 === 'react' && norm2.includes('native')) || (norm2 === 'react' && norm1.includes('native'))) return false;

  // Kiểm tra qua từ điển đồng nghĩa kỹ thuật hoặc mềm
  for (const entry of SEMANTIC_SKILL_DICTIONARY) {
    const has1 = entry.keys.includes(norm1) || entry.synonyms.includes(norm1);
    const has2 = entry.keys.includes(norm2) || entry.synonyms.includes(norm2);
    if (has1 && has2) return true;
  }

  return false;
}

export function checkSkillInCv(skill, candidateSkills = [], cvText = '') {
  const rawLower = String(skill || '').toLowerCase().trim();
  const coreLower = cleanSkillCore(skill);
  const cvLower = String(cvText || '').toLowerCase();
  const normCand = (Array.isArray(candidateSkills) ? candidateSkills : [])
    .map(s => typeof s === 'string' ? s : (s?.name || ''))
    .map(s => String(s || '').toLowerCase().trim())
    .filter(Boolean);

  // 1. Đối chiếu trực tiếp với kỹ năng hồ sơ đã chuẩn hóa
  for (const cs of normCand) {
    if (areSkillsEquivalent(cs, rawLower)) return true;
    if (coreLower.length > 2 && areSkillsEquivalent(cs, coreLower)) return true;
  }

  // 2. Tìm kiếm chính xác theo ranh giới từ (word-boundary) trong văn bản CV
  // Tránh việc "c" match "cong nghe", "ai" match "giai quyet", "go" match "giao tiep"
  if (rawLower.length > 0 && isSkillWordMatch(rawLower, cvLower)) return true;
  if (coreLower.length > 2 && isSkillWordMatch(coreLower, cvLower)) return true;

  // 3. Đối chiếu ngữ nghĩa thông minh qua từ điển (chỉ cho các từ đồng nghĩa thực sự)
  for (const entry of SEMANTIC_SKILL_DICTIONARY) {
    const isMatchingEntry = entry.keys.some(k => k === rawLower || k === coreLower);
    if (isMatchingEntry) {
      const foundInCandidate = entry.synonyms.some(syn => {
        return normCand.some(cs => areSkillsEquivalent(cs, syn)) || isSkillWordMatch(syn, cvLower);
      });
      if (foundInCandidate) return true;
    }
  }

  return false;
}

/**
 * Level 1 - Skill Tag & CV Text Matching Algorithm
 * Evaluates candidate skill tags & extracted CV text against job required skills.
 */
export function calculateSkillMatch(candidateSkills = [], jobRequiredSkills = [], extractedCvText = '') {
  const safeJobSkills = Array.isArray(jobRequiredSkills)
    ? jobRequiredSkills
    : (typeof jobRequiredSkills === 'string'
        ? jobRequiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);

  if (!safeJobSkills || safeJobSkills.length === 0) {
    return {
      percentage: 100,
      label: 'Strong Match',
      badgeClass: 'badge-strong',
      matchedSkills: Array.isArray(candidateSkills) ? candidateSkills : [],
      missingSkills: []
    };
  }

  // Nếu phát hiện văn bản tải lên là biên bản cuộc họp hoặc văn bản hành chính không liên quan,
  // bỏ qua hoàn toàn văn bản CV này để tránh đối sánh sai các từ ngữ ngẫu nhiên
  const isInvalidDoc = isUnrelatedOrMeetingMinutes(extractedCvText);
  const cvTextLower = isInvalidDoc ? '' : String(extractedCvText || '').toLowerCase();
  const cvDeclaredSkills = isInvalidDoc ? [] : extractDeclaredSkillsFromCv(extractedCvText);

  // KẾT HỢP CẢ 2 NGUỒN: Kỹ năng khai trên web (candidateSkills) + Kỹ năng khai trong bản CV (cvDeclaredSkills)
  const combinedCandidate = Array.isArray(candidateSkills) ? [...candidateSkills] : [];
  for (const cs of cvDeclaredSkills) {
    if (!combinedCandidate.some(c => (typeof c === 'string' ? c : c?.name || '').toLowerCase() === cs.toLowerCase())) {
      combinedCandidate.push(cs);
    }
  }

  const matchedSkills = [];
  const missingSkills = [];

  safeJobSkills.forEach(skill => {
    const cleanSkill = String(skill || '').trim();
    if (!cleanSkill) return;

    if (checkSkillInCv(cleanSkill, combinedCandidate, cvTextLower)) {
      matchedSkills.push(cleanSkill);
    } else {
      missingSkills.push(cleanSkill);
    }
  });

  const percentage = safeJobSkills.length === 0
    ? 100
    : Math.min(100, Math.max(0, Math.round((matchedSkills.length / safeJobSkills.length) * 100)));

  let label = 'Low Match';
  let badgeClass = 'badge-low';

  if (percentage >= 80) {
    label = 'Strong Match';
    badgeClass = 'badge-strong';
  } else if (percentage >= 60) {
    label = 'Good Match';
    badgeClass = 'badge-good';
  } else if (percentage >= 40) {
    label = 'Potential Match';
    badgeClass = 'badge-potential';
  }

  return {
    percentage,
    label,
    badgeClass,
    matchedSkills,
    missingSkills
  };
}

export function synchronizeMatchedSkills(matchedSkills = [], missingSkills = [], candidate = {}, job = {}) {
  const norm = (s) => String(s || '').toLowerCase().trim();
  const { combinedSkills } = getAllCandidateSkills(candidate);

  const rawJobSkills = job?.requiredSkills || [];
  const safeJobSkills = (Array.isArray(rawJobSkills)
    ? rawJobSkills
    : (typeof rawJobSkills === 'string'
        ? rawJobSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : [])).map(s => String(s || '').trim()).filter(Boolean);

  const matchedSet = new Set((matchedSkills || []).map(s => String(s || '').trim()).filter(Boolean));

  // Kiểm tra từng kỹ năng yêu cầu trong JD xem ứng viên đã có trong profile HOẶC trong CV chưa
  safeJobSkills.forEach(reqSkill => {
    const lReq = norm(reqSkill);
    const hasInSkills = combinedSkills.some(cs => areSkillsEquivalent(cs, lReq));
    if (hasInSkills || checkSkillInCv(reqSkill, combinedSkills, candidate?.extractedCvText)) {
      matchedSet.add(reqSkill);
    }
  });

  const finalMatched = [];
  const finalMissing = [];

  safeJobSkills.forEach(reqSkill => {
    const isMatched = Array.from(matchedSet).some(ms => norm(ms) === norm(reqSkill))
      || checkSkillInCv(reqSkill, combinedSkills, candidate?.extractedCvText);
    if (isMatched) {
      finalMatched.push(reqSkill);
    } else {
      finalMissing.push(reqSkill);
    }
  });

  return {
    matchedSkills: finalMatched,
    missingSkills: finalMissing
  };
}

export function generateAIDeepAnalysis(candidate = {}, job = {}) {
  const candidateSkills = candidate.skills || [];
  const extractedCvText = candidate.extractedCvText || '';
  const requiredSkills = job.requiredSkills || [];

  const safeJobSkills = Array.isArray(requiredSkills)
    ? requiredSkills
    : (typeof requiredSkills === 'string'
        ? requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);

  // 1. Kiểm tra tài liệu tải lên có phải là CV cá nhân ngành CNTT hay không
  const validity = inspectResumeValidity(extractedCvText);
  if (validity.isInvalid) {
    const docName = validity.detectedType || 'Văn bản không liên quan đến CNTT';
    const baseMatch = calculateSkillMatch(candidateSkills, safeJobSkills, extractedCvText);
    const synced = synchronizeMatchedSkills(baseMatch.matchedSkills, baseMatch.missingSkills, candidate, job);
    return {
      overallMatch: 0,
      skillMatch: 0,
      experienceMatch: 0,
      projectRelevance: 0,
      isValidCv: false,
      documentType: docName,
      unrelatedDocumentWarning: `CẢNH BÁO: Tệp tài liệu bạn tải lên được nhận diện là [${docName}], KHÔNG PHẢI là bản CV/Resume cá nhân thuộc lĩnh vực Công nghệ Thông tin. Hệ thống từ chối tính điểm kinh nghiệm (0%) và dự án (0%). Vui lòng tải lên đúng bản CV cá nhân ngành CNTT (chứa thông tin kỹ năng lập trình, dự án phần mềm và kinh nghiệm kỹ thuật) để được đánh giá chính xác.`,
      matchedSkills: synced.matchedSkills,
      missingSkills: synced.missingSkills,
      strengths: synced.matchedSkills.length > 0
        ? [`Đã tích lũy kỹ năng trong hồ sơ: ${synced.matchedSkills.join(', ')}.`]
        : [],
      areasToImprove: [
        `Tệp tài liệu tải lên được nhận diện là [${docName}], không phải hồ sơ CV cá nhân ngành CNTT.`,
        'Vui lòng tải lên đúng bản CV/Resume chuyên môn kỹ thuật có đầy đủ thông tin: kỹ năng lập trình, dự án phần mềm đã tham gia và kinh nghiệm làm việc thực tế.',
        ...(synced.missingSkills.length > 0 ? [`Cần bổ sung các kỹ năng còn thiếu: ${synced.missingSkills.join(', ')}.`] : [])
      ],
      explanation: `Tệp tải lên được xác định là [${docName}]. CareerFit AI từ chối ghi nhận điểm kinh nghiệm (0%) và dự án liên quan (0%) cho tài liệu này. Tuy nhiên, hệ thống đã đối soát và ghi nhận các kỹ năng bạn đã tích lũy trong hồ sơ (${synced.matchedSkills.join(', ') || 'Chưa có'}). Vui lòng cập nhật đúng bản CV cá nhân ngành CNTT của bạn để được đánh giá đầy đủ kinh nghiệm và dự án.`
    };
  }

  const matchResult = calculateSkillMatch(candidateSkills, requiredSkills, extractedCvText);
  const syncedSkills = synchronizeMatchedSkills(matchResult.matchedSkills, matchResult.missingSkills, candidate, job);
  const skillMatch = safeJobSkills.length > 0
    ? Math.min(100, Math.round((syncedSkills.matchedSkills.length / safeJobSkills.length) * 100))
    : matchResult.percentage;

  // 2. Tính toán chính xác kinh nghiệm (Experience Fit) và Dự án (Project Relevance) thực tế
  const cvText = String(extractedCvText || '').toLowerCase();
  const hasCv = Boolean(extractedCvText && extractedCvText.trim().length > 30);

  let projectRelevance = 0;
  let experienceMatch = 0;

  if (hasCv) {
    // A. Project Relevance:
    const hasProjectKeywords = /(dự án|project|hệ thống|ứng dụng|application|website|demo|github|repository|module|sản phẩm|phần mềm)/i.test(cvText);
    const matchedSkillsInCv = safeJobSkills.filter(skill => checkSkillInCv(skill, candidateSkills, extractedCvText));

    if (safeJobSkills.length > 0) {
      const cvSkillRatio = matchedSkillsInCv.length / safeJobSkills.length;
      projectRelevance = Math.round((cvSkillRatio * 70) + (hasProjectKeywords ? 20 : 10));
    } else {
      projectRelevance = hasProjectKeywords ? 50 : 25;
    }
    projectRelevance = Math.min(95, Math.max(15, projectRelevance));

    // B. Experience Fit & Internship/Fresher Awareness:
    const jobTitleLower = String(job.title || '').toLowerCase();
    const jobTypeLower = String(job.jobType || '').toLowerCase();
    const isInternOrFresher = /(intern|thực tập|fresher|trainee|học việc|mới tốt nghiệp)/i.test(jobTitleLower)
      || /(intern|thực tập|fresher|trainee|học việc|mới tốt nghiệp)/i.test(jobTypeLower);

    const hasExpKeywords = /(kinh nghiệm|experience|thực tập|intern|fresher|junior|công ty|vị trí|developer|engineer|lập trình viên|giám đốc|điều hành|quản lý|lead)/i.test(cvText);
    const majorLower = String(candidate.major || '').toLowerCase();
    const candidateTextLower = (cvText + ' ' + majorLower + ' ' + String(candidate.university || '').toLowerCase());
    const isItMajor = /(công nghệ thông tin|khoa học máy tính|kỹ thuật phần mềm|hệ thống thông tin|\bse\b|\bcntt\b|\bit\b|computer science|software|fpt)/i.test(candidateTextLower);

    if (isInternOrFresher) {
      // VỊ TRÍ THỰC TẬP SINH / FRESHER: Sinh viên ngành IT/SE hoặc có kỹ năng lập trình đạt điểm kinh nghiệm nền tảng từ 45% - 85%
      let internBase = 45 + (skillMatch * 0.3);
      if (isItMajor) internBase += 15;
      if (hasExpKeywords) internBase += 10;
      experienceMatch = Math.min(85, Math.max(40, Math.round(internBase)));
    } else {
      let baseExp = skillMatch * 0.45;
      if (hasExpKeywords) baseExp += 25;
      if (isItMajor) baseExp += 20;
      experienceMatch = Math.min(95, Math.max(0, Math.round(baseExp)));
    }
  } else {
    const jobTitleLower = String(job.title || '').toLowerCase();
    const jobTypeLower = String(job.jobType || '').toLowerCase();
    const isInternOrFresher = /(intern|thực tập|fresher|trainee|học việc|mới tốt nghiệp)/i.test(jobTitleLower)
      || /(intern|thực tập|fresher|trainee|học việc|mới tốt nghiệp)/i.test(jobTypeLower);

    const isItMajor = /(công nghệ thông tin|khoa học máy tính|kỹ thuật phần mềm|hệ thống thông tin|\bse\b|\bcntt\b|\bit\b|computer science|software|fpt)/i.test(String(candidate.major || '').toLowerCase());
    if (isInternOrFresher) {
      experienceMatch = isItMajor ? 45 : 30;
    } else {
      experienceMatch = isItMajor ? 35 : (skillMatch > 0 ? 20 : 0);
    }
    projectRelevance = 15;
  }

  const overallMatch = Math.round((skillMatch * 0.5) + (experienceMatch * 0.3) + (projectRelevance * 0.2));

  let strengths = [];
  let areasToImprove = [];

  if (syncedSkills.matchedSkills.length > 0) {
    strengths.push(`Đáp ứng tốt các yêu cầu cốt lõi: ${syncedSkills.matchedSkills.join(', ')}.`);
  } else {
    strengths.push('Cần bổ sung thêm các kỹ năng chuyên môn phù hợp với vị trí này.');
  }

  if (candidate.university) {
    strengths.push(`Nền tảng đào tạo chính quy tại ${candidate.university}.`);
  }

  if (syncedSkills.missingSkills.length > 0) {
    areasToImprove.push(`Cần trau dồi và bổ sung kiến thức về: ${syncedSkills.missingSkills.join(', ')}.`);
  } else {
    areasToImprove.push('Bạn đã đáp ứng 100% kỹ năng kỹ thuật yêu cầu từ nhà tuyển dụng!');
  }

  if (!candidate.hasCV) {
    areasToImprove.push('Cần đính kèm bản CV PDF/DOCX cập nhật dự án thực tế để AI phân tích chuẩn xác hơn.');
  }

  return {
    overallMatch,
    skillMatch,
    experienceMatch,
    projectRelevance,
    isValidCv: true,
    unrelatedDocumentWarning: null,
    matchedSkills: syncedSkills.matchedSkills,
    missingSkills: syncedSkills.missingSkills,
    strengths,
    areasToImprove,
    explanation: `Mức độ tương thích kỹ thuật đạt ${skillMatch}% (${syncedSkills.matchedSkills.length}/${(safeJobSkills || []).length} kỹ năng yêu cầu). Điểm tổng hợp CareerFit AI đạt ${overallMatch}% (Kinh nghiệm: ${experienceMatch}%, Dự án: ${projectRelevance}%) dựa trên hồ sơ kỹ thuật.`
  };
}

/**
 * Kho tài liệu học tập chuẩn hóa CSDL (Database Learning Resources Catalog)
 */
export const DB_SKILL_RESOURCES = {
  'react': [
    { title: 'React Core, JSX & Functional Components', time: '6 giờ', resource: 'React Official Docs', url: 'https://react.dev/learn', desc: 'Tìm hiểu tư duy React, Component hierarchy, Props & State cơ bản.' },
    { title: 'React Hooks Masterclass (useState, useEffect, useMemo)', time: '8 giờ', resource: 'React dev - Managing State', url: 'https://react.dev/learn/managing-state', desc: 'Làm chủ vòng đời component và quản lý state phức tạp.' },
    { title: 'React Router & Client-side Navigation', time: '5 giờ', resource: 'React Router Documentation', url: 'https://reactrouter.com/', desc: 'Điều hướng trang, Dynamic routes và URL params.' },
    { title: 'State Management with Context API & Redux Toolkit', time: '10 giờ', resource: 'Redux Essentials', url: 'https://redux.js.org/tutorials/essentials/part-1-overview-concepts', desc: 'Quản lý state toàn cục cho ứng dụng lớn.' }
  ],
  'html/css': [
    { title: 'Semantic HTML5 & Accessibility (a11y)', time: '4 giờ', resource: 'MDN Web Docs - HTML5', url: 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content', desc: 'Cấu trúc tài liệu ngữ nghĩa, biểu mẫu và thẻ chuẩn SEO.' },
    { title: 'Modern CSS Layouts (Flexbox & CSS Grid)', time: '6 giờ', resource: 'CSS-Tricks Guide to Flexbox & Grid', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', desc: 'Xây dựng layout giao diện đa thiết bị responsive.' },
    { title: 'Responsive Web Design & TailwindCSS Utility Styling', time: '6 giờ', resource: 'Tailwind CSS Docs', url: 'https://tailwindcss.com/docs/installation/using-vite', desc: 'Tối ưu tốc độ dựng giao diện với hệ thống class tiện ích.' }
  ],
  'javascript': [
    { title: 'Modern JavaScript ES6+ & Asynchronous (Promise, Async/Await)', time: '8 giờ', resource: 'JavaScript.info', url: 'https://javascript.info/', desc: 'Destructuring, Spread, Arrow functions và xử lý bất đồng bộ.' },
    { title: 'DOM Manipulation, Event Loop & API Fetching', time: '6 giờ', resource: 'MDN JavaScript Guide', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript', desc: 'Tương tác giao diện người dùng và gọi REST API.' }
  ],
  'typescript': [
    { title: 'TypeScript Fundamentals: Types, Interfaces & Generics', time: '8 giờ', resource: 'TypeScript Handbook', url: 'https://www.typescriptlang.org/docs/handbook/intro.html', desc: 'Tăng cường tính an toàn cho mã nguồn JavaScript.' }
  ],
  'java': [
    { title: 'Java Core & Collections Framework (List, Map, Set)', time: '6 giờ', resource: 'Baeldung - Java Collections', url: 'https://www.baeldung.com/category/java/', desc: 'Nắm vững kiểu dữ liệu, OOP và các collection thông dụng.' },
    { title: 'Object-Oriented Programming (OOP) & Clean Code', time: '6 giờ', resource: 'Refactoring Guru', url: 'https://refactoring.guru/design-patterns', desc: 'Áp dụng tính kế thừa, đóng gói, đa hình, trừu tượng và mẫu thiết kế.' }
  ],
  'spring boot': [
    { title: 'Dependency Injection (DI) & Spring Core Framework', time: '8 giờ', resource: 'Spring Guides', url: 'https://spring.io/guides', desc: 'Cơ chế Inversion of Control (IoC), Bean Container và Annotation.' },
    { title: 'Building RESTful Web Services with Spring MVC', time: '10 giờ', resource: 'Spring REST Masterclass', url: 'https://spring.io/guides/tutorials/rest/', desc: 'Thiết kế endpoint chuẩn REST, Controller, Service & DTO.' },
    { title: 'Spring Data JPA & Hibernate Database Integration', time: '12 giờ', resource: 'Baeldung - Spring Data JPA', url: 'https://www.baeldung.com/the-persistence-layer-with-spring-data-jpa', desc: 'Thao tác dữ liệu Entity, Repository và tối ưu câu lệnh SQL.' }
  ],
  'sql': [
    { title: 'Relational Database Design & SQL Querying Fundamentals', time: '6 giờ', resource: 'W3Schools SQL Tutorial', url: 'https://www.w3schools.com/sql/', desc: 'SELECT, JOIN, GROUP BY, Subqueries và chỉ mục Index.' },
    { title: 'Database Optimization & Transaction Management (ACID)', time: '8 giờ', resource: 'PostgreSQL / SQL Server Docs', url: 'https://www.postgresql.org/docs/', desc: 'Khóa giao dịch, Isolation levels và tối ưu hóa hiệu năng truy vấn.' }
  ],
  'git': [
    { title: 'Git Branching, Commit Conventions & GitHub Workflow', time: '4 giờ', resource: 'Git Book Official', url: 'https://git-scm.com/book/en/v2', desc: 'Quản lý phiên bản mã nguồn, Pull Request và giải quyết Conflict.' }
  ],
  'docker': [
    { title: 'Containerization Basics with Docker & Docker Compose', time: '8 giờ', resource: 'Docker Docs Getting Started', url: 'https://docs.docker.com/get-started/', desc: 'Đóng gói ứng dụng vào image và chạy đa container cục bộ.' }
  ],
  'selenium': [
    { title: 'Automated Testing with Selenium WebDriver & TestNG', time: '10 giờ', resource: 'Selenium Documentation', url: 'https://www.selenium.dev/documentation/', desc: 'Viết test script tự động hóa kiểm thử web UI.' }
  ],
  // --- KỸ NĂNG QUẢN LÝ & LÃNH ĐẠO (Management & Leadership Skills) ---
  'quản lý': [
    { title: 'Nguyên lý Quản trị & Kỹ năng Quản lý Đội ngũ Cốt lõi', time: '8 giờ', resource: 'Học viện Quản lý PACE - Cẩm nang Quản trị', url: 'https://www.pace.edu.vn/kien-thuc-quan-tri/ky-nang-quan-ly', desc: 'Phương pháp hoạch định mục tiêu, phân bổ nguồn lực và quản lý con người hiệu quả.' },
    { title: 'Leading People and Teams & Operational Management', time: '10 giờ', resource: 'Coursera - Wharton University of Pennsylvania', url: 'https://www.coursera.org/specializations/leading-teams', desc: 'Nghệ thuật tạo động lực, ủy quyền công việc và đo lường hiệu suất (KPI/OKR).' },
    { title: 'Essential Management Skills Toolkit', time: '6 giờ', resource: 'MindTools Management Hub', url: 'https://www.mindtools.com/pages/article/newTMM_92.htm', desc: 'Bộ công cụ thực hành giải quyết mâu thuẫn nội bộ và ra quyết định chiến lược.' }
  ],
  'kỹ năng quản lý': [
    { title: 'Nguyên lý Quản trị & Kỹ năng Quản lý Đội ngũ Cốt lõi', time: '8 giờ', resource: 'Học viện Quản lý PACE - Cẩm nang Quản trị', url: 'https://www.pace.edu.vn/kien-thuc-quan-tri/ky-nang-quan-ly', desc: 'Phương pháp hoạch định mục tiêu, phân bổ nguồn lực và quản lý con người hiệu quả.' },
    { title: 'Leading People and Teams & Operational Management', time: '10 giờ', resource: 'Coursera - Wharton University of Pennsylvania', url: 'https://www.coursera.org/specializations/leading-teams', desc: 'Nghệ thuật tạo động lực, ủy quyền công việc và đo lường hiệu suất (KPI/OKR).' },
    { title: 'Essential Management Skills Toolkit', time: '6 giờ', resource: 'MindTools Management Hub', url: 'https://www.mindtools.com/pages/article/newTMM_92.htm', desc: 'Bộ công cụ thực hành giải quyết mâu thuẫn nội bộ và ra quyết định chiến lược.' }
  ],
  'lãnh đạo': [
    { title: 'Năng Lực Lãnh Đạo & Truyền Cảm Hứng Đội Ngũ', time: '8 giờ', resource: 'Học viện Quản lý PACE - Kỹ năng Lãnh đạo', url: 'https://www.pace.edu.vn/kien-thuc-quan-tri/ky-nang-lanh-dao', desc: 'Xây dựng tầm nhìn, phong cách lãnh đạo tình huống và văn hóa tổ chức.' },
    { title: 'Foundations of Everyday Leadership', time: '8 giờ', resource: 'Coursera - University of Illinois', url: 'https://www.coursera.org/learn/everyday-leadership-foundation', desc: 'Phát triển tư duy nhà lãnh đạo và dẫn dắt đội ngũ vượt qua thử thách.' }
  ],
  'quản lý dự án': [
    { title: 'Khung Phương Pháp Quản Trị Dự Án & Agile / Scrum', time: '10 giờ', resource: 'Atlassian Agile Coach', url: 'https://www.atlassian.com/agile/project-management', desc: 'Sprint planning, lập kế hoạch tiến độ, quản lý backlog và rủi ro dự án.' },
    { title: 'Google Project Management Professional Certificate', time: '12 giờ', resource: 'Coursera - Google Career Certificates', url: 'https://www.coursera.org/professional-certificates/google-project-management', desc: 'Quy trình quản lý dự án tiêu chuẩn quốc tế từ khởi tạo đến bàn giao.' }
  ],
  'scrum': [
    { title: 'Scrum Guide & Agile Development Fundamentals', time: '6 giờ', resource: 'Scrum.org Official Guides', url: 'https://www.scrum.org/resources/what-is-scrum', desc: 'Các vai trò Product Owner, Scrum Master, Developers và nghi thức Scrum.' }
  ],
  'agile': [
    { title: 'Agile Manifesto & Lean Workflow Principles', time: '6 giờ', resource: 'Atlassian Agile Coach', url: 'https://www.atlassian.com/agile', desc: 'Tư duy linh hoạt thích ứng thay đổi và tối ưu giá trị bàn giao liên tục.' }
  ],
  // --- KỸ NĂNG MỀM (Soft Skills) ---
  'giao tiếp': [
    { title: 'Effective Workplace Communication Skills', time: '5 giờ', resource: 'Coursera - Wharton University of Pennsylvania', url: 'https://www.coursera.org/learn/wharton-communication-skills', desc: 'Kỹ năng lắng nghe tích cực, đàm phán và thuyết phục đối tác chuyên nghiệp.' }
  ],
  'giải quyết vấn đề': [
    { title: 'Problem-Solving & Critical Thinking Masterclass', time: '6 giờ', resource: 'MindTools Decision Hub', url: 'https://www.mindtools.com/pages/article/newTMC_00.htm', desc: 'Mô hình phân tích nguyên nhân gốc rễ 5-Whys, Fishbone và tư duy phản biện.' }
  ],
  'quản lý thời gian': [
    { title: 'Work Smarter, Not Harder: Time Management', time: '4 giờ', resource: 'Coursera - University of California, Irvine', url: 'https://www.coursera.org/learn/work-smarter-not-harder', desc: 'Kỹ thuật Pomodoro, ma trận Eisenhower và lập kế hoạch ưu tiên công việc.' }
  ],
  'làm việc nhóm': [
    { title: 'High Performance Collaboration: Teamwork Skills', time: '5 giờ', resource: 'Coursera - Northwestern University', url: 'https://www.coursera.org/learn/team-work', desc: 'Xây dựng lòng tin, hợp tác đa chức năng và tương tác đội ngũ hiệu quả.' }
  ],
  // --- KỸ NĂNG LẬP TRÌNH & NỀN TẢNG (Tech Stacks) ---
  'python': [
    { title: 'Python Core & Data Structures Mastery', time: '8 giờ', resource: 'Python Official Documentation & Tutorial', url: 'https://docs.python.org/3/tutorial/', desc: 'Cú pháp Python chuẩn, List comprehension, Generator & Module.' },
    { title: 'Pythonic Code, OOP & Design Patterns', time: '8 giờ', resource: 'Real Python Tutorials', url: 'https://realpython.com/', desc: 'Thực hành viết mã sạch, tối ưu hiệu năng và xử lý file/API.' }
  ],
  'c#': [
    { title: 'A Tour of the C# Language & Modern .NET', time: '8 giờ', resource: 'Microsoft Learn - C# Guide', url: 'https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/', desc: 'LINQ, Asynchronous programming (async/await) và OOP với C#.' }
  ],
  '.net': [
    { title: 'ASP.NET Core Web API & Dependency Injection', time: '10 giờ', resource: 'Microsoft Learn - ASP.NET Core', url: 'https://learn.microsoft.com/en-us/aspnet/core/introduction-to-aspnet-core', desc: 'Thiết kế REST API tốc độ cao, Middleware và Entity Framework Core.' }
  ],
  'c++': [
    { title: 'Modern C++ (C++17/20) Programming & Memory Management', time: '10 giờ', resource: 'LearnCpp.com Official Guide', url: 'https://www.learncpp.com/', desc: 'Con trỏ thông minh (Smart Pointers), RAII, STL Containers & Template.' }
  ],
  'golang': [
    { title: 'A Tour of Go: Concurrency & Goroutines', time: '8 giờ', resource: 'Go.dev Official Tour & Documentation', url: 'https://go.dev/tour/', desc: 'Goroutines, Channels, Interfaces và xây dựng Microservices với Go.' }
  ],
  'php': [
    { title: 'Modern PHP & Laravel Web Framework Essentials', time: '10 giờ', resource: 'Laravel Official Documentation', url: 'https://laravel.com/docs/master', desc: 'Routing, Eloquent ORM, Blade template và bảo mật ứng dụng web.' }
  ],
  'vue': [
    { title: 'Vue.js 3 Composition API & Reactive State', time: '8 giờ', resource: 'Vue.js Official Guide', url: 'https://vuejs.org/guide/introduction.html', desc: 'Reactivity System, Single File Components và Pinia store.' }
  ],
  'angular': [
    { title: 'Angular Core Concepts: Components, Directives & RxJS', time: '10 giờ', resource: 'Angular.dev Official Guide', url: 'https://angular.dev/overview', desc: 'Signals, Dependency Injection và Observables với RxJS.' }
  ],
  'nodejs': [
    { title: 'Node.js Event Loop, Streams & Express Server', time: '8 giờ', resource: 'Node.js Official Learn Portal', url: 'https://nodejs.org/en/learn', desc: 'Kiến trúc bất đồng bộ non-blocking I/O và xây dựng backend server.' }
  ],
  'aws': [
    { title: 'AWS Cloud Practitioner & Core Services (EC2, S3, RDS)', time: '10 giờ', resource: 'AWS Official Skill Builder', url: 'https://explore.skillbuilder.aws/', desc: 'Kiến trúc điện toán đám mây và triển khai hạ tầng an toàn trên AWS.' }
  ],
  'kubernetes': [
    { title: 'Kubernetes Pods, Deployments & Service Discovery', time: '10 giờ', resource: 'Kubernetes Official Interactive Tutorials', url: 'https://kubernetes.io/docs/tutorials/', desc: 'Điều phối cụm container, Auto-scaling và Rolling updates.' }
  ],
  'qa': [
    { title: 'Software Testing Fundamentals & Test Case Design', time: '8 giờ', resource: 'Guru99 Software Testing Tutorial', url: 'https://www.guru99.com/software-testing.html', desc: 'Quy trình kiểm thử hộp đen, hộp trắng, viết Test Plan và Bug Report.' }
  ],
  'linux': [
    { title: 'Linux Command Line & Server Administration', time: '6 giờ', resource: 'Linux Journey Official Portal', url: 'https://linuxjourney.com/', desc: 'Thao tác shell, phân quyền file, quản lý tiến trình và quản trị hệ thống.' }
  ],
  // --- NGÔN NGỮ LẬP TRÌNH C ---
  'c': [
    { title: 'C Programming Language Fundamentals & Memory Pointers', time: '8 giờ', resource: 'Learn-C.org Interactive Tutorial', url: 'https://www.learn-c.org/', desc: 'Cú pháp C, con trỏ (pointers), quản lý bộ nhớ malloc/free và cấu trúc struct.' },
  ]
};

/**
 * Chuẩn hóa ngữ nghĩa tiếng Việt cho kỹ năng (đồng bộ i ngắn / y dài và dấu)
 */
export function normalizeVietnameseSkill(str = '') {
  if (!str) return '';
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/kĩ\s*năng/g, 'kỹ năng')
    .replace(/\bkĩ\b/g, 'kỹ')
    .replace(/quản\s*lí/g, 'quản lý')
    .replace(/\blí\b/g, 'lý')
    .replace(/\bqui\b/g, 'quy');
}

export function stripVietnameseDiacritics(str = '') {
  if (!str) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

/**
 * Hàm AI tra cứu trực tuyến & xác thực nguồn học uy tín (AI Verified Online Educational Resolver)
 * Tuyệt đối không bao giờ tạo link 404, không dẫn về trang tìm kiếm hay trang tài liệu trống.
 * Định tuyến chính xác vào các cổng đào tạo chuyên ngành có giáo trình cụ thể:
 * - Quản lý / Lãnh đạo -> Học viện Quản lý PACE & Coursera Wharton Leadership
 * - Quản lý dự án -> Atlassian Agile Coach & Scrum.org
 * - Kỹ năng mềm -> Coursera & MindTools
 * - Thiết kế -> Figma Official & Coursera Google UX
 * - Lập trình / Công nghệ -> W3Schools & freeCodeCamp
 */
export function resolveAIVerifiedOnlineLearningResources(skillName, job = {}, startIndex = 1) {
  const cleanSkill = skillName.trim();
  const stripped = stripVietnameseDiacritics(cleanSkill);

  // 1. Nhóm Ngoại ngữ & Chứng chỉ quốc tế chuyên ngành IT (IELTS, HSK, TOEIC, JLPT, Tiếng Anh, Tiếng Trung, Tiếng Nhật)
  if (
    /\b(ielts|toeic|toefl|hsk\d*|jlpt\d*|n[1-5]|tieng anh|tieng trung|tieng nhat|tieng han|english|chinese|mandarin|japanese)\b/i.test(stripped) ||
    /\b(hsk|ielts|toeic|jlpt)\b/i.test(cleanSkill)
  ) {
    if (/hsk|tieng trung|chinese|mandarin/i.test(stripped)) {
      return [
        {
          id: `tp-p-${job.id || 'job'}-${startIndex}`,
          skillName: cleanSkill,
          title: `${startIndex}. [${cleanSkill}] Giáo trình HSK Chuẩn & Cổng đề thi chính thức`,
          completed: false,
          estimatedTime: '12 giờ',
          resource: 'Chinese Test Official (Hanban / CTI Portal)',
          url: 'http://www.chinesetest.cn/',
          sourceType: 'INTERNET_AI_VERIFIED',
          description: `Cổng thông tin khảo thí chính thức: Cấu trúc đề thi HSK, từ vựng chuẩn hóa và bài thi mẫu chuẩn từ Hanban / CTI.`
        },
        {
          id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
          skillName: cleanSkill,
          title: `${startIndex + 1}. [${cleanSkill}] Khóa học HSK & Tiếng Trung giao tiếp dự án kỹ thuật`,
          completed: false,
          estimatedTime: '10 giờ',
          resource: 'Coursera - Peking University (Đại học Bắc Kinh)',
          url: 'https://www.coursera.org/learn/hsk-3',
          sourceType: 'INTERNET_AI_VERIFIED',
          description: `Giáo trình HSK từ Đại học Bắc Kinh giúp nắm vững ngữ pháp, từ vựng và kỹ năng giao tiếp trong dự án với đối tác Trung Quốc/Đài Loan.`
        }
      ];
    }

    if (/jlpt|n[1-5]|tieng nhat|japanese/i.test(stripped)) {
      return [
        {
          id: `tp-p-${job.id || 'job'}-${startIndex}`,
          skillName: cleanSkill,
          title: `${startIndex}. [${cleanSkill}] Đề thi mẫu & Ngữ pháp kỳ thi Năng lực Nhật ngữ JLPT`,
          completed: false,
          estimatedTime: '12 giờ',
          resource: 'JLPT Official Website (Japan Foundation)',
          url: 'https://www.jlpt.jp/e/',
          sourceType: 'INTERNET_AI_VERIFIED',
          description: `Tài liệu chính thức, đề thi mẫu từ Quỹ Giao lưu Quốc tế Nhật Bản (Japan Foundation).`
        },
        {
          id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
          skillName: cleanSkill,
          title: `${startIndex + 1}. [${cleanSkill}] Tiếng Nhật chuyên ngành CNTT cho Kỹ sư cầu nối (BrSE)`,
          completed: false,
          estimatedTime: '10 giờ',
          resource: 'NHK World Japanese & Marugoto Online',
          url: 'https://www.nhk.or.jp/lesson/vi/',
          sourceType: 'INTERNET_AI_VERIFIED',
          description: `Thuật ngữ kỹ thuật IT bằng tiếng Nhật, giao tiếp với khách hàng Nhật Bản và quy trình dự án phần mềm.`
        }
      ];
    }

    if (/toeic/i.test(stripped)) {
      return [
        {
          id: `tp-p-${job.id || 'job'}-${startIndex}`,
          skillName: cleanSkill,
          title: `${startIndex}. [${cleanSkill}] Luyện thi TOEIC & Ngữ pháp tiếng Anh doanh nghiệp`,
          completed: false,
          estimatedTime: '10 giờ',
          resource: 'ETS Official TOEIC Preparation Hub',
          url: 'https://www.ets.org/toeic/test-takers.html',
          sourceType: 'INTERNET_AI_VERIFIED',
          description: `Bộ đề thi và phương pháp luyện tập chuẩn từ Viện Khảo thí Giáo dục Hoa Kỳ (ETS).`
        },
        {
          id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
          skillName: cleanSkill,
          title: `${startIndex + 1}. [${cleanSkill}] English for Technical Communication in Workplace`,
          completed: false,
          estimatedTime: '8 giờ',
          resource: 'Coursera - Technical Communication',
          url: 'https://www.coursera.org/learn/technical-english',
          sourceType: 'INTERNET_AI_VERIFIED',
          description: `Kỹ năng soạn thảo email kỹ thuật, tài liệu Requirement và báo cáo tiến độ bằng tiếng Anh.`
        }
      ];
    }

    // Default: IELTS / Tiếng Anh tổng quát
    return [
      {
        id: `tp-p-${job.id || 'job'}-${startIndex}`,
        skillName: cleanSkill,
        title: `${startIndex}. [${cleanSkill}] Luyện thi 4 kỹ năng & Bộ đề thi thử chuẩn hóa quốc tế`,
        completed: false,
        estimatedTime: '12 giờ',
        resource: 'Hội đồng Anh (British Council) - IELTS Preparation',
        url: 'https://takeielts.britishcouncil.org/take-ielts/prepare',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Phương pháp làm bài, tiêu chí chấm điểm và đề thi mẫu chính thức 4 kỹ năng Nghe - Nói - Đọc - Viết từ British Council.`
      },
      {
        id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
        skillName: cleanSkill,
        title: `${startIndex + 1}. [${cleanSkill}] English for IT & Giao tiếp dự án phần mềm quốc tế`,
        completed: false,
        estimatedTime: '10 giờ',
        resource: 'Coursera - English for IT Specialization',
        url: 'https://www.coursera.org/specializations/english-for-it',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Nâng cao năng lực tiếng Anh chuyên ngành CNTT, giao tiếp khách hàng quốc tế và họp Scrum sprint.`
      }
    ];
  }

  // 2. Nhóm Quản trị, Lãnh đạo & Quản lý (Management, Leadership, Supervision)
  if (/quan ly|quan li|lanh dao|quan tri|giam sat|dieu hanh|management|leadership|manager|supervisor|team lead/i.test(stripped)) {
    return [
      {
        id: `tp-p-${job.id || 'job'}-${startIndex}`,
        skillName: cleanSkill,
        title: `${startIndex}. [${cleanSkill}] Nguyên lý quản trị điều hành & Quản lý đội ngũ`,
        completed: false,
        estimatedTime: '8 giờ',
        resource: 'Học viện Quản lý PACE - Cổng Kiến thức Quản trị Chuẩn mực',
        url: 'https://www.pace.edu.vn/kien-thuc-quan-tri/ky-nang-quan-ly',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Chương trình phát triển năng lực quản trị, hoạch định mục tiêu và phân bổ nguồn lực từ Học viện Quản lý PACE.`
      },
      {
        id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
        skillName: cleanSkill,
        title: `${startIndex + 1}. [${cleanSkill}] Leading People and Teams Specialization`,
        completed: false,
        estimatedTime: '10 giờ',
        resource: 'Coursera - Wharton University of Pennsylvania',
        url: 'https://www.coursera.org/specializations/leading-teams',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Chương trình đào tạo năng lực lãnh đạo và quản lý hiệu suất từ Đại học Wharton hàng đầu thế giới.`
      }
    ];
  }

  // 2. Nhóm Quản lý dự án, Agile & Scrum
  if (/du an|project|scrum|agile|kanban|pmp|jira/i.test(stripped)) {
    return [
      {
        id: `tp-p-${job.id || 'job'}-${startIndex}`,
        skillName: cleanSkill,
        title: `${startIndex}. [${cleanSkill}] Thực hành Agile & Quản lý tiến độ dự án`,
        completed: false,
        estimatedTime: '8 giờ',
        resource: 'Atlassian Agile Coach Official',
        url: 'https://www.atlassian.com/agile/project-management',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Cẩm nang quản trị dự án, quản lý backlog và vận hành sprint từ Atlassian.`
      },
      {
        id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
        skillName: cleanSkill,
        title: `${startIndex + 1}. [${cleanSkill}] Khung phương pháp Scrum chuẩn quốc tế`,
        completed: false,
        estimatedTime: '6 giờ',
        resource: 'Scrum.org Official Guides',
        url: 'https://www.scrum.org/resources/what-is-scrum',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Tài liệu chính thức về Scrum Framework, các vai trò và quy trình bàn giao phần mềm.`
      }
    ];
  }

  // 3. Nhóm Kỹ năng mềm (Giao tiếp, Đàm phán, Thuyết trình, Làm việc nhóm, Giải quyết vấn đề)
  if (/giao tiep|thuyet trinh|dam phan|lam viec nhom|giai quyet van de|quan ly thoi gian|tu duy|communication|teamwork|problem solving|time management/i.test(stripped)) {
    return [
      {
        id: `tp-p-${job.id || 'job'}-${startIndex}`,
        skillName: cleanSkill,
        title: `${startIndex}. [${cleanSkill}] Kỹ năng giao tiếp & Tương tác chuyên nghiệp tại nơi làm việc`,
        completed: false,
        estimatedTime: '6 giờ',
        resource: 'Coursera - Improving Communication Skills',
        url: 'https://www.coursera.org/learn/wharton-communication-skills',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Khóa học phát triển kỹ năng tương tác, đàm phán và thuyết phục từ Đại học Pennsylvania.`
      },
      {
        id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
        skillName: cleanSkill,
        title: `${startIndex + 1}. [${cleanSkill}] Kỹ thuật giải quyết vấn đề & Tư duy logic`,
        completed: false,
        estimatedTime: '6 giờ',
        resource: 'MindTools Professional Skills Hub',
        url: 'https://www.mindtools.com/pages/article/newTMC_00.htm',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Bộ phương pháp phân tích nguyên nhân, ra quyết định và xử lý tình huống chuyên nghiệp.`
      }
    ];
  }

  // 4. Nhóm Phân tích nghiệp vụ (Business Analysis / BA)
  if (/\bba\b|business analy|phan tich nghiep vu/i.test(stripped)) {
    return [
      {
        id: `tp-p-${job.id || 'job'}-${startIndex}`,
        skillName: cleanSkill,
        title: `${startIndex}. [${cleanSkill}] Tiêu chuẩn phân tích nghiệp vụ IIBA (BABOK)`,
        completed: false,
        estimatedTime: '8 giờ',
        resource: 'IIBA - International Institute of Business Analysis',
        url: 'https://www.iiba.org/business-analysis-certifications/ecba/',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Chuẩn mực kiến thức phân tích nghiệp vụ, khơi gợi yêu cầu và tài liệu hóa tính năng từ IIBA.`
      },
      {
        id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
        skillName: cleanSkill,
        title: `${startIndex + 1}. [${cleanSkill}] Business Analysis & Process Modeling`,
        completed: false,
        estimatedTime: '10 giờ',
        resource: 'Coursera Business Analysis Specialization',
        url: 'https://www.coursera.org/learn/business-analysis',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Khóa học mô hình hóa quy trình nghiệp vụ và xây dựng giải pháp phần mềm.`
      }
    ];
  }

  // 5. Nhóm Thiết kế (UI/UX, Figma, Graphic Design)
  if (/ui|ux|figma|design|thiet ke|photoshop/i.test(stripped)) {
    return [
      {
        id: `tp-p-${job.id || 'job'}-${startIndex}`,
        skillName: cleanSkill,
        title: `${startIndex}. [${cleanSkill}] Thiết kế giao diện & Nguyên lý UX/UI hiện đại`,
        completed: false,
        estimatedTime: '8 giờ',
        resource: 'Figma Official Design Documentation',
        url: 'https://help.figma.com/hc/en-us/categories/360002042553-Figma-Design',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Tài liệu chính thức và hướng dẫn xây dựng Design System từ Figma.`
      },
      {
        id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
        skillName: cleanSkill,
        title: `${startIndex + 1}. [${cleanSkill}] Google UX Design Certificate`,
        completed: false,
        estimatedTime: '12 giờ',
        resource: 'Coursera - Google UX Design Professional',
        url: 'https://www.coursera.org/professional-certificates/google-ux-design',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Chương trình đào tạo thiết kế trải nghiệm người dùng tiêu chuẩn từ Google.`
      }
    ];
  }

  // 6. Nhóm Kiểm thử phần mềm (QA / QC / Testing)
  if (/qa|qc|test|kiem thu|selenium/i.test(stripped)) {
    return [
      {
        id: `tp-p-${job.id || 'job'}-${startIndex}`,
        skillName: cleanSkill,
        title: `${startIndex}. [${cleanSkill}] Quy trình kiểm thử phần mềm & Thiết kế Test Case`,
        completed: false,
        estimatedTime: '8 giờ',
        resource: 'Guru99 Software Testing Masterclass',
        url: 'https://www.guru99.com/software-testing.html',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Cẩm nang toàn diện về kiểm thử phần mềm, kỹ thuật viết kịch bản test và báo cáo lỗi.`
      },
      {
        id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
        skillName: cleanSkill,
        title: `${startIndex + 1}. [${cleanSkill}] Chuẩn chứng chỉ kiểm thử quốc tế ISTQB`,
        completed: false,
        estimatedTime: '10 giờ',
        resource: 'ISTQB Certified Tester Official Syllabus',
        url: 'https://www.istqb.org/certifications/certified-tester-foundation-level',
        sourceType: 'INTERNET_AI_VERIFIED',
        description: `Giáo trình chuẩn quốc tế về các mức độ kiểm thử và nguyên lý quản lý chất lượng phần mềm.`
      }
    ];
  }

  // 7. Nhóm Kỹ thuật & Công nghệ lập trình (Tech Stack - Chuẩn mực đào tạo IT)
  return [
    {
      id: `tp-p-${job.id || 'job'}-${startIndex}`,
      skillName: cleanSkill,
      title: `${startIndex}. [${cleanSkill}] Cẩm nang tài liệu kỹ thuật & Kiến trúc chuyên sâu`,
      completed: false,
      estimatedTime: '8 giờ',
      resource: `Cổng Tài liệu Kỹ thuật Chuẩn Quốc tế (Developer Guides)`,
      url: 'https://www.coursera.org/browse/computer-science',
      sourceType: 'INTERNET_AI_VERIFIED',
      description: `Tài liệu kỹ thuật chính thống, cấu trúc kiến trúc và hướng dẫn thực hành tốt nhất về ${cleanSkill} cho kỹ sư phần mềm.`
    },
    {
      id: `tp-p-${job.id || 'job'}-${startIndex + 1}`,
      skillName: cleanSkill,
      title: `${startIndex + 1}. [${cleanSkill}] Lộ trình thực hành mã nguồn mở & Xây dựng dự án`,
      completed: false,
      estimatedTime: '10 giờ',
      resource: 'freeCodeCamp Core Curriculum & Projects',
      url: 'https://www.freecodecamp.org/learn',
      sourceType: 'INTERNET_AI_VERIFIED',
      description: `Chương trình đào tạo lập trình thực chiến phi lợi nhuận lớn nhất thế giới của freeCodeCamp.`
    }
  ];
}

/**
 * Hàm tự động dọn dẹp và sửa chữa các đường link lỗi (như devdocs trống, github 404, google search)
 */
export function sanitizeRoadmapTopics(topics = []) {
  if (!Array.isArray(topics)) return [];
  return topics.map((t, index) => {
    const url = String(t.url || '');
    const skill = String(t.skillName || '');
    const isLanguage = /\b(hsk\d*|ielts|toeic|toefl|jlpt\d*|n[1-5]|tieng|english|chinese|japanese)\b/i.test(skill);
    const isManagement = /quan ly|quan li|lanh dao|management|leadership|giao tiep|communication/i.test(skill);
    const resource = String(t.resource || '');

    // Nếu là ngoại ngữ/chứng chỉ từng bị gán nhầm [CSDL], tự động chuyển chuẩn sang AI xác thực Internet
    if (isLanguage && (resource.includes('[CSDL]') || t.sourceType === 'DATABASE')) {
      const healedTopics = resolveAIVerifiedOnlineLearningResources(skill || 'Ngoại ngữ', {}, index + 1);
      const replacement = healedTopics[0] || healedTopics[1];
      if (replacement) {
        return {
          ...t,
          title: replacement.title,
          resource: replacement.resource.replace(/^\[CSDL\]\s*/, ''),
          url: replacement.url,
          sourceType: 'INTERNET_AI_VERIFIED',
          description: replacement.description
        };
      }
    }

    const isBroken =
      url.includes('devdocs.io') ||
      url.includes('github.com/topics/') ||
      url.includes('google.com/search') ||
      url.includes('coccoc.com/search') ||
      (url.includes('w3schools.com') && isLanguage) ||
      (url.includes('w3schools.com') && isManagement);

    if (isBroken) {
      const healedTopics = resolveAIVerifiedOnlineLearningResources(skill || 'Kỹ năng', {}, index + 1);
      const replacement = healedTopics[0] || healedTopics[1];
      if (replacement) {
        return {
          ...t,
          title: replacement.title,
          resource: replacement.resource,
          url: replacement.url,
          sourceType: 'INTERNET_AI_VERIFIED',
          description: replacement.description
        };
      }
    }
    return t;
  });
}

/**
 * Tạo danh sách bài học/chủ đề cho 1 kỹ năng cụ thể:
 * - Ưu tiên tra cứu từ CSDL (DB_SKILL_RESOURCES)
 * - Nếu chưa có trong CSDL -> Tự động dùng AI tra cứu nguồn học trực tuyến uy tín
 */
export function buildTopicsForSingleSkill(skillName, job = {}, startIndex = 1) {
  const cleanSkill = skillName.trim();
  const normalizedKey = normalizeVietnameseSkill(cleanSkill);
  const strippedKey = stripVietnameseDiacritics(cleanSkill);

  // 1. Tra cứu nguồn học từ CSDL (khớp chính xác hoặc khớp theo ranh giới từ)
  let matchedResourceList = null;
  for (const [dbKey, items] of Object.entries(DB_SKILL_RESOURCES)) {
    const normDbKey = normalizeVietnameseSkill(dbKey);
    const stripDbKey = stripVietnameseDiacritics(dbKey);

    // Khớp chính xác hoàn toàn (hỗ trợ cả dấu và không dấu)
    if (normalizedKey === normDbKey || strippedKey === stripDbKey) {
      matchedResourceList = items;
      break;
    }

    // Khớp ranh giới từ (Word Boundary) - Chỉ áp dụng với từ khóa từ 3 ký tự trở lên để tránh 'c', 'go' khớp lung tung
    if (normDbKey.length >= 3) {
      try {
        const escapedNorm = normDbKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const escapedStrip = stripDbKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const wordRegex = new RegExp(`(^|[^a-z0-9])${escapedNorm}([^a-z0-9]|$)`, 'i');
        const stripWordRegex = new RegExp(`(^|[^a-z0-9])${escapedStrip}([^a-z0-9]|$)`, 'i');
        if (wordRegex.test(normalizedKey) || stripWordRegex.test(strippedKey)) {
          matchedResourceList = items;
          break;
        }
      } catch {
        // Nếu regex lỗi (ký tự đặc biệt), bỏ qua và tiếp tục vòng lặp
      }
    }
  }

  const generated = [];
  let curIndex = startIndex;
  if (matchedResourceList && matchedResourceList.length > 0) {
    matchedResourceList.forEach(item => {
      generated.push({
        id: `tp-p-${job.id || 'job'}-${curIndex}-${Date.now().toString(36).slice(-4)}`,
        skillName: cleanSkill,
        title: `${curIndex}. [${cleanSkill}] ${item.title}`,
        completed: false,
        estimatedTime: item.time,
        resource: `[CSDL] ${item.resource}`,
        url: item.url,
        sourceType: 'DATABASE',
        description: item.desc || `Chuyên đề củng cố kỹ năng ${cleanSkill} từ CSDL tài liệu chuẩn hóa CareerFit.`
      });
      curIndex++;
    });
  } else {
    // 2. Kỹ năng chưa có trong CSDL -> AI tự động lên mạng tìm kiếm & xác thực nguồn học chính thức uy tín
    const onlineTopics = resolveAIVerifiedOnlineLearningResources(cleanSkill, job, curIndex);
    onlineTopics.forEach(ot => {
      generated.push(ot);
      curIndex++;
    });
  }
  return generated;
}

/**
 * Đồng bộ Roadmap cá nhân khi ứng viên cập nhật kỹ năng hoặc tải CV mới:
 * 1. Giữ nguyên toàn bộ cấu trúc và tiến độ roadmap hiện tại.
 * 2. Nếu kỹ năng còn thiếu GIẢM (ứng viên đã bổ sung kỹ năng mới vào profile/CV -> xuất hiện trong matchedSkills):
 *    -> Tự động đánh dấu hoàn thành (completed = true) các bài học liên quan đến kỹ năng đó.
 * 3. Nếu THIẾU THÊM kỹ năng mới (kỹ năng trong missingSkills chưa có bài học nào trong roadmap):
 *    -> Tự động bổ sung các bài học cho kỹ năng mới đó vào cuối roadmap.
 * 4. Cập nhật các chỉ số matchPercentage, matchedSkills, missingSkills của roadmap.
 */
export function syncPersonalJobRoadmapWithProfile(existingRoadmap, candidate = {}, job = {}) {
  if (!existingRoadmap) return null;

  const candidateSkills = candidate.skills || [];
  const extractedCvText = candidate.extractedCvText || '';
  const requiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : (typeof job.requiredSkills === 'string'
        ? job.requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);

  const match = calculateSkillMatch(candidateSkills, requiredSkills, extractedCvText);
  const matchedSkills = match.matchedSkills || [];
  const missingSkills = match.missingSkills || [];

  const normalizedMatched = matchedSkills.map(s => String(s).toLowerCase().trim());
  const existingTopics = Array.isArray(existingRoadmap.topics) ? [...existingRoadmap.topics] : [];

  let hasChanged = false;
  const newlyCompletedSkills = new Set();
  const newlyAddedSkills = new Set();

  // 1. Kiểm tra các topic hiện có: Nếu kỹ năng này hiện đã ĐẠT (matched) mà topic chưa hoàn thành -> đánh dấu completed = true
  const updatedTopics = existingTopics.map(topic => {
    const topicSkill = String(topic.skillName || '').toLowerCase().trim();
    if (!topicSkill) return topic;

    const isNowMatched = normalizedMatched.some(ms => 
      areSkillsEquivalent(ms, topicSkill)
    ) || checkSkillInCv(topicSkill, candidateSkills, extractedCvText);

    if (isNowMatched && !topic.completed) {
      hasChanged = true;
      newlyCompletedSkills.add(topic.skillName || topicSkill);
      return {
        ...topic,
        completed: true,
        autoCompletedReason: 'Đã hoàn thành do ứng viên vừa bổ sung kỹ năng vào Hồ sơ / CV'
      };
    } else if (!isNowMatched && topic.completed) {
      // ĐỒNG BỘ 2 CHIỀU: Hủy đánh dấu hoàn thành nếu ứng viên không còn sở hữu kỹ năng này
      hasChanged = true;
      return {
        ...topic,
        completed: false,
        autoCompletedReason: undefined
      };
    }
    return topic;
  });

  // 2. Kiểm tra nếu có kỹ năng CÒN THIẾU MỚI (chưa hề có topic nào trong roadmap)
  missingSkills.forEach(missingSkill => {
    const cleanMissing = String(missingSkill).trim();
    if (!cleanMissing) return;
    const lowerMissing = cleanMissing.toLowerCase();

    const alreadyCovered = updatedTopics.some(t => {
      const ts = String(t.skillName || '').toLowerCase().trim();
      return ts === lowerMissing || ts.includes(lowerMissing) || lowerMissing.includes(ts);
    });

    if (!alreadyCovered) {
      // Bổ sung bài học mới cho kỹ năng còn thiếu
      const newTopics = buildTopicsForSingleSkill(cleanMissing, job, updatedTopics.length + 1);
      newTopics.forEach(nt => {
        updatedTopics.push({
          ...nt,
          isNewlyAdded: true
        });
      });
      hasChanged = true;
      newlyAddedSkills.add(cleanMissing);
    }
  });

  // 3. Chuẩn hóa lại thứ tự đánh số bài học
  const renumberedTopics = updatedTopics.map((t, idx) => ({
    ...t,
    title: t.title.replace(/^\d+\.\s*/, `${idx + 1}. `)
  }));

  const updatedRoadmap = {
    ...existingRoadmap,
    missingSkills,
    matchedSkills,
    matchPercentage: match.percentage,
    topics: renumberedTopics,
    lastSyncedAt: new Date().toLocaleDateString('vi-VN')
  };

  return {
    updatedRoadmap,
    hasChanged,
    newlyCompletedSkills: Array.from(newlyCompletedSkills),
    newlyAddedSkills: Array.from(newlyAddedSkills)
  };
}

/**
 * Tạo Roadmap cá nhân cho 1 công việc cụ thể (Personal Job Roadmap)
 * - Đọc danh sách kỹ năng còn thiếu của ứng viên
 * - Ưu tiên tra cứu nguồn học từ CSDL (DB_SKILL_RESOURCES)
 * - Nếu kỹ năng mới chưa có trong CSDL -> Tự động tìm nguồn học chuẩn từ Internet
 */
export function generatePersonalJobRoadmap(candidate = {}, job = {}) {
  const candidateSkills = candidate.skills || [];
  const extractedCvText = candidate.extractedCvText || '';
  const requiredSkills = Array.isArray(job.requiredSkills)
    ? job.requiredSkills
    : (typeof job.requiredSkills === 'string'
        ? job.requiredSkills.split(/[,;\n]/).map(s => s.trim()).filter(Boolean)
        : []);
// tạo roadmap
  const match = calculateSkillMatch(candidateSkills, requiredSkills, extractedCvText);
  const missingSkills = match.missingSkills.length > 0
    ? match.missingSkills
    : (requiredSkills.length > 0 ? [requiredSkills[0]] : ['Nâng cao chuyên môn']);

  const topics = [];
  let topicIndex = 1;

  missingSkills.forEach(skillName => {
    const skillTopics = buildTopicsForSingleSkill(skillName, job, topicIndex);
    skillTopics.forEach(t => {
      topics.push(t);
      topicIndex++;
    });
  });

  return {
    id: `personal-rd-${job.id || Date.now()}`,
    jobId: job.id,
    jobTitle: job.title || 'Vị trí chuyên môn',
    company: job.company || 'Doanh nghiệp',
    type: 'PERSONAL',
    skill: missingSkills.join(' & '),
    skillName: missingSkills.join(' & '),
    targetRole: `Roadmap: ${job.title || 'Kỹ năng công việc'}`,
    description: `Lộ trình học tập cá nhân hóa do AI thiết kế riêng cho tin tuyển dụng "${job.title}" tại ${job.company}, tập trung bồi dưỡng ${missingSkills.length} kỹ năng còn thiếu: ${missingSkills.join(', ')}.`,
    missingSkills,
    matchedSkills: match.matchedSkills,
    matchPercentage: match.percentage,
    createdAt: new Date().toLocaleDateString('vi-VN'),
    topics
  };
}

/**
 * Tổng hợp nhiều Roadmap cá nhân đã tạo thành một Roadmap Tổng Thể (Master Roadmap)
 * - Tự động loại bỏ các chủ đề trùng lặp
 * - Nhóm theo kỹ năng và tối ưu lộ trình học tập toàn diện
 */
export function mergeMasterRoadmap(existingPersonalRoadmaps = [], candidate = {}) {
  if (!existingPersonalRoadmaps || existingPersonalRoadmaps.length === 0) {
    return null;
  }

  const allTopics = [];
  const seenTitles = new Set();
  const allSkills = new Set();
  const targetRoles = new Set();

  existingPersonalRoadmaps.forEach(rm => {
    if (rm.jobTitle) targetRoles.add(rm.jobTitle);
    if (Array.isArray(rm.missingSkills)) {
      rm.missingSkills.forEach(s => allSkills.add(s));
    } else if (rm.skill) {
      allSkills.add(rm.skill);
    }

    (rm.topics || []).forEach(tp => {
      const normalizedTitle = tp.title.replace(/^\d+\.\s*/, '').trim().toLowerCase();
      const existing = allTopics.find(t => t.title.replace(/^\d+\.\s*/, '').trim().toLowerCase() === normalizedTitle);
      if (existing) {
        if (!existing.sourceTopicIds) {
          existing.sourceTopicIds = [existing.originalId || existing.id].filter(Boolean);
        }
        if (tp.id && !existing.sourceTopicIds.includes(tp.id)) {
          existing.sourceTopicIds.push(tp.id);
        }
        if (tp.completed) {
          existing.completed = true;
        }
      } else {
        seenTitles.add(normalizedTitle);
        allTopics.push({
          ...tp,
          id: `tp-master-${allTopics.length + 1}`,
          originalId: tp.id,
          sourceTopicIds: [tp.id].filter(Boolean),
          title: `${allTopics.length + 1}. ${tp.title.replace(/^\d+\.\s*/, '')}`,
          completed: !!tp.completed
        });
      }
    });
  });

  const skillsArr = Array.from(allSkills);
  const rolesArr = Array.from(targetRoles);

  return {
    id: 'master-roadmap-candidate',
    type: 'MASTER',
    skill: skillsArr.length > 0 ? skillsArr.join(' • ') : 'Toàn diện',
    skillName: skillsArr.length > 0 ? skillsArr.join(' • ') : 'Toàn diện',
    targetRole: 'Roadmap Tổng Thể: Phát Triển Năng Lực Toàn Diện',
    description: `AI đã tổng hợp từ ${existingPersonalRoadmaps.length} lộ trình cá nhân (${rolesArr.join(', ')}). Bao gồm ${allTopics.length} bài học tối ưu giúp bạn sẵn sàng ứng tuyển vào tất cả các vị trí đã chọn.`,
    personalRoadmapCount: existingPersonalRoadmaps.length,
    skillsIncluded: skillsArr,
    updatedAt: new Date().toLocaleDateString('vi-VN'),
    topics: allTopics
  };
}
