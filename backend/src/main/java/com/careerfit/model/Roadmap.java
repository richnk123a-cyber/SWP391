package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "roadmaps")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Roadmap {
    @Id @Column(length = 50) private String id;
    @Column(name = "skill_id", length = 50) private String skillId;
    @Column(name = "target_role", length = 100) private String targetRole;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String description;
}