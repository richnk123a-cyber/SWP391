package com.careerfit.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LoginRequest {

    @NotBlank(message = "Tên đăng nhập / Email không được để trống.")
    private String email; // Field can hold either email or username

    @NotBlank(message = "Mật khẩu không được để trống.")
    private String password;

    // Optional provider / account type: "ADMIN", "GOOGLE", "MICROSOFT", "LOCAL", or "AUTO"
    private String authProvider;
}

