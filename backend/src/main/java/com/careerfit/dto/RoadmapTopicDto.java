package com.careerfit.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoadmapTopicDto {
    private String id;
    private String roadmapId;
    private String title;
    private String estimatedTime;
    private String resourceName;
    private String url;
    private String resourceType;
    private Integer stepOrder;
    private Boolean completed;
}
