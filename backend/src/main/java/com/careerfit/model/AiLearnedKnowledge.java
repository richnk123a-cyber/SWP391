package com.careerfit.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity lưu trữ kiến thức mà AI Assistant đã học được từ bên ngoài hoặc tài liệu bổ sung.
 * Hỗ trợ lưu trữ bền vững (Persistent Knowledge Store), chống trùng lặp qua queryHash,
 * và quản lý vòng đời dữ liệu qua TTL (expiresAt).
 */
@Entity
@Table(name = "ai_learned_knowledge", indexes = {
        @Index(name = "idx_learned_query_hash", columnList = "query_hash", unique = true),
        @Index(name = "idx_learned_topic", columnList = "topic"),
        @Index(name = "idx_learned_expires_at", columnList = "expires_at")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiLearnedKnowledge {

    @Id
    @Column(length = 64)
    private String id;

    /**
     * SHA-256 hash của câu hỏi/chủ đề sau khi đã chuẩn hóa (bỏ dấu, lowercase).
     * Dùng để tra cứu nhanh O(1) và ngăn ngừa lưu trùng lặp.
     */
    @Column(name = "query_hash", length = 64, nullable = false, unique = true)
    private String queryHash;

    /**
     * Câu hỏi hoặc truy vấn ban đầu của người dùng
     */
    @Column(name = "original_query", length = 1000)
    private String originalQuery;

    /**
     * Câu hỏi/truy vấn đã qua chuẩn hóa
     */
    @Column(name = "normalized_query", length = 1000)
    private String normalizedQuery;

    /**
     * Chủ đề kiến thức (e.g. JAVA, DATABASE, CAREERFIT_FEATURE, DEVOPS)
     */
    @Column(length = 100)
    private String topic;

    /**
     * Tiêu đề của kiến thức đã học
     */
    @Column(length = 255)
    private String title;

    /**
     * Nội dung kiến thức tóm tắt cô đọng (đã lọc sạch PII)
     */
    @Column(name = "summary_content", columnDefinition = "NVARCHAR(MAX)", nullable = false)
    private String summaryContent;

    /**
     * Nguồn tham khảo hoặc URL kiểm chứng từ bên ngoài
     */
    @Column(name = "source_url", length = 1000)
    private String sourceUrl;

    /**
     * Điểm số tin cậy (0.0 đến 1.0)
     */
    @Column(name = "confidence_score")
    private Double confidenceScore;

    /**
     * Số lần tri thức này được tái sử dụng để trả lời các câu hỏi sau
     */
    @Column(name = "access_count")
    @Builder.Default
    private Integer accessCount = 1;

    /**
     * Thời điểm AI học được kiến thức này
     */
    @Column(name = "learned_at")
    private LocalDateTime learnedAt;

    /**
     * Thời điểm kiến thức hết hạn cần làm mới (TTL)
     */
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    /**
     * Thời điểm truy xuất gần nhất
     */
    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

    @PrePersist
    public void prePersist() {
        if (learnedAt == null) {
            learnedAt = LocalDateTime.now();
        }
        if (lastAccessedAt == null) {
            lastAccessedAt = LocalDateTime.now();
        }
        if (accessCount == null) {
            accessCount = 1;
        }
        if (expiresAt == null) {
            // Mặc định hạn làm mới 30 ngày
            expiresAt = learnedAt.plusDays(30);
        }
    }
}
