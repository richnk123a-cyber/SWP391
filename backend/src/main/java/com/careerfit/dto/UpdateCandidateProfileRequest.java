package com.careerfit.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateCandidateProfileRequest {

    @Size(min = 2, max = 100, message = "Họ và tên phải từ 2 đến 100 ký tự.")
    @Pattern(
        regexp = "^[\\p{L}\\s\\-'.]+$",
        message = "Họ và tên không hợp lệ."
    )
    private String fullName;

    @Pattern(
        regexp = "^$|^[0-9\\s+\\-().]{8,20}$",
        message = "Số điện thoại không hợp lệ."
    )
    private String phone;

    private String location;
    private String university;
    private String major;
    private String graduationYear;
    private String skills;
    private java.util.List<String> skillList;
    private String desiredRole;
    private String expectedSalary;
    private String bio;
    private String githubUrl;
    private String portfolioUrl;
}
