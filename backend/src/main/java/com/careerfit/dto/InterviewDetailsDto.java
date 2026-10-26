package com.careerfit.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InterviewDetailsDto {
    private String date;
    private String time;
    private String type;
    private String meetingLink;
    private String note;
}
