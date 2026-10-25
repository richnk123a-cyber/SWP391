package com.careerfit.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class ToggleTopicProgressRequest {
    private String roadmapId;
    private String topicId;
    private Boolean completed;
    private String title;
    private String skillName;
}
