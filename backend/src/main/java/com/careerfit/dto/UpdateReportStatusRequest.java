package com.careerfit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateReportStatusRequest {
    @NotBlank(message = "Trạng thái báo cáo là bắt buộc.")
    private String status;

    private String adminNote;
}
