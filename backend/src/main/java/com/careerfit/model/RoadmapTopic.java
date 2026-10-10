package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roadmap_topics")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RoadmapTopic {
    @Id @Column(length = 50) private String id;
    @Column(name = "roadmap_id", length = 50) private String roadmapId;
    @Column(length = 255) private String title;
    @Column(name = "estimated_time", length = 50) private String estimatedTime;
    @Column(name = "resource_name", length = 100) private String resourceName;
    @Column(length = 255) private String url;
    @Column(name = "step_order") private Integer stepOrder;
}