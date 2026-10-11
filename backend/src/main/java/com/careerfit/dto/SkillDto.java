package com.careerfit.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SkillDto {
    private String id;
    private String name;
    private String category;
    private String description;
    private Boolean isActive;
}
