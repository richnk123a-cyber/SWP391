package com.careerfit.ai.assistant;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolishJobRequest {
    private String title;
    private String category;
    private String responsibilities;
    private String requirements;
    private String requiredSkills;
    private String preferredSkills;
    private String benefits;
    private String salary;
    private String location;
    private String jobType;
}
