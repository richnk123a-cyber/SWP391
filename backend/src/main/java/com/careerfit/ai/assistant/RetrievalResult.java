package com.careerfit.ai.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Kết quả truy xuất tri thức kèm điểm số liên quan BM25
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RetrievalResult {

    private KnowledgeChunk chunk;
    private double score;
    private List<String> matchedTerms;

    public boolean isHighlyRelevant(double threshold) {
        return score >= threshold;
    }
}
