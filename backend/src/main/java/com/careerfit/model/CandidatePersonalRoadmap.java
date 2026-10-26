package com.careerfit.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_personal_roadmaps")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidatePersonalRoadmap {
    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "job_id", length = 50)
    private String jobId;

    @Column(name = "job_title", length = 255)
    private String jobTitle;

    @Column(length = 255)
    private String company;

    @Column(name = "skill_name", length = 255)
    private String skillName;

    @Column(name = "target_role", length = 255)
    private String targetRole;

    @Column(columnDefinition = "NVARCHAR(MAX)")
    private String description;

    @Column(name = "match_percentage")
    private Integer matchPercentage;

    @Column(name = "topics_json", columnDefinition = "NVARCHAR(MAX)")
    private String topicsJson;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
