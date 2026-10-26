package com.careerfit.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class PersonalRoadmapDto {
    private String id;
    private String jobId;
    private String jobTitle;
    private String company;
    private String type; // "PERSONAL"
    private String skill;
    private String skillName;
    private String targetRole;
    private String description;
    private Integer matchPercentage;
    private String createdAt;
    private String updatedAt;
    private List<String> missingSkills;
    private List<String> matchedSkills;
    private List<RoadmapTopicDto> topics;
}
