package com.careerfit.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "saved_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedJob {

    @Id
    @Column(name = "id", length = 50)
    private String id;

    @Column(name = "candidate_user_id", length = 50)
    private String candidateUserId;

    @Column(name = "job_id", length = 50)
    private String jobId;

    @CreationTimestamp
    @Column(name = "saved_at")
    private LocalDateTime savedAt;
}
