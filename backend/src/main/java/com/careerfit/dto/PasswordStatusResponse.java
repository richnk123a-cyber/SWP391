package com.careerfit.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordStatusResponse {
    private boolean hasPassword;
    private String authProvider;
    private String email;
}
