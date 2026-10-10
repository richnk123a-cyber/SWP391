package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;
import java.util.List;

@Entity
@Table(name = "candidate_profiles")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CandidateProfile {
    @Id @Column(length = 50) private String id;
    @Column(name = "user_id", length = 50) private String userId;
    @Column(name = "full_name", length = 100) private String fullName;
    @Column(length = 20) private String phone;
    @Column(length = 100) private String location;
    @Column(length = 150) private String university;
    @Column(length = 100) private String major;
    @Column(name = "graduation_year", length = 10) private String graduationYear;
    @Column(name = "desired_role", length = 100) private String desiredRole;
    @Column(name = "expected_salary", length = 50) private String expectedSalary;
    @Column(name = "cv_file_name", length = 255) private String cvFileName;
    @Column(name = "extracted_cv_text", columnDefinition = "NVARCHAR(MAX)") private String extractedCvText;

    // Tự động sinh bảng trung gian candidate_skill
    @ManyToMany
    @JoinTable(name = "candidate_skill",
        joinColumns = @JoinColumn(name = "candidate_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id"))
    private List<Skill> skills;
}