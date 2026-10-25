package com.careerfit.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "candidate_topic_progress", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_candidate_topic", columnNames = {"user_id", "topic_id"})
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CandidateTopicProgress {
    @Id
    @Column(length = 150)
    private String id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "topic_id", nullable = false, length = 100)
    private String topicId;

    @Column(name = "roadmap_id", length = 100)
    private String roadmapId;

    @Column(nullable = false)
    private Boolean completed;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
