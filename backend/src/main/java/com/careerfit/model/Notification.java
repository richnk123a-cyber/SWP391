package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Notification {
    @Id @Column(length = 50) private String id;
    @Column(name = "user_id", length = 50) private String userId;
    @Column(name = "application_id", length = 50) private String applicationId;
    @Column(columnDefinition = "NVARCHAR(MAX)") private String content;
    @Builder.Default @Column(name = "is_read") private Boolean isRead = false;
    @Column(name = "created_at") private LocalDateTime createdAt;
}