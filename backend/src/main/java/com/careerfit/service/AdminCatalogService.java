package com.careerfit.service;

import com.careerfit.dto.RoadmapDto;
import com.careerfit.dto.RoadmapTopicDto;
import com.careerfit.dto.SkillDto;
import com.careerfit.model.Roadmap;
import com.careerfit.model.RoadmapTopic;
import com.careerfit.model.Skill;
import com.careerfit.repository.RoadmapRepository;
import com.careerfit.repository.RoadmapTopicRepository;
import com.careerfit.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminCatalogService {

    private final SkillRepository skillRepository;
    private final RoadmapRepository roadmapRepository;
    private final RoadmapTopicRepository roadmapTopicRepository;

    // =========================================================================
    // 1. SKILLS CATALOG CRUD (SCRUM-57, SCRUM-86, SCRUM-85)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<SkillDto> getAllSkills() {
        return skillRepository.findAll().stream()
                .map(this::mapSkillToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SkillDto> getActiveSkills() {
        return skillRepository.findByIsActiveTrue().stream()
                .map(this::mapSkillToDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public SkillDto createSkill(SkillDto dto) {
        String name = dto.getName() != null ? dto.getName().trim() : "";
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Tên kỹ năng không được để trống.");
        }

        if (skillRepository.existsByNameIgnoreCase(name)) {
            throw new IllegalArgumentException("Kỹ năng '" + name + "' đã tồn tại trong danh mục.");
        }

        String id = dto.getId();
        if (id == null || id.trim().isEmpty()) {
            id = "sk-" + UUID.randomUUID().toString().substring(0, 8);
        }

        Skill skill = Skill.builder()
                .id(id)
                .name(name)
                .category(dto.getCategory() != null && !dto.getCategory().trim().isEmpty() ? dto.getCategory().trim() : "Backend")
                .description(dto.getDescription())
                .isActive(dto.getIsActive() != null ? dto.getIsActive() : true)
                .build();

        Skill saved = skillRepository.save(skill);
        log.info("Created skill: {} ({})", saved.getName(), saved.getId());
        return mapSkillToDto(saved);
    }

    @Transactional
    public SkillDto updateSkill(String id, SkillDto dto) {
        Skill skill = skillRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy kỹ năng có ID: " + id));

        String newName = dto.getName() != null ? dto.getName().trim() : "";
        if (!newName.isEmpty() && !newName.equalsIgnoreCase(skill.getName())) {
            if (skillRepository.existsByNameIgnoreCase(newName)) {
                throw new IllegalArgumentException("Tên kỹ năng '" + newName + "' đã được sử dụng bởi kỹ năng khác.");
            }
            skill.setName(newName);
        }

        if (dto.getCategory() != null && !dto.getCategory().trim().isEmpty()) {
            skill.setCategory(dto.getCategory().trim());
        }
        if (dto.getDescription() != null) {
            skill.setDescription(dto.getDescription().trim());
        }
        if (dto.getIsActive() != null) {
            skill.setIsActive(dto.getIsActive());
        }

        Skill updated = skillRepository.save(skill);
        log.info("Updated skill: {} ({})", updated.getName(), updated.getId());
        return mapSkillToDto(updated);
    }

    @Transactional
    public void deleteSkill(String id) {
        if (!skillRepository.existsById(id)) {
            throw new NoSuchElementException("Không tìm thấy kỹ năng có ID: " + id);
        }
        skillRepository.deleteById(id);
        log.info("Deleted skill ID: {}", id);
    }

    private SkillDto mapSkillToDto(Skill skill) {
        return SkillDto.builder()
                .id(skill.getId())
                .name(skill.getName())
                .category(skill.getCategory())
                .description(skill.getDescription())
                .isActive(skill.getIsActive())
                .build();
    }

    // =========================================================================
    // 2. ROADMAPS CRUD (SCRUM-58, SCRUM-89, SCRUM-88)
    // =========================================================================

    @Transactional(readOnly = true)
    public List<RoadmapDto> getAllRoadmaps() {
        List<Roadmap> roadmaps = roadmapRepository.findAll();
        return roadmaps.stream()
                .map(this::mapRoadmapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public RoadmapDto getRoadmapById(String id) {
        Roadmap roadmap = roadmapRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lộ trình có ID: " + id));
        return mapRoadmapToDto(roadmap);
    }

    @Transactional(readOnly = true)
    public RoadmapDto getRoadmapBySkill(String skillName) {
        Roadmap roadmap = roadmapRepository.findBySkillNameIgnoreCase(skillName)
                .or(() -> roadmapRepository.findBySkillId(skillName))
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lộ trình cho kỹ năng: " + skillName));
        return mapRoadmapToDto(roadmap);
    }

    @Transactional
    public RoadmapDto createRoadmap(RoadmapDto dto) {
        String skill = dto.getSkill() != null ? dto.getSkill().trim() : (dto.getSkillName() != null ? dto.getSkillName().trim() : "");
        if (skill.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn kỹ năng cho lộ trình học.");
        }
        if (dto.getTargetRole() == null || dto.getTargetRole().trim().isEmpty()) {
            throw new IllegalArgumentException("Vui lòng nhập vị trí mục tiêu cho lộ trình.");
        }

        String id = dto.getId();
        if (id == null || id.trim().isEmpty()) {
            id = "rd-" + UUID.randomUUID().toString().substring(0, 8);
        }

        Roadmap roadmap = Roadmap.builder()
                .id(id)
                .skillName(skill)
                .skillId(dto.getSkillId() != null ? dto.getSkillId() : id)
                .targetRole(dto.getTargetRole().trim())
                .description(dto.getDescription())
                .build();

        Roadmap saved = roadmapRepository.save(roadmap);

        // Lưu các topics nếu có gửi kèm
        if (dto.getTopics() != null && !dto.getTopics().isEmpty()) {
            int order = 1;
            for (RoadmapTopicDto tDto : dto.getTopics()) {
                RoadmapTopic topic = RoadmapTopic.builder()
                        .id(tDto.getId() != null ? tDto.getId() : "tp-" + UUID.randomUUID().toString().substring(0, 8))
                        .roadmapId(saved.getId())
                        .title(tDto.getTitle())
                        .estimatedTime(tDto.getEstimatedTime())
                        .resourceName(tDto.getResourceName())
                        .url(tDto.getUrl())
                        .resourceType(tDto.getResourceType())
                        .stepOrder(tDto.getStepOrder() != null ? tDto.getStepOrder() : order++)
                        .completed(tDto.getCompleted() != null ? tDto.getCompleted() : false)
                        .build();
                roadmapTopicRepository.save(topic);
            }
        }

        log.info("Created roadmap: ID {}, Skill {}", saved.getId(), saved.getSkillName());
        return mapRoadmapToDto(saved);
    }

    @Transactional
    public RoadmapDto updateRoadmap(String id, RoadmapDto dto) {
        Roadmap roadmap = roadmapRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy lộ trình có ID: " + id));

        if (dto.getSkill() != null && !dto.getSkill().trim().isEmpty()) {
            roadmap.setSkillName(dto.getSkill().trim());
        } else if (dto.getSkillName() != null && !dto.getSkillName().trim().isEmpty()) {
            roadmap.setSkillName(dto.getSkillName().trim());
        }

        if (dto.getTargetRole() != null && !dto.getTargetRole().trim().isEmpty()) {
            roadmap.setTargetRole(dto.getTargetRole().trim());
        }

        if (dto.getDescription() != null) {
            roadmap.setDescription(dto.getDescription().trim());
        }

        Roadmap updated = roadmapRepository.save(roadmap);
        log.info("Updated roadmap: ID {}", updated.getId());
        return mapRoadmapToDto(updated);
    }

    @Transactional
    public void deleteRoadmap(String id) {
        if (!roadmapRepository.existsById(id)) {
            throw new NoSuchElementException("Không tìm thấy lộ trình có ID: " + id);
        }
        roadmapTopicRepository.deleteByRoadmapId(id);
        roadmapRepository.deleteById(id);
        log.info("Deleted roadmap ID: {}", id);
    }

    // =========================================================================
    // 3. ROADMAP TOPICS CRUD (SCRUM-58, SCRUM-89)
    // =========================================================================

    @Transactional
    public RoadmapTopicDto addTopic(String roadmapId, RoadmapTopicDto dto) {
        if (!roadmapRepository.existsById(roadmapId)) {
            throw new NoSuchElementException("Không tìm thấy lộ trình có ID: " + roadmapId);
        }

        List<RoadmapTopic> currentTopics = roadmapTopicRepository.findByRoadmapIdOrderByStepOrderAsc(roadmapId);
        int nextOrder = currentTopics.isEmpty() ? 1 : currentTopics.get(currentTopics.size() - 1).getStepOrder() + 1;

        String id = dto.getId();
        if (id == null || id.trim().isEmpty()) {
            id = "tp-" + UUID.randomUUID().toString().substring(0, 8);
        }

        RoadmapTopic topic = RoadmapTopic.builder()
                .id(id)
                .roadmapId(roadmapId)
                .title(dto.getTitle() != null ? dto.getTitle().trim() : "Chủ đề học tập")
                .estimatedTime(dto.getEstimatedTime())
                .resourceName(dto.getResourceName())
                .url(dto.getUrl())
                .resourceType(dto.getResourceType())
                .stepOrder(dto.getStepOrder() != null ? dto.getStepOrder() : nextOrder)
                .completed(dto.getCompleted() != null ? dto.getCompleted() : false)
                .build();

        RoadmapTopic saved = roadmapTopicRepository.save(topic);
        log.info("Added topic {} to roadmap {}", saved.getTitle(), roadmapId);
        return mapTopicToDto(saved);
    }

    @Transactional
    public RoadmapTopicDto updateTopic(String roadmapId, String topicId, RoadmapTopicDto dto) {
        RoadmapTopic topic = roadmapTopicRepository.findById(topicId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy chủ đề học tập có ID: " + topicId));

        if (!topic.getRoadmapId().equals(roadmapId)) {
            throw new IllegalArgumentException("Chủ đề không thuộc lộ trình ID: " + roadmapId);
        }

        if (dto.getTitle() != null && !dto.getTitle().trim().isEmpty()) {
            topic.setTitle(dto.getTitle().trim());
        }
        if (dto.getEstimatedTime() != null) {
            topic.setEstimatedTime(dto.getEstimatedTime());
        }
        if (dto.getResourceName() != null) {
            topic.setResourceName(dto.getResourceName());
        }
        if (dto.getUrl() != null) {
            topic.setUrl(dto.getUrl());
        }
        if (dto.getResourceType() != null) {
            topic.setResourceType(dto.getResourceType());
        }
        if (dto.getStepOrder() != null) {
            topic.setStepOrder(dto.getStepOrder());
        }
        if (dto.getCompleted() != null) {
            topic.setCompleted(dto.getCompleted());
        }

        RoadmapTopic updated = roadmapTopicRepository.save(topic);
        log.info("Updated topic ID {}", updated.getId());
        return mapTopicToDto(updated);
    }

    @Transactional
    public void deleteTopic(String roadmapId, String topicId) {
        RoadmapTopic topic = roadmapTopicRepository.findById(topicId)
                .orElseThrow(() -> new NoSuchElementException("Không tìm thấy chủ đề học tập có ID: " + topicId));

        if (!topic.getRoadmapId().equals(roadmapId)) {
            throw new IllegalArgumentException("Chủ đề không thuộc lộ trình ID: " + roadmapId);
        }

        roadmapTopicRepository.delete(topic);
        log.info("Deleted topic ID {}", topicId);
    }

    @Transactional
    public List<RoadmapTopicDto> reorderTopics(String roadmapId, List<String> topicIds) {
        if (!roadmapRepository.existsById(roadmapId)) {
            throw new NoSuchElementException("Không tìm thấy lộ trình có ID: " + roadmapId);
        }

        List<RoadmapTopic> topics = roadmapTopicRepository.findByRoadmapIdOrderByStepOrderAsc(roadmapId);
        Map<String, RoadmapTopic> map = topics.stream().collect(Collectors.toMap(RoadmapTopic::getId, t -> t));

        int order = 1;
        for (String tid : topicIds) {
            RoadmapTopic t = map.get(tid);
            if (t != null) {
                t.setStepOrder(order++);
                roadmapTopicRepository.save(t);
            }
        }

        return roadmapTopicRepository.findByRoadmapIdOrderByStepOrderAsc(roadmapId).stream()
                .map(this::mapTopicToDto)
                .collect(Collectors.toList());
    }

    private RoadmapDto mapRoadmapToDto(Roadmap roadmap) {
        List<RoadmapTopic> topics = roadmapTopicRepository.findByRoadmapIdOrderByStepOrderAsc(roadmap.getId());
        List<RoadmapTopicDto> topicDtos = topics.stream()
                .map(this::mapTopicToDto)
                .collect(Collectors.toList());

        String skillDisplay = roadmap.getSkillName() != null ? roadmap.getSkillName() : roadmap.getSkillId();

        return RoadmapDto.builder()
                .id(roadmap.getId())
                .skill(skillDisplay)
                .skillName(roadmap.getSkillName())
                .skillId(roadmap.getSkillId())
                .targetRole(roadmap.getTargetRole())
                .description(roadmap.getDescription())
                .topics(topicDtos)
                .build();
    }

    private RoadmapTopicDto mapTopicToDto(RoadmapTopic topic) {
        return RoadmapTopicDto.builder()
                .id(topic.getId())
                .roadmapId(topic.getRoadmapId())
                .title(topic.getTitle())
                .estimatedTime(topic.getEstimatedTime())
                .resourceName(topic.getResourceName())
                .url(topic.getUrl())
                .resourceType(topic.getResourceType())
                .stepOrder(topic.getStepOrder())
                .completed(topic.getCompleted())
                .build();
    }
}
