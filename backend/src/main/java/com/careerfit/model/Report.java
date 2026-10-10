package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reports")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Report {
    @Id @Column(length = 50) private String id;
    @Column(name = "job_id", length = 50) private String jobId;
    @Column(name = "reporter_id", length = 50) private String reporterId;
    @Column(length = 255) private String reason;
    @Column(length = 20) private String status;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "admin_note", columnDefinition = "NVARCHAR(MAX)") private String adminNote;
}