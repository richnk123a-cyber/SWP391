package com.careerfit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateReportRequest {
    @NotBlank(message = "Vui lòng chọn lý do báo cáo.")
    @Size(max = 255, message = "Lý do báo cáo không được vượt quá 255 ký tự.")
    private String reason;

    @Size(max = 2000, message = "Mô tả chi tiết không được vượt quá 2.000 ký tự.")
    private String description;
}
