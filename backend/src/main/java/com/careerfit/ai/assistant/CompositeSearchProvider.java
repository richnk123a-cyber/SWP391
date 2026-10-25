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
 * - Mức 1: Knowledge Base nội bộ và Từ điển CNTT đã kiểm chứng (LocalItKnowledgeSearchProvider)
 * - Mức 2: Tra cứu nguồn bên ngoài có kiểm soát (nếu có cấu hình, lọc sạch PII)
 * - Mức 3: Chưa đủ bằng chứng (minh bạch, không giả mạo đã tra cứu internet)
 */
@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class CompositeSearchProvider implements SearchProvider {

    private final LocalItKnowledgeSearchProvider localProvider;
    private final CareerAiClient aiClient;

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

        // TẦNG 1: Kiểm chứng qua Knowledge Base & Curated IT Dictionary nội bộ
        SearchResult localResult = localProvider.search(query, maxResults);
        if (localResult != null && localResult.getLevel() == KnowledgeLevel.LEVEL_1_VERIFIED_KB) {
            log.debug("Tra cứu thành công từ Mức 1 (Verified Knowledge Base) cho query: {}", query);
            return localResult;
        }

        // TẦNG 2: Tra cứu tài liệu kỹ thuật bên ngoài (nếu AI Client hỗ trợ tìm kiếm tài liệu học tập)
        String sanitizedQuery = sanitizeTechnicalQuery(query);
        if (sanitizedQuery != null && !sanitizedQuery.isBlank()) {
            try {
                // Kiểm tra xem hệ thống có API key cấu hình cho tìm kiếm không
                if (aiClient != null && !aiClient.getApiKey().isBlank()) {
                    List<String> trustedDomains = List.of(
                            "developer.mozilla.org", "docs.oracle.com", "spring.io",
                            "geeksforgeeks.org", "w3schools.com", "baeldung.com"
                    );
                    OpenRouterAiClient.WebResult extResult = aiClient.searchLearningResources(sanitizedQuery, trustedDomains);
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

                            log.debug("Tra cứu thành công từ Mức 2 (External Docs Search) cho query: {}", sanitizedQuery);
                            return SearchResult.builder()
                                    .query(query)
                                    .level(KnowledgeLevel.LEVEL_2_EXTERNAL_SEARCH)
                                    .source("Tài liệu kỹ thuật chính thức & Nguồn học thuật trực tuyến (Mức 2)")
                                    .title("Kết quả tra cứu tài nguyên: " + sanitizedQuery)
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

        // TẦNG 3: Không đủ bằng chứng xác minh bên ngoài -> Trả về Mức 3 minh bạch
        return SearchResult.builder()
                .query(query)
                .level(KnowledgeLevel.LEVEL_3_INSUFFICIENT)
                .source("Nội bộ CareerFit")
                .title("Chưa có nguồn kiểm chứng độc lập")
                .snippet("Khái niệm chưa có trong Knowledge Base đã xác minh. Cần phân tích ngữ nghĩa hoặc hỏi người dùng làm rõ.")
                .verified(false)
                .references(List.of())
                .build();
    }

    /**
     * Làm sạch câu hỏi, loại bỏ dữ liệu nhạy cảm cá nhân trước khi gửi truy vấn tra cứu
     */
    private String sanitizeTechnicalQuery(String raw) {
        if (raw == null) return null;
        String cleaned = raw.replaceAll("(?i)\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", "") // Bỏ email
                .replaceAll("\\b0\\d{9,10}\\b", "") // Bỏ số điện thoại
                .replaceAll("(?i)bỏ qua|ignore|system prompt|bypass", "")
                .trim();
        return cleaned.length() > 200 ? cleaned.substring(0, 200) : cleaned;
    }
}
