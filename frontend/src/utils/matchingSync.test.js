import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSkillMatch,
  generateAIDeepAnalysis,
  synchronizeMatchedSkills,
  inspectResumeValidity,
  syncPersonalJobRoadmapWithProfile
} from './matching.js';

test('inspectResumeValidity detects meeting minutes correctly', () => {
  const meetingMinutesText = `
    CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
    BIÊN BẢN CUỘC HỌP GIAO BAN
    Thời gian: 08:30 ngày 20/10/2026
    Chủ tọa: Nguyễn Văn A
    Thư ký cuộc họp: Trần Thị B
    Nội dung cuộc họp: Thảo luận kế hoạch triển khai quý 4.
  `;
  const result = inspectResumeValidity(meetingMinutesText);
  assert.equal(result.isInvalid, true);
  assert.equal(result.detectedType, 'Biên bản cuộc họp');
});

test('synchronizeMatchedSkills ensures profile skills are always matched and never missing', () => {
  const candidate = {
    skills: ['Java']
  };
  const job = {
    requiredSkills: ['Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'Docker', 'Git']
  };
  const aiReturnedMatched = [];
  const aiReturnedMissing = ['Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'Docker', 'Git'];

  const synced = synchronizeMatchedSkills(aiReturnedMatched, aiReturnedMissing, candidate, job);

  assert.deepEqual(synced.matchedSkills, ['Java']);
  assert.deepEqual(synced.missingSkills, ['Spring Boot', 'SQL', 'PostgreSQL', 'Docker', 'Git']);
  assert.equal(synced.missingSkills.includes('Java'), false);
});

test('generateAIDeepAnalysis preserves matched profile skills when CV is meeting minutes', () => {
  const candidate = {
    skills: ['Java'],
    extractedCvText: `
      CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
      BIÊN BẢN CUỘC HỌP
      Chủ tọa: Nguyễn Văn A
      Thư ký cuộc họp: Trần Thị B
      Nội dung cuộc họp: Báo cáo công tác văn phòng.
    `
  };
  const job = {
    title: 'Java Backend Engineer',
    company: 'Tech Corp',
    requiredSkills: ['Java', 'Spring Boot', 'SQL', 'PostgreSQL', 'Docker', 'Git']
  };

  const analysis = generateAIDeepAnalysis(candidate, job);

  // Document validity
  assert.equal(analysis.isValidCv, false);
  assert.equal(analysis.documentType, 'Biên bản cuộc họp');

  // Metrics remain 0% as expected for non-IT document
  assert.equal(analysis.overallMatch, 0);
  assert.equal(analysis.experienceMatch, 0);
  assert.equal(analysis.projectRelevance, 0);

  // BUT Java MUST be in matchedSkills and NOT in missingSkills
  assert.deepEqual(analysis.matchedSkills, ['Java']);
  assert.deepEqual(analysis.missingSkills, ['Spring Boot', 'SQL', 'PostgreSQL', 'Docker', 'Git']);
  assert.equal(analysis.missingSkills.includes('Java'), false);
});

test('inspectResumeValidity correctly validates IT candidate CV', () => {
  const itCvText = `
    nguyên khánh FRONTEND REACT DEVELOPER
    MỤC TIÊU NGHỀ NGHIỆP: người phát triển AI mạnh nhất
    HỌC VẤN: 2028 FPT UNIVERSITY SE
    KỸ NĂNG: java 70%
    KINH NGHIỆM LÀM VIỆC: giám đốc điều hành
  `;
  const result = inspectResumeValidity(itCvText);
  assert.equal(result.isInvalid, false);
  assert.equal(result.detectedType, 'CV Công nghệ Thông tin');
});

test('inspectResumeValidity validates synthesized IT candidate header', () => {
  const synthesizedText = `
    HỒ SƠ ỨNG VIÊN CÔNG NGHỆ THÔNG TIN: NGUYỄN KHÁNH
    Vị trí ứng tuyển mục tiêu: Frontend React Developer
    Trường: FPT University - Chuyên ngành: Software Engineering (SE)
    Kỹ năng: Java, React, JavaScript
  `;
  const result = inspectResumeValidity(synthesizedText);
  assert.equal(result.isInvalid, false);
  assert.equal(result.detectedType, 'CV Công nghệ Thông tin');
});

test('calculateSkillMatch and synchronizeMatchedSkills combine profile skills AND skills declared in CV', () => {
  const candidate = {
    // Chỉ chọn 1 kỹ năng trên hồ sơ web
    skills: ['Java'],
    // Trong CV khai các kỹ năng kỹ thuật & kỹ năng khác
    extractedCvText: `
      HỒ SƠ ỨNG VIÊN: NGUYỄN KHÁNH
      KỸ NĂNG: Java 70%, SQL 100%, Git 100%
      KỸ NĂNG KHÁC:
      · Giao tiếp & Làm việc nhóm
      · Tư duy phản biện
      · Quản lý thời gian
      · Giải quyết vấn đề
      KINH NGHIỆM LÀM VIỆC: Giám đốc điều hành
    `
  };
  const job = {
    title: 'Java dev',
    jobType: 'Internship (Hybrid)',
    requiredSkills: ['Java', 'SQL', 'Git', 'Docker', 'Kĩ năng giao tiếp', 'kĩ năng dẫn dắt']
  };

  const match = calculateSkillMatch(candidate.skills, job.requiredSkills, candidate.extractedCvText);
  // Cả Java (profile), SQL & Git (CV), Kĩ năng giao tiếp (CV "Giao tiếp & Làm việc nhóm"), kĩ năng dẫn dắt (CV "Giám đốc điều hành") đều phải khớp
  assert.equal(match.matchedSkills.includes('Java'), true);
  assert.equal(match.matchedSkills.includes('SQL'), true);
  assert.equal(match.matchedSkills.includes('Git'), true);
  assert.equal(match.matchedSkills.includes('Kĩ năng giao tiếp'), true);
  assert.equal(match.matchedSkills.includes('kĩ năng dẫn dắt'), true);
  assert.deepEqual(match.missingSkills, ['Docker']);
  assert.equal(match.percentage >= 80, true);

  const synced = synchronizeMatchedSkills([], job.requiredSkills, candidate, job);
  assert.deepEqual(synced.matchedSkills, ['Java', 'SQL', 'Git', 'Kĩ năng giao tiếp', 'kĩ năng dẫn dắt']);
  assert.deepEqual(synced.missingSkills, ['Docker']);
});


test('strict skill matching prevents false positives like Java vs JavaScript, C vs C++, and Git from soft skills', () => {
  // 1. Java không được match JavaScript
  const res1 = calculateSkillMatch(['Java'], ['JavaScript', 'Java'], '');
  assert.deepEqual(res1.matchedSkills, ['Java']);
  assert.deepEqual(res1.missingSkills, ['JavaScript']);

  // 2. Kỹ năng mềm tuyệt đối không suy luận nhầm sang công cụ kỹ thuật (Git, Docker, SQL, Java)
  const softCand = ['Giao tiếp & Làm việc nhóm', 'Tư duy phản biện', 'Quản lý thời gian', 'Giải quyết vấn đề'];
  const res2 = calculateSkillMatch(softCand, ['Git', 'Docker', 'Java', 'SQL'], '');
  assert.deepEqual(res2.matchedSkills, []);
  assert.deepEqual(res2.missingSkills, ['Git', 'Docker', 'Java', 'SQL']);

  // 3. Ranh giới từ an toàn: 'cong nghe' không được match 'C', chỉ match đúng 'C++'
  const res3 = calculateSkillMatch([], ['C', 'C++'], 'Hồ sơ ứng viên công nghệ thông tin, lập trình C++');
  assert.deepEqual(res3.matchedSkills, ['C++']);
  assert.deepEqual(res3.missingSkills, ['C']);

  // 4. SQL không được match NoSQL
  const res4 = calculateSkillMatch(['SQL'], ['NoSQL'], '');
  assert.deepEqual(res4.matchedSkills, []);
  assert.deepEqual(res4.missingSkills, ['NoSQL']);
});

test('syncPersonalJobRoadmapWithProfile performs real-time 2-way sync (marks completed when skill acquired, un-marks completed when skill removed/missing)', () => {
  const roadmap = {
    id: 'rd-frontend',
    jobId: 'job-1',
    topics: [
      { id: 'tp-1', skillName: 'ReactJS', title: '1. React Core & Hooks', completed: false },
      { id: 'tp-2', skillName: 'Git', title: '2. Git Workflow', completed: true }, // Trước đây bị đánh dấu hoàn thành nhầm
      { id: 'tp-3', skillName: 'JavaScript', title: '3. ES6+ JS', completed: false }
    ]
  };

  const job = {
    id: 'job-1',
    requiredSkills: ['ReactJS', 'Git', 'JavaScript']
  };

  // 1. Ứng viên chỉ có ReactJS và JavaScript (KHÔNG CÓ Git)
  const candidate1 = {
    skills: ['ReactJS', 'JavaScript'],
    extractedCvText: 'Hồ sơ: Lập trình viên Frontend React'
  };

  const sync1 = syncPersonalJobRoadmapWithProfile(roadmap, candidate1, job);
  const topics1 = sync1.updatedRoadmap.topics;

  // ReactJS và JavaScript phải được đánh dấu completed: true
  const reactTopic = topics1.find(t => t.skillName === 'ReactJS');
  const jsTopic = topics1.find(t => t.skillName === 'JavaScript');
  assert.equal(reactTopic.completed, true);
  assert.equal(jsTopic.completed, true);

  // Git PHẢI bị hủy đánh dấu hoàn thành (completed: false) vì ứng viên không có Git!
  const gitTopic = topics1.find(t => t.skillName === 'Git');
  assert.equal(gitTopic.completed, false);

  // 2. Khi ứng viên sau đó xóa kỹ năng ReactJS khỏi hồ sơ
  const candidate2 = {
    skills: ['JavaScript'],
    extractedCvText: ''
  };

  const sync2 = syncPersonalJobRoadmapWithProfile(sync1.updatedRoadmap, candidate2, job);
  const topics2 = sync2.updatedRoadmap.topics;
  const reactTopic2 = topics2.find(t => t.skillName === 'ReactJS');
  // ReactJS ngay lập tức bị hủy hoàn thành theo thời gian thực
  assert.equal(reactTopic2.completed, false);
});
