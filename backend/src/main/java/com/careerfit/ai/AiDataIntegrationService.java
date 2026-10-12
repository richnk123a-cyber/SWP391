package com.careerfit.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * CLASS 2: AiDataIntegrationService
 * Chức năng: Nhận dữ liệu từ cơ sở dữ liệu (Database), yêu cầu từ Frontend và Backend
 * khi người dùng bấm nút kích hoạt chức năng, chuẩn hóa dữ liệu đầu vào cho AI và
 * tiếp nhận, bóc tách kết quả AI trả về để phản hồi lại cho hệ thống / người dùng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiDataIntegrationService {

    private final ObjectMapper objectMapper;

    /**
     * Nhận và đóng gói dữ liệu từ Frontend, Backend và CSDL thành một AiExecutionRequest hoàn chỉnh.
     *
     * @param featureCode     Mã chức năng (VD: "CV_ANALYSIS", "JOB_RECOMMENDATION", ...)
     * @param featureName     Tên hiển thị của chức năng
     * @param systemPrompt    Prompt nghiệp vụ mặc định được thiết lập sẵn cho chức năng
     * @param userQuery       Yêu cầu / câu hỏi thêm từ người dùng khi bấm nút ở Frontend
     * @param userId          ID người dùng đang đăng nhập
     * @param userRole        Vai trò người dùng (CANDIDATE, EMPLOYER, ADMIN)
     * @param dbDataMap       Map chứa các thực thể/dữ liệu lấy từ các bảng CSDL liên quan
     * @param isDbAnswerReady Đánh dấu dữ liệu trong CSDL đã có câu trả lời hay chưa (true: Luồng 1, false: Luồng 2)
     * @param allowWebSearch  Cho phép tìm kiếm bên ngoài / internet nếu thiếu dữ liệu
     * @return Đối tượng AiExecutionRequest đã chuẩn hóa
     */
    public AiExecutionRequest assembleRequest(
            String featureCode,
            String featureName,
            String systemPrompt,
            String userQuery,
            String userId,
            String userRole,
            Map<String, Object> dbDataMap,
            boolean isDbAnswerReady,
            boolean allowWebSearch
    ) {
        String dbSummaryText = formatDatabaseContext(dbDataMap);

        return AiExecutionRequest.builder()
                .featureCode(featureCode)
                .featureName(featureName)
                .prompt(systemPrompt)
                .userQuery(userQuery)
                .userId(userId)
                .userRole(userRole)
                .databaseContext(dbDataMap != null ? dbDataMap : new HashMap<>())
                .databaseSummaryText(dbSummaryText)
                .answerInDatabase(isDbAnswerReady)
                .allowWebSearch(allowWebSearch)
                .build();
    }

    /**
     * Chuyển đổi dữ liệu CSDL phong phú thành văn bản tóm tắt có cấu trúc để AI dễ đọc hiểu.
     */
    public String formatDatabaseContext(Map<String, Object> dbDataMap) {
        if (dbDataMap == null || dbDataMap.isEmpty()) {
            return "Không có dữ liệu bổ sung trong cơ sở dữ liệu.";
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(dbDataMap);
        } catch (Exception e) {
            log.warn("Không thể serialize databaseContext sang JSON: {}", e.getMessage());
            return dbDataMap.toString();
        }
    }

    /**
     * Xây dựng câu nhắc (User message) tổng hợp gửi cho AI bao gồm:
     * - Yêu cầu nghiệp vụ
     * - Câu hỏi người dùng
     * - Dữ liệu từ cơ sở dữ liệu
     * - Các nguồn tìm kiếm internet (nếu có)
     */
    public String buildUserMessageForAi(AiExecutionRequest request, String webSearchResults) {
        StringBuilder sb = new StringBuilder();

        sb.append("=== THÔNG TIN YÊU CẦU TỪ NGƯỜI DÙNG & HỆ THỐNG ===\n");
        sb.append("Chức năng: ").append(request.getFeatureName() != null ? request.getFeatureName() : request.getFeatureCode()).append("\n");
        if (request.getUserQuery() != null && !request.getUserQuery().isBlank()) {
            sb.append("Yêu cầu bổ sung của người dùng: ").append(request.getUserQuery()).append("\n");
        }
        sb.append("\n=== DỮ LIỆU TỪ CƠ SỞ DỮ LIỆU (DATABASE CONTEXT) ===\n");
        sb.append(request.getDatabaseSummaryText() != null ? request.getDatabaseSummaryText() : "Trống").append("\n");

        if (webSearchResults != null && !webSearchResults.isBlank()) {
            sb.append("\n=== DỮ LIỆU TÌM KIẾM BÊN NGOÀI / INTERNET ===\n");
            sb.append(webSearchResults).append("\n");
        }

        sb.append("\n=== HƯỚNG DẪN TRẢ LỜI ===\n");
        sb.append("Hãy phân tích các dữ liệu trên và đưa ra phản hồi theo cấu trúc JSON sau:\n");
        sb.append("{\n");
        sb.append("  \"reasoning\": \"Luồng suy nghĩ và phân tích chi tiết của bạn\",\n");
        sb.append("  \"answer\": \"Kết luận/Đáp án cụ thể rõ ràng cho người dùng\",\n");
        sb.append("  \"confidence\": 95\n");
        sb.append("}\n");
        sb.append("Lưu ý: Trường confidence là số nguyên từ 0 đến 100 đại diện cho độ tin cậy.\n");

        return sb.toString();
    }

    /**
     * Xây dựng nội dung yêu cầu đánh giá chéo (Cross-Evaluation) giữa các AI (Dùng trong Luồng 2).
     */
    public String buildCrossEvaluationPrompt(
            AiExecutionRequest request,
            String initialReasoning,
            String initialAnswer,
            String previousAiName
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là chuyên gia thẩm định và đánh giá chéo độc lập.\n");
        sb.append("Dưới đây là yêu cầu ban đầu, dữ liệu cơ sở dữ liệu và kết quả xử lý của ").append(previousAiName).append(":\n\n");
        sb.append("--- DỮ LIỆU GỐC & YÊU CẦU ---\n");
        sb.append("Chức năng: ").append(request.getFeatureName()).append("\n");
        sb.append("Yêu cầu người dùng: ").append(request.getUserQuery()).append("\n");
        sb.append("Dữ liệu CSDL: ").append(request.getDatabaseSummaryText()).append("\n\n");

        sb.append("--- LUỒNG SUY NGHĨ CỦA ").append(previousAiName).append(" ---\n");
        sb.append(initialReasoning).append("\n\n");

        sb.append("--- KẾT LUẬN CỦA ").append(previousAiName).append(" ---\n");
        sb.append(initialAnswer).append("\n\n");

        sb.append("Nhiệm vụ của bạn:\n");
        sb.append("1. Đánh giá xem kết luận của ").append(previousAiName).append(" có CHÍNH XÁC và hợp lý không.\n");
        sb.append("2. Nếu ĐỒNG Ý là chính xác, hãy xác nhận và giữ nguyên kết luận.\n");
        sb.append("3. Nếu KHÔNG ĐỒNG Ý (cho ra kết quả khác), hãy đưa ra luồng suy nghĩ và kết luận độc lập của bạn.\n\n");
        sb.append("Phản hồi BẮT BUỘC theo format JSON:\n");
        sb.append("{\n");
        sb.append("  \"isAgreement\": true,\n");
        sb.append("  \"reasoning\": \"Phân tích đánh giá của bạn\",\n");
        sb.append("  \"answer\": \"Kết luận cuối cùng\",\n");
        sb.append("  \"confidence\": 92\n");
        sb.append("}\n");

        return sb.toString();
    }

    /**
     * Bóc tách phản hồi JSON từ AI (hỗ trợ cả trường hợp AI bọc trong ```json ... ```)
     */
    public Map<String, Object> parseAiStructuredResponse(String rawAiResponse) {
        Map<String, Object> result = new HashMap<>();
        if (rawAiResponse == null || rawAiResponse.isBlank()) {
            result.put("answer", "Không nhận được phản hồi từ AI.");
            result.put("confidence", 0.0);
            result.put("reasoning", "Empty response");
            return result;
        }

        try {
            String cleanedJson = extractJsonSubstring(rawAiResponse);
            result = objectMapper.readValue(cleanedJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.debug("Phản hồi AI không phải JSON chuẩn, trích xuất dưới dạng plain text: {}", e.getMessage());
            result.put("answer", rawAiResponse.trim());
            result.put("reasoning", "AI phản hồi trực tiếp văn bản.");
            result.put("confidence", 85.0);
        }

        // Đảm bảo có các trường cần thiết
        if (!result.containsKey("answer")) {
            result.put("answer", rawAiResponse.trim());
        }
        if (!result.containsKey("reasoning")) {
            result.put("reasoning", "Phân tích tự động từ AI.");
        }
        if (!result.containsKey("confidence")) {
            result.put("confidence", 85.0);
        }

        return result;
    }

    private String extractJsonSubstring(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        trimmed = trimmed.trim();

        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    }
}
