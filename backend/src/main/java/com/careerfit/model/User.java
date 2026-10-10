package com.careerfit.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @Column(length = 50) private String id;
    @Column(length = 100, nullable = false) private String email;
    @Column(length = 50) private String username;
    @Column(name = "password_hash", length = 255) private String passwordHash;
    @Column(length = 20) private String role;
    @Column(length = 20) private String status;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "auth_provider", length = 20) private String authProvider;
    @Column(name = "provider_id", length = 100) private String providerId;
    @Column(name = "avatar_url", columnDefinition = "NVARCHAR(MAX)") private String avatarUrl;
    @Column(name = "has_custom_password") private Boolean hasCustomPassword;
}