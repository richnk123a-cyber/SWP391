package com.careerfit.controller;

import com.careerfit.dto.AuthResponse;
import com.careerfit.exception.ApiResponse;
import com.careerfit.model.User;
import com.careerfit.repository.UserRepository;
import com.careerfit.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/dev")
@RequiredArgsConstructor
@org.springframework.context.annotation.Profile("dev")
public class DevAuthController {

    private final UserRepository userRepository;
    private final JwtUtils jwtUtils;

    // API này bỏ qua mọi quy trình check mật khẩu/OAuth, tự động lấy user mới nhất hoặc user theo email
    @PostMapping("/bypass-login")
    public ResponseEntity<ApiResponse<AuthResponse>> bypassLogin(
            @RequestParam String role, 
            @RequestParam(required = false) String email) {
        
        // Tìm user theo email nếu có, hoặc tìm user mới nhất trong DB khớp với Role yêu cầu
        User user = userRepository.findAll().stream()
            .filter(u -> u.getRole().equalsIgnoreCase(role))
            .filter(u -> email == null || email.isBlank() || u.getEmail().equalsIgnoreCase(email.trim()))
            .max((u1, u2) -> {
                if (u1.getCreatedAt() == null && u2.getCreatedAt() == null) return 0;
                if (u1.getCreatedAt() == null) return -1;
                if (u2.getCreatedAt() == null) return 1;
                return u1.getCreatedAt().compareTo(u2.getCreatedAt());
            })
            .orElseThrow(() -> new RuntimeException("Không tìm thấy user nào trong Database khớp điều kiện. Vui lòng tạo tài khoản trước!"));

        String token = jwtUtils.generateToken(user.getEmail(), user.getRole(), user.getId());
        
        AuthResponse response = AuthResponse.builder()
            .token(token)
            .userId(user.getId())
            .email(user.getEmail())
            .username(user.getUsername())
            .role(user.getRole())
            .status(user.getStatus())
            .build();
            
        return ResponseEntity.ok(ApiResponse.success("Dev login success", response));
    }
}
