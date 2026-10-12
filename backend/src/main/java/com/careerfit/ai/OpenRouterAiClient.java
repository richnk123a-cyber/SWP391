package com.careerfit.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

/**
 * CLASS 1: OpenRouterAiClient
 * Chức năng: Khởi tạo cấu hình và thực hiện gọi các mô hình AI thông qua OpenRouter API.
 * Khởi tạo sẵn 3 AI miễn phí:
 *   1. Google: Gemma 4 31B (free)
 *   2. OpenAI: gpt-oss-20b (free)
 *   3. NVIDIA: Nemotron 3 Super (free)
 */
@Slf4j
@Service
public class OpenRouterAiClient {

    private static final String DEFAULT_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

    @Getter
    private final String apiKey;

    @Getter
    private final String apiUrl;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    @Getter
    private final List<AiModelDescriptor> registeredModels = new ArrayList<>();

    public OpenRouterAiClient(
            @Value("${careerfit.ai.openrouter.api-key:}") String apiKey,
            @Value("${careerfit.ai.openrouter.api-url:" + DEFAULT_OPENROUTER_URL + "}") String apiUrl
    ) {
        this.apiKey = (apiKey != null) ? apiKey.trim() : "";
        this.apiUrl = (apiUrl != null && !apiUrl.isBlank()) ? apiUrl.trim() : DEFAULT_OPENROUTER_URL;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(30))
                .build();
        this.objectMapper = new ObjectMapper();

        initializeDefaultAiModels();
    }

    /**
     * Khởi tạo danh sách 3 AI được người dùng yêu cầu:
     * - AI 1: Google: Gemma 4 31B (free)
     * - AI 2: OpenAI: gpt-oss-20b (free)
     * - AI 3: NVIDIA: Nemotron 3 Super (free)
     */
    private void initializeDefaultAiModels() {
        // AI 1: Google: Gemma 4 31B (free)
        AiModelDescriptor ai1 = AiModelDescriptor.builder()
                .displayName("Google: Gemma 4 31B (free)")
                .primaryModelId("google/gemma-4-31b-it:free")
                .fallbackModelIds(List.of(
                        "google/gemma-4-26b-a4b-it:free",
                        "liquid/lfm-2.5-2.6b:free",
                        "google/gemma-4-31b-it",
                        "openrouter/free"
                ))
                .provider("Google")
                .enabled(true)
                .build();

        // AI 2: OpenAI: gpt-oss-20b (free)
        AiModelDescriptor ai2 = AiModelDescriptor.builder()
                .displayName("OpenAI: gpt-oss-20b (free)")
                .primaryModelId("openai/gpt-oss-20b")
                .fallbackModelIds(List.of(
                        "openai/gpt-oss-20b:free",
                        "cohere/north-mini-code:free",
                        "liquid/lfm-2.5-2.6b:free",
                        "openrouter/free"
                ))
                .provider("OpenAI")
                .enabled(true)
                .build();

        // AI 3: NVIDIA: Nemotron 3 Super (free)
        AiModelDescriptor ai3 = AiModelDescriptor.builder()
                .displayName("NVIDIA: Nemotron 3 Super (free)")
                .primaryModelId("nvidia/nemotron-3-super-120b-a12b:free")
                .fallbackModelIds(List.of(
                        "nvidia/nemotron-3.5-lightning:free",
                        "nvidia/nemotron-3-ultra-550b-a55b:free",
                        "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
                        "cohere/north-mini-code:free"
                ))
                .provider("NVIDIA")
                .enabled(true)
                .build();

        registeredModels.add(ai1);
        registeredModels.add(ai2);
        registeredModels.add(ai3);

        log.info("Initialized OpenRouterAiClient with 3 AI models: {}, {}, {}",
                ai1.getDisplayName(), ai2.getDisplayName(), ai3.getDisplayName());
    }

    /**
     * Gọi một AI cụ thể bằng AiModelDescriptor
     *
     * @param modelDescriptor Thông tin mô hình AI
     * @param systemPrompt    Prompt hệ thống / ngữ cảnh
     * @param userMessage     Nội dung câu hỏi / dữ liệu yêu cầu
     * @return Raw text kết quả trả về từ AI
     * @throws Exception khi gặp lỗi mạng, rate-limit (429), timeout hoặc response không hợp lệ
     */
    public String callAi(AiModelDescriptor modelDescriptor, String systemPrompt, String userMessage) throws Exception {
        List<String> candidateModelIds = new ArrayList<>();
        candidateModelIds.add(modelDescriptor.getPrimaryModelId());
        if (modelDescriptor.getFallbackModelIds() != null) {
            candidateModelIds.addAll(modelDescriptor.getFallbackModelIds());
        }

        Exception lastException = null;
        for (String modelId : candidateModelIds) {
            try {
                return executeOpenRouterRequest(modelId, systemPrompt, userMessage);
            } catch (Exception ex) {
                log.warn("Failed calling model [{}] of AI [{}]: {}. Trying fallback model if available...",
                        modelId, modelDescriptor.getDisplayName(), ex.getMessage());
                lastException = ex;
            }
        }

        throw new RuntimeException("Tất cả các model ID của " + modelDescriptor.getDisplayName()
                + " đều gặp sự cố: " + (lastException != null ? lastException.getMessage() : "Unknown error"), lastException);
    }

    /**
     * Thực hiện gửi HTTP POST request đến OpenRouter Chat Completions endpoint
     */
    private String executeOpenRouterRequest(String modelId, String systemPrompt, String userMessage) throws Exception {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("OpenRouter API Key chưa được cấu hình. Vui lòng thiết lập biến môi trường OPENROUTER_API_KEY hoặc cấu hình trong application-local.yml / backend/.env.");
        }

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", modelId);

        List<Map<String, String>> messages = new ArrayList<>();
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            messages.add(Map.of("role", "system", "content", systemPrompt));
        }
        messages.add(Map.of("role", "user", "content", userMessage));
        requestBody.put("messages", messages);
        requestBody.put("temperature", 0.3);

        String jsonPayload = objectMapper.writeValueAsString(requestBody);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(60))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .header("HTTP-Referer", "http://localhost:5173")
                .header("X-Title", "CareerFit Platform")
                .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() >= 200 && response.statusCode() < 300) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                String content = choices.get(0).path("message").path("content").asText();
                if (content != null && !content.isBlank()) {
                    return content.trim();
                }
            }
            throw new RuntimeException("Phản hồi rỗng từ OpenRouter model " + modelId);
        } else {
            throw new RuntimeException("OpenRouter API trả về HTTP " + response.statusCode() + ": " + response.body());
        }
    }

    /**
     * Lấy mô hình AI theo thứ tự chỉ mục (0: AI1 - Google, 1: AI2 - OpenAI, 2: AI3 - NVIDIA)
     */
    public AiModelDescriptor getModelByIndex(int index) {
        if (registeredModels.isEmpty()) {
            throw new IllegalStateException("Không có mô hình AI nào được cấu hình!");
        }
        int safeIndex = ((index % registeredModels.size()) + registeredModels.size()) % registeredModels.size();
        return registeredModels.get(safeIndex);
    }

    /**
     * Số lượng AI đã đăng ký
     */
    public int getModelCount() {
        return registeredModels.size();
    }
}
