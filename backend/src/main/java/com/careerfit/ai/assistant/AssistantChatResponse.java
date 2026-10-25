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

    private String providerUsed; // "Groq", "Gemini", "Rule-Based"

    private boolean quotaExceeded;

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
