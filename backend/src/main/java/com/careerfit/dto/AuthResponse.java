package com.careerfit.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AuthResponse {
    private String token;
    private String userId;
    private String email;
    private String username;
    private String role;
    private String status;
    private String authProvider;
    private Boolean hasCustomPassword;
}

