package com.careerfit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CandidateProfileResponse {
    private String id;
    private String userId;
    private String fullName;
    private String email;
    private String phone;
    private String location;
    private String university;
    private String major;
    private String graduationYear;
    private String skills;
    private List<String> skillList;
    private String bio;
    private String githubUrl;
    private String portfolioUrl;
    private Boolean hasCv;
    private String cvFileName;
    private String cvUploadDate;
    private String extractedCvText;
    private String desiredRole;
    private String expectedSalary;
}
