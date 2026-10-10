package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "skills")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Skill {
    @Id @Column(length = 50) private String id;
    @Column(length = 50, unique = true) private String name;
    @Column(length = 50) private String category;
    @Builder.Default @Column(name = "is_active") private Boolean isActive = true;
}