package com.careerfit.service;

import com.careerfit.dto.PersonalRoadmapDto;
import com.careerfit.dto.RoadmapTopicDto;
import com.careerfit.dto.ToggleTopicProgressRequest;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.CandidatePersonalRoadmap;
import com.careerfit.model.CandidateTopicProgress;
import com.careerfit.model.User;
import com.careerfit.repository.CandidatePersonalRoadmapRepository;
import com.careerfit.repository.CandidateTopicProgressRepository;
import com.careerfit.repository.UserRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateRoadmapService {

    private final CandidatePersonalRoadmapRepository personalRoadmapRepository;
    private final CandidateTopicProgressRepository topicProgressRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private User resolveUser(String userEmail) {
        return userRepository.findById(userEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(userEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
    }

    @Transactional(readOnly = true)
    public List<PersonalRoadmapDto> getPersonalRoadmaps(String userEmail) {
        User user = resolveUser(userEmail);
        List<CandidatePersonalRoadmap> entities = personalRoadmapRepository.findByUserIdOrderByUpdatedAtDesc(user.getId());
        List<PersonalRoadmapDto> dtos = new ArrayList<>();

        for (CandidatePersonalRoadmap entity : entities) {
            dtos.add(mapEntityToDto(entity));
        }
        return dtos;
    }

    @Transactional
    public PersonalRoadmapDto savePersonalRoadmap(String userEmail, PersonalRoadmapDto dto) {
        User user = resolveUser(userEmail);

        String id = dto.getId();
        if (id == null || id.isBlank()) {
            id = "personal-rd-" + (dto.getJobId() != null ? dto.getJobId() : UUID.randomUUID().toString().substring(0, 8));
            dto.setId(id);
        }

        String topicsJson = null;
        try {
            if (dto.getTopics() != null) {
                topicsJson = objectMapper.writeValueAsString(dto.getTopics());
            }
        } catch (Exception e) {
            log.warn("Error serializing roadmap topics to JSON: {}", e.getMessage());
        }

        CandidatePersonalRoadmap entity = personalRoadmapRepository.findByIdAndUserId(id, user.getId())
                .orElse(CandidatePersonalRoadmap.builder()
                        .id(id)
                        .userId(user.getId())
                        .createdAt(LocalDateTime.now())
                        .build());

        entity.setJobId(dto.getJobId());
        entity.setJobTitle(dto.getJobTitle());
        entity.setCompany(dto.getCompany());
        entity.setSkillName(dto.getSkillName() != null ? dto.getSkillName() : dto.getSkill());
        entity.setTargetRole(dto.getTargetRole());
        entity.setDescription(dto.getDescription());
        entity.setMatchPercentage(dto.getMatchPercentage() != null ? dto.getMatchPercentage() : 0);
        entity.setTopicsJson(topicsJson);
        entity.setUpdatedAt(LocalDateTime.now());

        CandidatePersonalRoadmap saved = personalRoadmapRepository.save(entity);
        log.info("Saved personal roadmap ID=[{}] for candidate=[{}]", saved.getId(), user.getEmail());

        // Also sync any completed topics from DTO into candidate_topic_progress
        if (dto.getTopics() != null) {
            for (RoadmapTopicDto t : dto.getTopics()) {
                if (t.getId() != null && Boolean.TRUE.equals(t.getCompleted())) {
                    saveTopicProgressRecord(user.getId(), t.getId(), saved.getId(), true);
                }
            }
        }

        return mapEntityToDto(saved);
    }

    @Transactional
    public CandidateTopicProgress toggleTopic(String userEmail, ToggleTopicProgressRequest req) {
        User user = resolveUser(userEmail);
        String topicId = req.getTopicId();
        if (topicId == null || topicId.isBlank()) {
            throw new IllegalArgumentException("topicId không được để trống.");
        }

        CandidateTopicProgress prog = topicProgressRepository.findByUserIdAndTopicId(user.getId(), topicId)
                .orElse(CandidateTopicProgress.builder()
                        .id("prog-" + user.getId() + "-" + topicId)
                        .userId(user.getId())
                        .topicId(topicId)
                        .roadmapId(req.getRoadmapId())
                        .completed(false)
                        .build());

        boolean newCompleted = req.getCompleted() != null ? req.getCompleted() : !Boolean.TRUE.equals(prog.getCompleted());
        prog.setCompleted(newCompleted);
        if (req.getRoadmapId() != null) {
            prog.setRoadmapId(req.getRoadmapId());
        }
        prog.setUpdatedAt(LocalDateTime.now());
        CandidateTopicProgress saved = topicProgressRepository.save(prog);

        // Update topicsJson in personal roadmaps containing this topic
        updateTopicInPersonalRoadmaps(user.getId(), topicId, req.getRoadmapId(), newCompleted);

        log.info("Candidate [{}] toggled topic [{}] completed=[{}]", userEmail, topicId, newCompleted);
        return saved;
    }

    @Transactional(readOnly = true)
    public List<CandidateTopicProgress> getTopicProgress(String userEmail) {
        User user = resolveUser(userEmail);
        return topicProgressRepository.findByUserId(user.getId());
    }

    @Transactional
    public void deletePersonalRoadmap(String userEmail, String roadmapId) {
        User user = resolveUser(userEmail);
        personalRoadmapRepository.findByIdAndUserId(roadmapId, user.getId())
                .ifPresent(personalRoadmapRepository::delete);
        log.info("Candidate [{}] deleted personal roadmap [{}]", userEmail, roadmapId);
    }

    private void saveTopicProgressRecord(String userId, String topicId, String roadmapId, boolean completed) {
        CandidateTopicProgress prog = topicProgressRepository.findByUserIdAndTopicId(userId, topicId)
                .orElse(CandidateTopicProgress.builder()
                        .id("prog-" + userId + "-" + topicId)
                        .userId(userId)
                        .topicId(topicId)
                        .build());
        prog.setRoadmapId(roadmapId);
        prog.setCompleted(completed);
        prog.setUpdatedAt(LocalDateTime.now());
        topicProgressRepository.save(prog);
    }

    private void updateTopicInPersonalRoadmaps(String userId, String topicId, String targetRoadmapId, boolean completed) {
        List<CandidatePersonalRoadmap> list = targetRoadmapId != null
                ? personalRoadmapRepository.findByIdAndUserId(targetRoadmapId, userId).map(List::of).orElse(List.of())
                : personalRoadmapRepository.findByUserIdOrderByUpdatedAtDesc(userId);

        for (CandidatePersonalRoadmap rm : list) {
            if (rm.getTopicsJson() == null || rm.getTopicsJson().isBlank()) continue;
            try {
                List<Map<String, Object>> topics = objectMapper.readValue(
                        rm.getTopicsJson(), new TypeReference<List<Map<String, Object>>>() {});
                boolean changed = false;
                for (Map<String, Object> t : topics) {
                    Object idObj = t.get("id");
                    if (idObj != null && topicId.equals(idObj.toString())) {
                        t.put("completed", completed);
                        changed = true;
                    }
                }
                if (changed) {
                    rm.setTopicsJson(objectMapper.writeValueAsString(topics));
                    rm.setUpdatedAt(LocalDateTime.now());
                    personalRoadmapRepository.save(rm);
                }
            } catch (Exception e) {
                log.warn("Error updating topic in personal roadmap: {}", e.getMessage());
            }
        }
    }

    private PersonalRoadmapDto mapEntityToDto(CandidatePersonalRoadmap entity) {
        List<RoadmapTopicDto> topics = new ArrayList<>();
        if (entity.getTopicsJson() != null && !entity.getTopicsJson().isBlank()) {
            try {
                topics = objectMapper.readValue(entity.getTopicsJson(), new TypeReference<List<RoadmapTopicDto>>() {});
            } catch (Exception e) {
                log.warn("Failed to parse topicsJson for roadmap {}: {}", entity.getId(), e.getMessage());
            }
        }

        return PersonalRoadmapDto.builder()
                .id(entity.getId())
                .jobId(entity.getJobId())
                .jobTitle(entity.getJobTitle())
                .company(entity.getCompany())
                .type("PERSONAL")
                .skill(entity.getSkillName())
                .skillName(entity.getSkillName())
                .targetRole(entity.getTargetRole())
                .description(entity.getDescription())
                .matchPercentage(entity.getMatchPercentage())
                .createdAt(entity.getCreatedAt() != null ? entity.getCreatedAt().format(DATE_FORMAT) : null)
                .updatedAt(entity.getUpdatedAt() != null ? entity.getUpdatedAt().format(DATE_FORMAT) : null)
                .topics(topics)
                .build();
    }
}
