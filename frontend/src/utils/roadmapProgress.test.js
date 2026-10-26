import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mergeMasterRoadmap } from './matching.js';

describe('Roadmap Progress and Topic Toggle', () => {
  const samplePersonalRoadmaps = [
    {
      id: 'pr-1',
      jobId: 'job-1',
      jobTitle: 'Backend Developer',
      skill: 'Java • SQL',
      topics: [
        { id: 'tp-java-core', title: '1. Nâng cao Java Core cho Backend', completed: false, estimatedTime: '20 giờ' },
        { id: 'tp-spring-boot', title: '2. Spring Boot Core', completed: false, estimatedTime: '15 giờ' }
      ]
    },
    {
      id: 'pr-2',
      jobId: 'job-2',
      jobTitle: 'Fullstack Developer',
      skill: 'Java • React',
      topics: [
        { id: 'tp-java-core-fs', title: 'Nâng cao Java Core cho Backend', completed: false, estimatedTime: '20 giờ' },
        { id: 'tp-react', title: 'React Fundamentals', completed: false, estimatedTime: '10 giờ' }
      ]
    }
  ];

  it('merges deduplicated topics with sourceTopicIds and originalId', () => {
    const master = mergeMasterRoadmap(samplePersonalRoadmaps);
    assert.equal(master.topics.length, 3);
    const javaCoreTopic = master.topics[0];
    assert.equal(javaCoreTopic.title, '1. Nâng cao Java Core cho Backend');
    assert.equal(javaCoreTopic.originalId, 'tp-java-core');
    assert.deepEqual(javaCoreTopic.sourceTopicIds, ['tp-java-core', 'tp-java-core-fs']);
    assert.equal(javaCoreTopic.completed, false);
  });

  it('correctly calculates initial progress as 0%', () => {
    const master = mergeMasterRoadmap(samplePersonalRoadmaps);
    const completed = master.topics.filter(t => t.completed).length;
    const progress = master.topics.length ? Math.round((completed / master.topics.length) * 100) : 0;
    assert.equal(completed, 0);
    assert.equal(progress, 0);
  });

  it('updates personal roadmaps and master roadmap progress when marking a lesson complete', () => {
    const master = mergeMasterRoadmap(samplePersonalRoadmaps);
    const topicToToggle = master.topics[0];

    // Simulate toggle logic in AppContext
    const cleanTargetTitle = (topicToToggle.title || '').replace(/^\d+\.\s*/, '').trim().toLowerCase();
    const sourceIds = Array.isArray(topicToToggle.sourceTopicIds)
      ? [...topicToToggle.sourceTopicIds]
      : [topicToToggle.originalId || topicToToggle.id].filter(Boolean);
    const targetCompleted = !topicToToggle.completed;

    const matchesTopic = (tp) => {
      if (!tp) return false;
      if (tp.id === topicToToggle.id) return true;
      if (sourceIds.includes(tp.id)) return true;
      if (tp.originalId && (tp.originalId === topicToToggle.id || sourceIds.includes(tp.originalId))) return true;
      if (cleanTargetTitle) {
        const tpTitle = (tp.title || '').replace(/^\d+\.\s*/, '').trim().toLowerCase();
        if (tpTitle && tpTitle === cleanTargetTitle) return true;
      }
      return false;
    };

    const updatedPersonal = samplePersonalRoadmaps.map(pRm => ({
      ...pRm,
      topics: (pRm.topics || []).map(tp => matchesTopic(tp) ? { ...tp, completed: targetCompleted } : tp)
    }));

    // Verify both personal roadmaps have the topic marked as completed
    assert.equal(updatedPersonal[0].topics[0].completed, true);
    assert.equal(updatedPersonal[1].topics[0].completed, true);

    // Recompute master roadmap
    const updatedMaster = mergeMasterRoadmap(updatedPersonal);
    assert.equal(updatedMaster.topics[0].completed, true);

    const completed = updatedMaster.topics.filter(t => t.completed).length;
    const progress = Math.round((completed / updatedMaster.topics.length) * 100);
    assert.equal(completed, 1);
    assert.equal(progress, 33); // 1 out of 3 = 33%
  });

  it('unmarking as complete restores 0% progress', () => {
    const completedPersonalRoadmaps = samplePersonalRoadmaps.map(pRm => ({
      ...pRm,
      topics: (pRm.topics || []).map(tp => ({ ...tp, completed: true }))
    }));

    const master = mergeMasterRoadmap(completedPersonalRoadmaps);
    const topicToToggle = master.topics[0];

    const cleanTargetTitle = (topicToToggle.title || '').replace(/^\d+\.\s*/, '').trim().toLowerCase();
    const sourceIds = topicToToggle.sourceTopicIds || [];
    const targetCompleted = false;

    const matchesTopic = (tp) => {
      if (!tp) return false;
      if (tp.id === topicToToggle.id || sourceIds.includes(tp.id)) return true;
      const tpTitle = (tp.title || '').replace(/^\d+\.\s*/, '').trim().toLowerCase();
      return tpTitle === cleanTargetTitle;
    };

    const updatedPersonal = completedPersonalRoadmaps.map(pRm => ({
      ...pRm,
      topics: (pRm.topics || []).map(tp => matchesTopic(tp) ? { ...tp, completed: targetCompleted } : tp)
    }));

    const updatedMaster = mergeMasterRoadmap(updatedPersonal);
    assert.equal(updatedMaster.topics[0].completed, false);
    assert.equal(updatedMaster.topics[1].completed, true);
    assert.equal(updatedMaster.topics[2].completed, true);

    const completed = updatedMaster.topics.filter(t => t.completed).length;
    const progress = Math.round((completed / updatedMaster.topics.length) * 100);
    assert.equal(completed, 2);
    assert.equal(progress, 67); // 2 out of 3 = 67%
  });
});
