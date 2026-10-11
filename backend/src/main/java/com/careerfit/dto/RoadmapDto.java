package com.careerfit.dto;

import lombok.*;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapDto {
    private String id;
    private String skill;        // Frontend uses skill field for skill name
    private String skillName;
    private String skillId;
    private String targetRole;
    private String description;
    private List<RoadmapTopicDto> topics;
}
