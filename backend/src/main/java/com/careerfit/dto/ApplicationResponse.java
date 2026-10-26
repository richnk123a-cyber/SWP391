package com.careerfit.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class ApplicationResponse {
    private String id;
    private String jobId;
    private String candidateId;
    private String candidateName;
    private String candidateEmail;
    private String candidateUniversity;
    private String appliedDate;
    private String lastUpdate;
    private String status;
    private String interviewDate;
    private String interviewTime;
    private String meetingLink;
    private String interviewNote;
    private InterviewDetailsDto interviewDetails;
}
