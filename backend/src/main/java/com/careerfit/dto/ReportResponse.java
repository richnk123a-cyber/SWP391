package com.careerfit.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class ReportResponse {
    private String id;
    private String jobId;
    private String jobTitle;
    private String company;
    private String employerId;
    private String reporterId;
    private String reporterName;
    private String reporterEmail;
    private String reason;
    private String description;
    private String status;
    private String adminNote;
    private LocalDateTime createdAt;
    private List<ReportHistoryResponse> history;
}
