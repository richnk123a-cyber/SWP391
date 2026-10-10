package com.careerfit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class OAuthRegisterRequest {
    @NotBlank(message = "Registration token không được để trống.")
    private String tempToken;

    @NotBlank(message = "Email không được để trống.")
    private String email;

    @NotBlank(message = "Vai trò không được để trống.")
    private String role; // Sẽ nhận giá trị "CANDIDATE" hoặc "EMPLOYER"

    private String fullName;
    private String phone;
    private String location;
    
    // Của Ứng viên
    private String targetRole;
    private String level;

    // Của Doanh nghiệp
    private String companyName;
    private String industry;
    private String website;
    private String taxId;
}