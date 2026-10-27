package com.careerfit.ai.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * Đơn vị đoạn tri thức (Chunk) kèm metadata đầy đủ:
 * nguồn, tiêu đề, chủ đề, từ khóa, thời gian cập nhật, độ tin cậy và URL nguồn.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnowledgeChunk {

    private String id;
    private String source;
    private String title;
    private String topic;
    private String content;

    @Builder.Default
    private List<String> keywords = Collections.emptyList();

    @Builder.Default
    private LocalDateTime updatedAt = LocalDateTime.now();

    @Builder.Default
    private double confidence = 1.0;

    private String sourceUrl;

    @Builder.Default
    private boolean learned = false;

    /**
     * Danh sách token đã chuẩn hóa của đoạn tri thức phục vụ BM25 index
     */
    private transient List<String> indexedTokens;

    /**
     * Tạo chuỗi biểu diễn hoàn chỉnh cho chỉ mục
     */
    public String getSearchableText() {
        StringBuilder sb = new StringBuilder();
        if (title != null) sb.append(title).append(" ");
        if (topic != null) sb.append(topic).append(" ");
        if (keywords != null && !keywords.isEmpty()) {
            sb.append(String.join(" ", keywords)).append(" ");
        }
        if (content != null) sb.append(content);
        return sb.toString();
    }
}
