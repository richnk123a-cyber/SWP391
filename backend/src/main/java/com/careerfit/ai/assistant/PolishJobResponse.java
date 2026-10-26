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
public class PolishJobResponse {
    private String improvedTitle;
    private String improvedResponsibilities;
    private String improvedRequirements;
    private List<String> normalizedRequiredSkills;
    private List<String> normalizedPreferredSkills;
    private String improvedBenefits;
    private int qualityScore; // 0 - 100
    private List<String> qualityChecklist;
    private List<String> suggestions;
    private String rawAiAdvice;
    private String providerUsed;
    private java.util.Map<String, Object> templateJobData;
}
