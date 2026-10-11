package com.careerfit.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class ReportHistoryResponse {
    private String id;
    private String fromStatus;
    private String toStatus;
    private String changedBy;
    private String changedByEmail;
    private String adminNote;
    private LocalDateTime createdAt;
}
