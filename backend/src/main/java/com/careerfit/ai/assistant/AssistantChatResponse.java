package com.careerfit.ai.assistant;

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
public class AssistantChatResponse {

    private String reply;

    /**
     * Intent phân loại được:
     * GENERAL_CHAT, CV_CREATE, CV_IMPROVE, CV_REVIEW,
     * JOB_CREATE, JOB_IMPROVE, JOB_REVIEW,
     * CAREER_GUIDANCE, INTERVIEW_GUIDANCE, OUT_OF_SCOPE
     */
    private String intent;

    private List<QuickAction> quickActions;

    private Map<String, Object> structuredData;

    private String providerUsed; // "Groq", "Gemini", "Rule-Based Scope Guard", "Fallback"

    private boolean quotaExceeded;

    /**
     * Nguồn tri thức dùng để trả lời:
     * INTERNAL_KB (Nội bộ từ file resources / DB)
     * LEARNED_KB (Từ kho kiến thức bền vững đã học trước đó)
     * EXTERNAL_SEARCH (Vừa học từ bên ngoài)
     * OUT_OF_SCOPE_REFUSAL (Từ chối do ngoài phạm vi)
     */
    private String knowledgeSource;

    /**
     * Danh sách nguồn tham khảo / URL kiểm chứng
     */
    private List<String> citations;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class QuickAction {
        private String label;
        private String prompt;
        private String navPage;
    }
}
