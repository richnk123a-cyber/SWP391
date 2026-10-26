package com.careerfit.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateApplicationStatusRequest {
    private String status;
    private String interviewDate;
    private String interviewTime;
    private String interviewType;
    private String meetingLink;
    private String interviewNote;
    private InterviewDetailsDto interviewDetails;
}
