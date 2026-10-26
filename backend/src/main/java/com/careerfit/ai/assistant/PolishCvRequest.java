package com.careerfit.ai.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolishCvRequest {
    private String targetRole;
    private String contactInfo;
    private String skills;
    private String experience;
    private String projects;
    private String education;
    private String certifications;
    private String bio;
}
