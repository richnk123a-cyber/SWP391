package com.careerfit.ai.assistant;

import com.careerfit.ai.CareerAiClient;
import com.careerfit.ai.OpenRouterAiClient;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * CompositeSearchProvider điều phối các tầng kiểm chứng kiến thức theo 3 cấp độ:
 * - Mức 1: Knowledge Base nội bộ & Kho tri thức bền vững đã học (LocalItKnowledgeSearchProvider)
 * - Mức 2: Tra cứu nguồn bên ngoài có kiểm soát, chỉ cho nội dung thuộc phạm vi dự án,
 *          sau đó TỰ ĐỘNG GHI NHỚ vào cơ sở dữ liệu để lần sau không tìm lại.
 * - Mức 3: Chưa đủ bằng chứng (minh bạch, không giả mạo).
 */
@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class CompositeSearchProvider implements SearchProvider {

    private final LocalItKnowledgeSearchProvider localProvider;
    private final AiAssistantKnowledgeService knowledgeService;
    private final CareerAiClient aiClient;

    private static final List<String> TRUSTED_TECHNICAL_DOMAINS = List.of(
            "developer.mozilla.org", "docs.oracle.com", "spring.io",
            "geeksforgeeks.org", "w3schools.com", "baeldung.com",
            "stackoverflow.com", "github.com", "baeldung.com"
    );

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

        // TẦNG 1: Kiểm chứng qua Knowledge Base & Kho tri thức đã học trước đó
        SearchResult localResult = localProvider.search(query, maxResults);
        if (localResult != null && localResult.getLevel() == KnowledgeLevel.LEVEL_1_VERIFIED_KB) {
            log.info("[Composite Search] TẦNG 1 THÀNH CÔNG: Lấy từ Knowledge Base nội bộ / Kho đã học cho query: '{}'", query);
            return localResult;
        }

        // TẦNG 2: Tra cứu tài liệu kỹ thuật bên ngoài
        if (!knowledgeService.isWithinScope(query)) {
            log.info("[Composite Search] Bỏ qua tra cứu bên ngoài vì câu hỏi ngoài phạm vi: '{}'", query);
            return SearchResult.builder()
                    .query(query)
                    .level(KnowledgeLevel.LEVEL_3_INSUFFICIENT)
                    .source("Nội bộ")
                    .title("Không có dữ liệu bổ sung")
                    .snippet("")
                    .verified(false)
                    .references(List.of())
                    .build();
        }

        String sanitizedQuery = VietnameseTextNormalizer.sanitizePiiAndSecrets(query);
        if (sanitizedQuery != null && !sanitizedQuery.isBlank()) {
            try {
                if (aiClient != null && !aiClient.getApiKey().isBlank()) {
                    log.info("[Composite Search] TẦNG 2 KÍCH HOẠT: Tìm kiếm tài nguyên bên ngoài cho query: '{}'", sanitizedQuery);
                    OpenRouterAiClient.WebResult extResult = aiClient.searchLearningResources(sanitizedQuery, TRUSTED_TECHNICAL_DOMAINS);
                    if (extResult != null && extResult.message() != null) {
                        JsonNode msgNode = extResult.message();
                        String content = msgNode.path("content").asText("").trim();
                        if (!content.isBlank()) {
                            List<String> citations = new ArrayList<>();
                            for (JsonNode annotation : msgNode.path("annotations")) {
                                if ("url_citation".equals(annotation.path("type").asText())) {
                                    String u = annotation.path("url_citation").path("url").asText();
                                    if (u != null && !u.isBlank()) citations.add(u);
                                }
                            }

                            String primarySource = !citations.isEmpty() ? citations.get(0) : "OpenRouter Exa Web Search";

                            // GHI NHỚ BỀN VỮNG VÀO DATABASE ĐỂ LẦN SAU KHÔNG PHẢI TÌM LẠI
                            try {
                                knowledgeService.learnAndPersist(query, content, primarySource, 0.85);
                                log.info("[Composite Search] Đã học và lưu bền vững tri thức mới vào DB cho query: '{}'", query);
                            } catch (Exception ex) {
                                log.warn("Không thể lưu kiến thức đã học vào DB: {}", ex.getMessage());
                            }

                            return SearchResult.builder()
                                    .query(query)
                                    .level(KnowledgeLevel.LEVEL_2_EXTERNAL_SEARCH)
                                    .source("Tài liệu kỹ thuật chính thức & Nguồn học thuật trực tuyến (Mức 2)")
                                    .title("Kết quả tra cứu tài nguyên: " + (query.length() > 50 ? query.substring(0, 50) + "..." : query))
                                    .snippet(content)
                                    .verified(true)
                                    .references(citations)
                                    .build();
                        }
                    }
                }
            } catch (Exception ex) {
                log.debug("Không thể tra cứu bên ngoài cho query ({}): {}", sanitizedQuery, ex.getMessage());
            }
        }

        // TẦNG 3: Không đủ bằng chứng xác minh bên ngoài
        log.info("[Composite Search] TẦNG 3: Không có dữ liệu kiểm chứng cho query: '{}'", query);
        return SearchResult.builder()
                .query(query)
                .level(KnowledgeLevel.LEVEL_3_INSUFFICIENT)
                .source("Nội bộ CareerFit")
                .title("Chưa có nguồn kiểm chứng độc lập")
                .snippet("Hệ thống CareerFit hiện chưa có dữ liệu chi tiết đã được xác minh về câu hỏi này.")
                .verified(false)
                .references(List.of())
                .build();
    }
}
