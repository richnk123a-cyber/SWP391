package com.careerfit.ai.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Kết quả tra cứu kiến thức kiểm chứng
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SearchResult {
    private String query;
    private KnowledgeLevel level;
    private String source;
    private String title;
    private String snippet;
    private boolean verified;
    private List<String> references;
}
