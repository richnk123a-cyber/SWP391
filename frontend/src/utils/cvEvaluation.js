import { DB_SKILL_RESOURCES } from './matching.js';

export function cvEvaluationKey(profile = {}, job = {}, user = {}) {
  const input = JSON.stringify([user.id, profile.id, profile.extractedCvText, profile.skills, profile.bio,
    job.id, job.title, job.description, job.requirements, job.responsibilities, job.requiredSkills, job.jobType]);
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) hash = Math.imul(hash ^ input.charCodeAt(i), 16777619);
  return `v2:${user.id || profile.userId || 'guest'}:${job.id}:${input.length}:${hash >>> 0}`;
}

export function buildAiRoadmap(result, job) {
  const { analysis, topics, modelName, analyzedAt } = result;
  if (!analysis || !Array.isArray(topics)) throw new Error('AI trả về dữ liệu đánh giá không hợp lệ.');
  return {
    id: `personal-rd-${job.id}`, jobId: job.id, jobTitle: job.title, company: job.company,
    type: 'PERSONAL', sourceType: 'AI_GENERATED', modelName, analyzedAt,
    skill: (analysis.assessedSkills || analysis.missingSkills).join(' & '), skillName: (analysis.assessedSkills || analysis.missingSkills).join(' & '),
    targetRole: `Roadmap: ${job.title}`, description: analysis.explanation,
    missingSkills: analysis.missingSkills, matchedSkills: analysis.matchedSkills,
    matchPercentage: analysis.overallMatch, createdAt: new Date(analyzedAt).toLocaleDateString('vi-VN'),
    topics: topics.map((topic, index) => {
      const resource = DB_SKILL_RESOURCES[topic.skillName.toLowerCase()]?.[0];
      return {
        id: `tp-ai-${job.id}-${index + 1}`, skillName: topic.skillName, title: topic.title,
        milestone: topic.stage, sequence: index + 1,
        completed: false, estimatedTime: `${topic.estimatedHours} giờ`,
        description: `${topic.description}\nThực hành: ${topic.exercise}`,
        resource: resource?.resource || 'Bài thực hành do AI thiết kế', url: resource?.url || '',
        sourceType: 'AI_GENERATED', decisiveAiName: modelName,
      };
    }),
  };
}

export function attachWebResources(roadmap, resources = []) {
  return { ...roadmap, topics: roadmap.topics.map(topic => {
    const sources = resources.filter(resource => resource.skillName === topic.skillName);
    const occurrence = roadmap.topics.slice(0, roadmap.topics.indexOf(topic)).filter(t => t.skillName === topic.skillName).length;
    const source = sources[occurrence % sources.length];
    return source ? { ...topic, url: source.url, resource: source.title, resources: sources,
      sourceType: source.origin === 'WEB_SEARCH' || !source.origin ? 'AI_WEB_SEARCH' : 'AI_OFFICIAL_RESOURCE', searchedAt: source.searchedAt } : topic;
  }) };
}

export function preserveAiRoadmapProgress(next, previous) {
  if (next.sourceType !== 'AI_GENERATED' || !previous) return next;
  return { ...next, topics: next.topics.map(topic => {
    const old = previous.topics?.find(item => item.skillName === topic.skillName
      && item.title === topic.title && item.description === topic.description);
    return old ? { ...topic, completed: !!old.completed } : topic;
  }) };
}
