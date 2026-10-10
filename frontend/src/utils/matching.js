/**
 * Level 1 - Skill Tag Matching Algorithm
 * Evaluates candidate skill tags against job required skills without calling AI.
 */
export function calculateSkillMatch(candidateSkills = [], jobRequiredSkills = []) {
  if (!jobRequiredSkills || jobRequiredSkills.length === 0) {
    return {
      percentage: 100,
      label: 'Strong Match',
      badgeClass: 'badge-strong',
      matchedSkills: candidateSkills,
      missingSkills: []
    };
  }

  const normalizedCandidate = candidateSkills.map(s => s.toLowerCase().trim());
  
  const matchedSkills = [];
  const missingSkills = [];

  jobRequiredSkills.forEach(skill => {
    if (normalizedCandidate.includes(skill.toLowerCase().trim())) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  const percentage = Math.min(100, Math.max(0, Math.round((matchedSkills.length / jobRequiredSkills.length) * 100)));

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

/**
 * Level 2 - AI Deep Analysis Simulation
 * Detailed breakdown when candidate requests deep AI evaluation for a job.
 */
export function generateAIDeepAnalysis(candidate, job) {
  const matchResult = calculateSkillMatch(candidate.skills, job.requiredSkills);
  
  // Simulated breakdown percentages
  const skillMatch = matchResult.percentage;
  const experienceMatch = candidate.major ? 85 : 70;
  const projectRelevance = candidate.hasCV ? 90 : 50;

  const overallMatch = Math.round((skillMatch * 0.6) + (experienceMatch * 0.25) + (projectRelevance * 0.15));

  let strengths = [];
  let areasToImprove = [];

  if (matchResult.matchedSkills.length > 0) {
    strengths.push(`Có nền tảng vững vàng về ${matchResult.matchedSkills.join(', ')}.`);
  }
  if (candidate.university) {
    strengths.push(`Đang theo học chuyên ngành CNTT tại ${candidate.university}.`);
  }

  if (matchResult.missingSkills.length > 0) {
    areasToImprove.push(`Cần bổ sung kiến thức chuyên sâu về ${matchResult.missingSkills.join(', ')}.`);
  }
  if (!candidate.hasCV) {
    areasToImprove.push('Cần đính kèm bản CV PDF cập nhật dự án thực tế.');
  }

  return {
    overallMatch,
    skillMatch,
    experienceMatch,
    projectRelevance,
    matchedSkills: matchResult.matchedSkills,
    missingSkills: matchResult.missingSkills,
    strengths,
    areasToImprove,
    explanation: `Mức độ tương thích ${overallMatch}% được tính toán từ 60% trùng khớp kỹ năng cốt lõi, 25% phù hợp chuyên ngành và 15% minh chứng dự án trong CV. AI khuyến nghị bạn tiếp tục củng cố các kỹ năng còn thiếu thông qua Learning Roadmap.`
  };
}
