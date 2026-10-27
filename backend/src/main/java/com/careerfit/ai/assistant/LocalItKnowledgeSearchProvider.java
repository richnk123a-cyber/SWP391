package com.careerfit.ai.assistant;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

/**
 * Nhà cung cấp tra cứu kiến thức CNTT nội bộ & kiến thức đã học (Mức 1 - Verified Knowledge Base).
 * Tích hợp chặt chẽ với BM25 Retriever và kho tri thức đa nguồn (resources + database).
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LocalItKnowledgeSearchProvider implements SearchProvider {

    private final AiAssistantKnowledgeService knowledgeService;

    @Override
    public SearchResult search(String query, int maxResults) {
        if (query == null || query.isBlank()) {
            return SearchResult.builder()
                    .query("")
                    .level(KnowledgeLevel.LEVEL_3_INSUFFICIENT)
                    .verified(false)
                    .references(List.of())
                    .build();
        }

        // 1. Kiểm tra trong kho kiến thức đã học trước đó theo queryHash
        var learnedOpt = knowledgeService.findLearnedKnowledge(query);
        if (learnedOpt.isPresent()) {
            var lk = learnedOpt.get();
            log.info("[Local Provider] Tái sử dụng thành công kiến thức đã lưu trong DB (lần thứ {}) cho query: '{}'",
                    lk.getAccessCount(), query);

            List<String> refs = new ArrayList<>();
            if (lk.getSourceUrl() != null && !lk.getSourceUrl().isBlank()) {
                refs.add(lk.getSourceUrl());
            }

            return SearchResult.builder()
                    .query(query)
                    .level(KnowledgeLevel.LEVEL_1_VERIFIED_KB)
                    .source("Kho tri thức bền vững đã học (Learned Knowledge)")
                    .title(lk.getTitle() != null ? lk.getTitle() : lk.getOriginalQuery())
                    .snippet(lk.getSummaryContent())
                    .verified(true)
                    .references(refs)
                    .build();
        }

        // 2. Truy xuất bằng BM25 từ toàn bộ kho Knowledge Base (Nội bộ + Tri thức đã học)
        List<RetrievalResult> topResults = knowledgeService.retrieveTopChunks(query, Math.max(1, maxResults));
        if (!topResults.isEmpty()) {
            RetrievalResult bestMatch = topResults.get(0);
            // Ngưỡng điểm tin cậy BM25
            if (bestMatch.getScore() >= 1.2) {
                KnowledgeChunk chunk = bestMatch.getChunk();
                String sourceDesc = chunk.isLearned()
                        ? "Kho tri thức bền vững đã học (Learned Knowledge - Score: " + String.format("%.2f", bestMatch.getScore()) + ")"
                        : "CareerFit Verified Knowledge Base (Level 1 - Score: " + String.format("%.2f", bestMatch.getScore()) + ")";

                List<String> refs = new ArrayList<>();
                if (chunk.getSourceUrl() != null && !chunk.getSourceUrl().isBlank()) {
                    refs.add(chunk.getSourceUrl());
                } else if (chunk.getSource() != null) {
                    refs.add(chunk.getSource());
                }

                log.debug("[Local Provider] Tìm thấy chunk phù hợp [{}] với điểm BM25: {}", chunk.getTitle(), bestMatch.getScore());
                return SearchResult.builder()
                        .query(query)
                        .level(KnowledgeLevel.LEVEL_1_VERIFIED_KB)
                        .source(sourceDesc)
                        .title(chunk.getTitle())
                        .snippet(chunk.getContent())
                        .verified(true)
                        .references(refs)
                        .build();
            }
        }

        return SearchResult.builder()
                .query(query)
                .level(KnowledgeLevel.LEVEL_3_INSUFFICIENT)
                .verified(false)
                .references(List.of())
                .build();
    }
}
