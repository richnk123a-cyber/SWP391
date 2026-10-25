package com.careerfit.ai.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolishCvResponse {
    private List<String> normalizedSkills;
    private String suggestedBio;
    private String improvedProjects;
    private String improvedExperience;
    private List<String> improvements;
    private List<String> missingSkills;
    private List<String> readabilityTips;
    private String rawAiAdvice;
    private String providerUsed;
    private java.util.Map<String, Object> templateCvData;
}
