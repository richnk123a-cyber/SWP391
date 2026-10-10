package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "applications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Application {
    @Id @Column(length = 50) private String id;
    @Column(name = "job_id", length = 50) private String jobId;
    @Column(name = "candidate_id", length = 50) private String candidateId;
    @Column(name = "applied_date") private LocalDateTime appliedDate;
    @Column(name = "last_update") private LocalDateTime lastUpdate;
    @Column(length = 20) private String status;
    @Column(name = "interview_time", length = 50) private String interviewTime;
    @Column(name = "meeting_link", length = 255) private String meetingLink;
    @Column(name = "interview_note", columnDefinition = "NVARCHAR(MAX)") private String interviewNote;
}