package com.careerfit.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
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
    private Boolean hasCv;
    private String cvFileName;
    private String cvUploadDate;
    private String desiredRole;
    private String expectedSalary;
}
