import test from 'node:test';
import assert from 'node:assert/strict';
import { attachWebResources, buildAiRoadmap, cvEvaluationKey, preserveAiRoadmapProgress } from './cvEvaluation.js';
import { sanitizeRoadmapTopics } from './matching.js';

const job = { id: 'job-1', title: 'Backend', company: 'Test', requiredSkills: ['Java', 'SQL'] };
const profile = { id: 'candidate-1', extractedCvText: 'Java REST project', skills: ['Java'] };
const result = {
  jobId: job.id, modelName: 'Test model', analyzedAt: '2026-10-14T06:00:00Z',
  analysis: { overallMatch: 55, matchedSkills: ['Java'], missingSkills: ['SQL'], explanation: 'Practice database joins' },
  topics: [{ skillName: 'SQL', title: 'Joining database tables', estimatedHours: 4,
    description: 'Learn join types', exercise: 'Join three tables and verify counts' }],
};
test('AI scores and custom lesson content are used directly', () => {
  const roadmap = buildAiRoadmap(result, job);
  assert.equal(roadmap.matchPercentage, 55);
  assert.equal(roadmap.topics.length, 1);
  assert.equal(roadmap.topics[0].title, result.topics[0].title);
  assert.ok(roadmap.topics[0].description.includes(result.topics[0].exercise));
  assert.equal(roadmap.topics[0].sourceType, 'AI_GENERATED');
  assert.equal(roadmap.topics[0].completed, false);
  assert.deepEqual(sanitizeRoadmapTopics(roadmap.topics), roadmap.topics);
});
test('AI does not invent lessons when no skills are missing', () => {
  const roadmap = buildAiRoadmap({ ...result, topics: [], analysis: { ...result.analysis, missingSkills: [] } }, job);
  assert.deepEqual(roadmap.topics, []);
});
test('unknown skill retains AI exercise without inventing an Internet source', () => {
  const roadmap = buildAiRoadmap({ ...result, topics: [{ ...result.topics[0], skillName: 'Unknown specialist skill' }] }, job);
  assert.equal(roadmap.topics[0].url, '');
  assert.equal(roadmap.topics[0].resource, 'Bài thực hành do AI thiết kế');
});
test('cached evaluations invalidate when CV, job requirements or account changes', () => {
  const key = cvEvaluationKey(profile, job, { id: 'user-1' });
  assert.notEqual(key, cvEvaluationKey({ ...profile, extractedCvText: 'A new CV' }, job, { id: 'user-1' }));
  assert.notEqual(key, cvEvaluationKey(profile, { ...job, requirements: 'New requirements' }, { id: 'user-1' }));
  assert.notEqual(key, cvEvaluationKey(profile, job, { id: 'user-2' }));
  assert.equal(key, cvEvaluationKey({ ...profile }, { ...job }, { id: 'user-1' }));
});
test('web sources attach to relevant lessons while retaining the AI plan and practice', () => {
  const roadmap = buildAiRoadmap(result, job);
  const updated = attachWebResources(roadmap, [{ skillName: 'SQL', title: 'Official SQL tutorial',
    url: 'https://www.postgresql.org/docs/current/tutorial.html', searchedAt: '2026-10-14T06:00:00Z' }]);
  assert.equal(updated.topics[0].sourceType, 'AI_WEB_SEARCH');
  assert.equal(updated.topics[0].title, roadmap.topics[0].title);
  assert.equal(updated.topics[0].description, roadmap.topics[0].description);
  assert.equal(updated.topics[0].url, 'https://www.postgresql.org/docs/current/tutorial.html');
  assert.deepEqual(sanitizeRoadmapTopics(updated.topics), updated.topics);
});
test('a delayed resource update preserves completed lessons and changed lessons reset', () => {
  const roadmap = buildAiRoadmap(result, job);
  const previous = { ...roadmap, topics: [{ ...roadmap.topics[0], completed: true }] };
  assert.equal(preserveAiRoadmapProgress(roadmap, previous).topics[0].completed, true);
  const changed = { ...roadmap, topics: [{ ...roadmap.topics[0], description: 'A different exercise' }] };
  assert.equal(preserveAiRoadmapProgress(changed, previous).topics[0].completed, false);
});
test('directly fetched official sources are not labeled as AI web search', () => {
  const roadmap = buildAiRoadmap(result, job);
  const updated = attachWebResources(roadmap, [{ skillName: 'SQL', title: 'SQL tutorial',
    url: 'https://www.postgresql.org/docs/current/tutorial-sql.html', origin: 'OFFICIAL_DOCS' }]);
  assert.equal(updated.topics[0].sourceType, 'AI_OFFICIAL_RESOURCE');
  assert.deepEqual(sanitizeRoadmapTopics(updated.topics), updated.topics);
});

test('each lesson retains its stage and gets all matching sources with a rotating primary source', () => {
  const roadmap = buildAiRoadmap({ ...result, topics: [
    { ...result.topics[0], stage: 'Nền tảng' }, { ...result.topics[0], title: 'SQL project', stage: 'Dự án' },
  ] }, job);
  const updated = attachWebResources(roadmap, [
    { skillName: 'SQL', title: 'SQL tutorial', url: 'https://www.postgresql.org/docs/current/tutorial-sql.html', origin: 'OFFICIAL_DOCS' },
    { skillName: 'SQL', title: 'SQL course', url: 'https://www.coursera.org/learn/sql-for-data-science', origin: 'TRUSTED_COURSE' },
  ]);
  assert.equal(updated.topics[0].milestone, 'Nền tảng');
  assert.equal(updated.topics[1].milestone, 'Dự án');
  assert.equal(updated.topics[0].resources.length, 2);
  assert.notEqual(updated.topics[0].url, updated.topics[1].url);
});
