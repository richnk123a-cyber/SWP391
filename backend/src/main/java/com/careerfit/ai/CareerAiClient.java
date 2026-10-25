package com.careerfit.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * CareerAiClient: Điều phối AI theo mô hình RACE SONG SONG (Parallel Race):
 *
 *   Chiến lược: Gọi ĐỒNG THỜI cả Groq AI + Google Gemma 4 31B (+ Nemotron dự phòng nếu cả 2 thất bại).
 *   - AI nào trả kết quả HỢP LỆ trước thì dùng ngay, hủy các request còn lại.
 *   - Nếu cả 2 AI đầu đều thất bại → gọi AI 3 (Nemotron) như fallback tuần tự.
 *   - Nếu tất cả thất bại → ném exception để tầng trên bắt và dùng Rule-Based Fallback.
 *
 *   Ưu điểm:
 *   - Tốc độ: lấy kết quả của AI nhanh nhất trong số 2-3 AI đang chạy song song.
 *   - Độ tin cậy: không phụ thuộc vào một AI duy nhất.
 *   - AI 2 & AI 3 được bổ sung prompt chuyên biệt để đảm bảo tính chính xác.
 *
 *   Thứ tự ưu tiên khi race hòa: Groq > Gemma > Nemotron.
 */
@Slf4j
@Service
public class CareerAiClient {

    private final GroqAiClient groqClient;
    private final OpenRouterAiClient openRouterClient;
    private final ObjectMapper mapper = new ObjectMapper();

    // Thread pool dùng riêng cho việc gọi AI song song
    private final ExecutorService raceExecutor = Executors.newCachedThreadPool(r -> {
        Thread t = new Thread(r, "ai-race-worker");
        t.setDaemon(true);
        return t;
    });

    @Autowired
    public CareerAiClient(GroqAiClient groqClient, OpenRouterAiClient openRouterClient) {
        this.groqClient = groqClient;
        this.openRouterClient = openRouterClient;
    }

    public static class LadderChatResult {
        @Getter private final String content;
        @Getter private final String decisiveProvider;
        @Getter private final int attempts;

        public LadderChatResult(String content, String decisiveProvider, int attempts) {
            this.content = content;
            this.decisiveProvider = decisiveProvider;
            this.attempts = attempts;
        }
    }

    // ==================================================================================
    // PHƯƠNG THỨC CHÍNH: chatLadder — Gọi song song Groq + Gemma (Race), fallback Nemotron
    // ==================================================================================

    /**
     * Gọi song song Groq AI và Google Gemma 4 31B cùng lúc.
     * AI nào phản hồi HỢP LỆ trước thì lấy kết quả đó ngay lập tức.
     * Nếu cả 2 thất bại → fallback sang NVIDIA Nemotron 3 Super (tuần tự).
     * Nếu Nemotron cũng thất bại → ném exception.
     *
     * @param messages       Danh sách tin nhắn hội thoại (system + user + assistant)
     * @param timeoutSeconds Thời gian timeout tổng (giây)
     * @param jsonResponse   Có yêu cầu trả về JSON hay không
     */
    public LadderChatResult chatLadder(List<Map<String, String>> messages, int timeoutSeconds, boolean jsonResponse) throws Exception {
        boolean hasGroq = groqClient != null && !groqClient.getApiKey().isBlank();
        boolean hasOpenRouter = openRouterClient != null && !openRouterClient.getApiKey().isBlank();

        AiModelDescriptor gemmaModel = hasOpenRouter ? openRouterClient.getModelByIndex(0) : null;  // Google: Gemma 4 31B
        AiModelDescriptor nemotronModel = hasOpenRouter ? openRouterClient.getModelByIndex(2) : null; // NVIDIA: Nemotron 3 Super

        // Tuned messages cho AI 2 & AI 3 (chuẩn hóa tiếng Việt, không markdown rác/emoji)
        List<Map<String, String>> gemmaMessages = hasOpenRouter
                ? buildTunedMessagesForOpenRouter(messages, "Google Gemma 4 31B", jsonResponse) : null;
        List<Map<String, String>> nemotronMessages = hasOpenRouter
                ? buildTunedMessagesForOpenRouter(messages, "NVIDIA Nemotron 3 Super", jsonResponse) : null;

        List<String> errors = new ArrayList<>();

        // QUY TRÌNH BẬC THANG TUẦN TỰ (Sequential Ladder):
        // Groq -> Gemma -> Nemotron -> lặp lại tối đa 2 vòng (tổng 6 lượt thử)
        for (int round = 1; round <= 2; round++) {
            log.info("[AI Ladder] Bắt đầu Vòng {} gọi tuần tự (Groq -> Gemma -> Nemotron)...", round);

            // BẬC 1: Groq AI (Llama 3.3 70B / OSS)
            if (hasGroq) {
                try {
                    log.info("[AI Ladder - Vòng {}] Bậc 1: Gọi Groq ({}) với timeout {}s...", round, groqClient.getModel(), timeoutSeconds);
                    String raw = groqClient.chat(groqClient.getModel(), messages, timeoutSeconds, jsonResponse);
                    if (isValidResponse(raw, jsonResponse)) {
                        String clean = jsonResponse ? extractJson(raw) : cleanFormatting(raw);
                        log.info("[AI Ladder] ✅ Bậc 1 (Groq) phản hồi thành công ở Vòng {}!", round);
                        return new LadderChatResult(clean, "Groq AI (Vòng " + round + ")", (round - 1) * 3 + 1);
                    }
                    errors.add("Vòng " + round + " Groq: Phản hồi không hợp lệ");
                } catch (Exception ex) {
                    log.warn("[AI Ladder - Vòng {}] Bậc 1 (Groq) gặp lỗi: {}", round, ex.getMessage());
                    errors.add("Vòng " + round + " Groq: " + ex.getMessage());
                }
            }

            // BẬC 2: Google Gemma 4 31B qua OpenRouter
            if (hasOpenRouter && gemmaModel != null) {
                try {
                    log.info("[AI Ladder - Vòng {}] Bậc 2: Gọi Google Gemma 4 31B ({}) với timeout {}s...", round, gemmaModel.getPrimaryModelId(), timeoutSeconds);
                    String raw = openRouterClient.callAiChat(gemmaModel, gemmaMessages, timeoutSeconds, jsonResponse);
                    if (isValidResponse(raw, jsonResponse)) {
                        String clean = jsonResponse ? extractJson(raw) : cleanFormatting(raw);
                        log.info("[AI Ladder] ✅ Bậc 2 (Gemma 4 31B) phản hồi thành công ở Vòng {}!", round);
                        return new LadderChatResult(clean, "Google Gemma 4 31B (Vòng " + round + ")", (round - 1) * 3 + 2);
                    }
                    errors.add("Vòng " + round + " Gemma: Phản hồi không hợp lệ");
                } catch (Exception ex) {
                    log.warn("[AI Ladder - Vòng {}] Bậc 2 (Gemma) gặp lỗi: {}", round, ex.getMessage());
                    errors.add("Vòng " + round + " Gemma: " + ex.getMessage());
                }
            }

            // BẬC 3: NVIDIA Nemotron 3 Super qua OpenRouter
            if (hasOpenRouter && nemotronModel != null) {
                try {
                    log.info("[AI Ladder - Vòng {}] Bậc 3: Gọi NVIDIA Nemotron 3 Super ({}) với timeout {}s...", round, nemotronModel.getPrimaryModelId(), timeoutSeconds);
                    String raw = openRouterClient.callAiChat(nemotronModel, nemotronMessages, timeoutSeconds, jsonResponse);
                    if (isValidResponse(raw, jsonResponse)) {
                        String clean = jsonResponse ? extractJson(raw) : cleanFormatting(raw);
                        log.info("[AI Ladder] ✅ Bậc 3 (Nemotron 3 Super) phản hồi thành công ở Vòng {}!", round);
                        return new LadderChatResult(clean, "NVIDIA Nemotron 3 Super (Vòng " + round + ")", (round - 1) * 3 + 3);
                    }
                    errors.add("Vòng " + round + " Nemotron: Phản hồi không hợp lệ");
                } catch (Exception ex) {
                    log.warn("[AI Ladder - Vòng {}] Bậc 3 (Nemotron) gặp lỗi: {}", round, ex.getMessage());
                    errors.add("Vòng " + round + " Nemotron: " + ex.getMessage());
                }
            }
        }

        log.error("[AI Ladder] Đã thử 2 vòng tuần tự qua cả 3 AI (tổng 6 lượt thử) nhưng đều thất bại.");
        throw new RuntimeException("Toàn bộ các mô hình AI (Groq, Gemma, Nemotron) đều không khả dụng sau 2 vòng thử: " + String.join(" | ", errors));
    }

    private String cleanFormatting(String text) {
        if (text == null) return "";
        // Loại bỏ ký tự in đậm markdown ** và các biểu tượng emoji gây khó chịu khi copy
        String cleaned = text.replace("**", "");
        return cleaned.trim();
    }

    // ==================================================================================
    // PROMPT TUNING: Thêm ngữ cảnh chuyên sâu cho AI 2 & AI 3 (Gemma, Nemotron)
    // ==================================================================================

    /**
     * Xây dựng danh sách tin nhắn đã được tăng cường prompt cho AI 2 & AI 3 (OpenRouter).
     * Đảm bảo: 100% tiếng Việt, phạm vi CNTT, tuân thủ JSON tuyệt đối nếu cần.
     * Thêm cả ví dụ minh họa cấu trúc JSON để giảm tỷ lệ sai định dạng xuống gần 0%.
     */
    private List<Map<String, String>> buildTunedMessagesForOpenRouter(
            List<Map<String, String>> original, String aiName, boolean jsonResponse) {

        List<Map<String, String>> tuned = new ArrayList<>();

        StringBuilder systemEnforcement = new StringBuilder();
        systemEnforcement.append("BẠN LÀ TRỢ LÝ AI CAREERFIT CHUYÊN SÂU VỀ CÔNG NGHỆ THÔNG TIN VÀ TUYỂN DỤNG IT TẠI VIỆT NAM")
                .append(" (Đang vận hành qua mô hình ").append(aiName).append(").\n\n");

        systemEnforcement.append("━━━ NGUYÊN TẮC BẮT BUỘC TUYỆT ĐỐI (KHÔNG ĐƯỢC VI PHẠM) ━━━\n\n");

        systemEnforcement.append("① NGÔN NGỮ: Luôn trả lời bằng TIẾNG VIỆT tự nhiên, chuyên nghiệp.\n");
        systemEnforcement.append("   - Giữ nguyên tên riêng và thuật ngữ công nghệ quốc tế: Java, Spring Boot, React,\n");
        systemEnforcement.append("     Docker, Kubernetes, MySQL, PostgreSQL, Git, CI/CD, REST API, JWT, AWS, etc.\n");
        systemEnforcement.append("   - KHÔNG dịch tên công nghệ sang tiếng Việt.\n\n");

        systemEnforcement.append("② PHẠM VI NGHIỆP VỤ: Chỉ hỗ trợ các chủ đề sau:\n");
        systemEnforcement.append("   - Hướng nghiệp ngành CNTT (IT careers, lộ trình học, kỹ năng cần có)\n");
        systemEnforcement.append("   - Tối ưu và chuẩn hóa CV cho sinh viên và chuyên gia IT\n");
        systemEnforcement.append("   - Viết và chuẩn hóa tin tuyển dụng (Job Description) cho công ty IT\n");
        systemEnforcement.append("   - Luyện phỏng vấn kỹ thuật (coding, system design, behavioral)\n");
        systemEnforcement.append("   - Tư vấn sử dụng nền tảng CareerFit\n");
        systemEnforcement.append("   - Câu hỏi NGOÀI phạm vi trên → từ chối lịch sự bằng tiếng Việt.\n\n");

        systemEnforcement.append("③ PHONG CÁCH & ĐỊNH DẠNG: Thân thiện, cố vấn, trực tiếp đi vào câu trả lời với kiến thức CNTT chính xác.\n");
        systemEnforcement.append("   - KHÔNG sử dụng ký tự in đậm markdown (**) trong câu trả lời.\n");
        systemEnforcement.append("   - KHÔNG sử dụng các biểu tượng emoji cảm xúc rác.\n\n");

        if (jsonResponse) {
            systemEnforcement.append("④ ĐỊNH DẠNG JSON TUYỆT ĐỐI (CỰC KỲ QUAN TRỌNG):\n");
            systemEnforcement.append("   - Phản hồi của bạn PHẢI LÀ và CHỈ LÀ một chuỗi JSON thuần túy hợp lệ.\n");
            systemEnforcement.append("   - Bắt đầu bằng ký tự { và kết thúc bằng ký tự } — không có gì khác.\n");
            systemEnforcement.append("   - TUYỆT ĐỐI CẤM:\n");
            systemEnforcement.append("     × Văn bản trước hoặc sau JSON (\"Đây là kết quả:\", \"Chúc bạn...\" v.v.)\n");
            systemEnforcement.append("     × Khối mã Markdown: ```json ... ``` hoặc ``` ... ```\n");
            systemEnforcement.append("     × Ký tự xuống dòng thừa trước { hoặc sau }\n");
            systemEnforcement.append("     × Comment trong JSON (// ... hoặc /* ... */)\n");
            systemEnforcement.append("   - Tất cả giá trị chuỗi trong JSON phải bằng TIẾNG VIỆT (trừ tên công nghệ).\n\n");
            systemEnforcement.append("   VÍ DỤ ĐÚNG (chỉ JSON thuần, không gì thêm):\n");
            systemEnforcement.append("   {\"key\": \"Giá trị tiếng Việt\", \"skills\": [\"Java\", \"Spring Boot\"]}\n\n");
            systemEnforcement.append("   VÍ DỤ SAI (có văn bản thừa — KHÔNG được làm):\n");
            systemEnforcement.append("   Kết quả phân tích: ```json{\"key\": \"value\"}```\n\n");
        }

        // Gộp với system prompt gốc (nếu có)
        String existingSystem = "";
        for (Map<String, String> m : original) {
            if ("system".equalsIgnoreCase(m.get("role"))) {
                existingSystem = m.getOrDefault("content", "");
                break;
            }
        }

        String fullSystem = systemEnforcement.toString();
        if (!existingSystem.isBlank()) {
            fullSystem += "\n━━━ YÊU CẦU NGHIỆP VỤ CỤ THỂ CỦA TASK NÀY ━━━\n" + existingSystem;
        }

        tuned.add(Map.of("role", "system", "content", fullSystem));

        // Thêm các tin nhắn hội thoại (bỏ system prompt gốc vì đã gộp)
        for (Map<String, String> m : original) {
            String role = m.getOrDefault("role", "user");
            if (!"system".equalsIgnoreCase(role)) {
                tuned.add(Map.of("role", role, "content", m.getOrDefault("content", "")));
            }
        }

        // Nhắc nhở thêm ở cuối user message nếu cần JSON
        if (jsonResponse && !tuned.isEmpty()) {
            Map<String, String> lastMsg = tuned.get(tuned.size() - 1);
            if ("user".equalsIgnoreCase(lastMsg.get("role"))) {
                String reinforced = lastMsg.get("content")
                        + "\n\n⚠️ NHẮC NHỞ CUỐI: Hãy xuất DUY NHẤT một đối tượng JSON hợp lệ theo đúng cấu trúc được yêu cầu."
                        + " KHÔNG thêm bất kỳ văn bản giải thích nào. Bắt đầu ngay bằng ký tự {.";
                tuned.set(tuned.size() - 1, Map.of("role", "user", "content", reinforced));
            }
        }

        return tuned;
    }

    // ==================================================================================
    // TIỆN ÍCH
    // ==================================================================================

    private boolean isValidResponse(String text, boolean jsonResponse) {
        if (text == null || text.trim().isBlank()) return false;
        if (!jsonResponse) return true;

        try {
            String json = extractJson(text);
            JsonNode node = mapper.readTree(json);
            return node != null && node.isObject() && !node.isEmpty();
        } catch (Exception e) {
            return false;
        }
    }

    public String extractJson(String text) {
        if (text == null) return "{}";
        String s = text.trim();

        // Xóa markdown block ```json ... ``` hoặc ``` ... ```
        if (s.startsWith("```json")) {
            s = s.substring(7);
        } else if (s.startsWith("```")) {
            s = s.substring(3);
        }
        if (s.endsWith("```")) {
            s = s.substring(0, s.length() - 3);
        }
        s = s.trim();

        // Trích xuất từ { đầu tiên đến } cuối cùng
        int first = s.indexOf('{');
        int last = s.lastIndexOf('}');
        if (first != -1 && last != -1 && last > first) {
            return s.substring(first, last + 1).trim();
        }
        return s;
    }

    /**
     * Tương thích ngược với interface cũ — vẫn dùng chatLadder nội bộ.
     */
    public String chat(List<Map<String, String>> messages, int timeout, boolean jsonResponse) throws Exception {
        LadderChatResult result = chatLadder(messages, timeout, jsonResponse);
        return result.getContent();
    }

    public String getApiKey() {
        if (groqClient != null && !groqClient.getApiKey().isBlank()) return groqClient.getApiKey();
        if (openRouterClient != null && !openRouterClient.getApiKey().isBlank()) return openRouterClient.getApiKey();
        return "";
    }

    public OpenRouterAiClient.WebResult searchLearningResources(String query, List<String> domains) throws Exception {
        return openRouterClient.searchLearningResources(query, domains);
    }
}
