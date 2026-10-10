package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_analysis_cache")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AiAnalysisCache {
    @Id @Column(length = 50) private String id;
    @Column(name = "candidate_id", length = 50) private String candidateId;
    @Column(name = "job_id", length = 50) private String jobId;
    @Column(name = "match_percentage") private Integer matchPercentage;
    @Column(name = "matched_skills_json", columnDefinition = "NVARCHAR(MAX)") private String matchedSkillsJson;
    @Column(name = "missing_skills_json", columnDefinition = "NVARCHAR(MAX)") private String missingSkillsJson;
    @Column(name = "created_at") private LocalDateTime createdAt;
}