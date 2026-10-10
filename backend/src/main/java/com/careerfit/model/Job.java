package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "jobs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Job {
    @Id @Column(length = 50) private String id;
    @Column(name = "employer_id", length = 50) private String employerId;
    @Column(length = 150) private String title;
    @Column(length = 50) private String category;
    @Column(name = "job_type", length = 50) private String jobType;
    @Column(length = 100) private String location;
    @Column(length = 50) private String salary;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String description;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String responsibilities;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String requirements;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String benefits;
    @Column(length = 50) private String deadline;
    @Column(name = "posted_date") private LocalDateTime postedDate;
    @Builder.Default @Column(name = "is_visible") private Boolean isVisible = true;
    @Column(name = "verification_status", length = 20) private String verificationStatus;
    @Column(name = "rejection_reason", columnDefinition = "NVARCHAR(MAX)") private String rejectionReason;

    // Tự động sinh bảng trung gian job_skill
    @ManyToMany
    @JoinTable(name = "job_skill",
        joinColumns = @JoinColumn(name = "job_id"),
        inverseJoinColumns = @JoinColumn(name = "skill_id"))
    private List<Skill> skills;
}