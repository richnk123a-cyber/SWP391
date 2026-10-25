package com.careerfit.ai.assistant;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssistantChatRequest {

    @NotBlank(message = "Nội dung tin nhắn không được để trống.")
    @Size(max = 4000, message = "Tin nhắn không được vượt quá 4000 ký tự.")
    private String message;

    private List<ChatMessageItem> conversationHistory;

    private Map<String, Object> sessionState;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChatMessageItem {
        private String role; // "user" | "bot" | "assistant"
        private String content;
    }
}
