package com.careerfit.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class JobResponse {
    private String id;
    private String companyName;
    private String employerId;
    private String title;
    private String category;
    private String jobType;
    private String location;
    private String salary;
    private Long salaryMin;
    private Long salaryMax;
    private String salaryCurrency;
    private String postedDate;
    private String description;
    private String responsibilities;
    private String requirements;
    private String requiredSkills;
    private String preferredSkills;
    private String deadline;
    private String verificationStatus;
    private String rejectionReason;
    private Boolean isVisible;
    private boolean isSaved;
}
