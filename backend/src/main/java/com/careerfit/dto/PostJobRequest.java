package com.careerfit.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PostJobRequest {

    @NotBlank(message = "Tiêu đề công việc không được để trống.")
    @Size(max = 150, message = "Tiêu đề không được vượt quá 150 ký tự.")
    private String title;

    @NotBlank(message = "Danh mục không được để trống.")
    private String category;

    @NotBlank(message = "Loại công việc không được để trống.")
    private String jobType;

    @NotBlank(message = "Địa điểm không được để trống.")
    private String location;

    @NotBlank(message = "Mức lương không được để trống.")
    private String salary;

    @jakarta.validation.constraints.Min(value = 0, message = "Lương tối thiểu không được là số âm.")
    private Long salaryMin;

    @jakarta.validation.constraints.Min(value = 0, message = "Lương tối đa không được là số âm.")
    private Long salaryMax;

    @Size(max = 10, message = "Đơn vị tiền tệ không được vượt quá 10 ký tự.")
    private String salaryCurrency;

    private String description;
    private String responsibilities;
    private String requirements;
    private String requiredSkills;
    private String preferredSkills;
    private String deadline;
}
