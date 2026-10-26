package com.careerfit.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.*;

@Slf4j
@Service
public class GroqAiClient {
    private static final String DEFAULT_GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

    @Getter
    private final String apiKey;
    @Getter
    private final String model;
    private final String apiUrl;
    private final HttpClient http;
    private final ObjectMapper mapper = new ObjectMapper();

    public GroqAiClient() {
        this("", "llama-3.3-70b-versatile", DEFAULT_GROQ_URL, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    @Autowired
    public GroqAiClient(@Value("${careerfit.ai.groq.api-key:}") String apiKey,
                        @Value("${careerfit.ai.groq.model:llama-3.3-70b-versatile}") String model,
                        @Value("${careerfit.ai.groq.api-url:" + DEFAULT_GROQ_URL + "}") String apiUrl) {
        this(apiKey, model, apiUrl, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build());
    }

    public GroqAiClient(String apiKey, String model, String apiUrl, HttpClient http) {
        this.apiKey = apiKey != null ? apiKey.trim() : "";
        this.model = model != null && !model.isBlank() ? model.trim() : "llama-3.3-70b-versatile";
        this.apiUrl = apiUrl != null && !apiUrl.isBlank() ? apiUrl.trim() : DEFAULT_GROQ_URL;
        this.http = http;
    }

    public List<AiModelDescriptor> models() {
        if (apiKey.isBlank()) return List.of();
        return List.of(AiModelDescriptor.builder()
                .displayName("Groq · " + model)
                .primaryModelId("groq:" + model)
                .provider("Groq")
                .enabled(true)
                .build());
    }

    public boolean isGroqModel(String modelId) {
        return modelId != null && (modelId.startsWith("groq:") || modelId.equals(this.model));
    }

    public String evaluate(String modelId, String prompt, String context, int timeoutSeconds, JsonNode schema) throws Exception {
        if (apiKey.isBlank()) {
            throw new AiProviderException(401, "Chưa cấu hình GROQ_API_KEY trong backend/.env.");
        }
        String selectedModel = modelId == null || modelId.isBlank() ? model : modelId;
        String cleanModel = selectedModel.startsWith("groq:") ? selectedModel.substring(5) : selectedModel;
        Map<String, Object> body = new HashMap<>();
        body.put("model", cleanModel);
        body.put("messages", List.of(
                Map.of("role", "system", "content", prompt == null ? "Return a JSON object." : prompt),
                Map.of("role", "user", "content", context == null ? "" : context)
        ));
        body.put("response_format", schema == null ? Map.of("type", "json_object")
                : Map.of("type", "json_schema", "json_schema",
                    Map.of("name", "careerfit_response", "strict", true, "schema", schema)));
        body.put("temperature", 0.2);
        body.put("max_completion_tokens", schema == null ? 4096 : 7000);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(Math.max(timeoutSeconds, 30)))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            // Provider error bodies may contain portions of the submitted CV/prompt.
            log.warn("Groq API error HTTP {}", response.statusCode());
            throw AiProviderException.http("Groq", response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            if ("length".equals(choices.get(0).path("finish_reason").asText())) {
                throw new AiProviderException(502, "Groq đã hết giới hạn đầu ra trước khi hoàn thành JSON. Vui lòng thử lại với nội dung ngắn hơn.");
            }
            if (!choices.get(0).path("message").path("refusal").isNull()
                    && !choices.get(0).path("message").path("refusal").asText("").isBlank()) {
                throw new AiProviderException(502, "Groq từ chối xử lý yêu cầu này.");
            }
            String content = choices.get(0).path("message").path("content").asText();
            if (content != null && !content.isBlank()) {
                return content.trim();
            }
        }
        throw new AiProviderException(502, "Groq không trả về nội dung đánh giá.");
    }

    public String chat(String modelId, List<Map<String, String>> messages, int timeoutSeconds, boolean jsonResponse) throws Exception {
        if (apiKey.isBlank()) {
            throw new AiProviderException(401, "Chưa cấu hình GROQ_API_KEY trong backend/.env.");
        }
        String selectedModel = modelId == null || modelId.isBlank() ? model : modelId;
        String cleanModel = selectedModel.startsWith("groq:") ? selectedModel.substring(5) : selectedModel;
        Map<String, Object> body = new HashMap<>();
        body.put("model", cleanModel);
        body.put("messages", messages != null ? messages : List.of());
        if (jsonResponse) {
            body.put("response_format", Map.of("type", "json_object"));
        }
        body.put("temperature", 0.3);
        body.put("max_completion_tokens", 4096);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(apiUrl))
                .timeout(Duration.ofSeconds(Math.max(timeoutSeconds, 30)))
                .header("Content-Type", "application/json")
                .header("Authorization", "Bearer " + apiKey)
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            log.warn("Groq chat API error HTTP {}", response.statusCode());
            throw AiProviderException.http("Groq", response.statusCode());
        }

        JsonNode root = mapper.readTree(response.body());
        JsonNode choices = root.path("choices");
        if (choices.isArray() && !choices.isEmpty()) {
            if ("length".equals(choices.get(0).path("finish_reason").asText())) {
                throw new AiProviderException(502, "Groq đã vượt quá giới hạn đầu ra tối đa.");
            }
            if (!choices.get(0).path("message").path("refusal").isNull()
                    && !choices.get(0).path("message").path("refusal").asText("").isBlank()) {
                throw new AiProviderException(502, "Groq từ chối xử lý yêu cầu.");
            }
            String content = choices.get(0).path("message").path("content").asText();
            if (content != null && !content.isBlank()) {
                return content.trim();
            }
        }
        throw new AiProviderException(502, "Groq không trả về phản hồi hợp lệ.");
    }
}
