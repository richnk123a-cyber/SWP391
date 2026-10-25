package com.careerfit.ai.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadResponse {
    private boolean success;
    private String message;
    private String targetType; // "CV" hoặc "JOB"
    private String fileName;
    private int extractedLength;
    private String providerUsed; // VD: "Groq AI (AI 1, Vòng 1)"
    private String aiSummary;
    private Map<String, Object> cvData;
    private Map<String, Object> jobData;
}
