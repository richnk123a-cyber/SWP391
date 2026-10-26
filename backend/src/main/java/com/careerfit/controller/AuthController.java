package com.careerfit.controller;

import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import com.careerfit.dto.*;
import com.careerfit.exception.ApiResponse;
import com.careerfit.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @GetMapping("/me")
    public ResponseEntity<java.util.Map<String, Object>> currentSession(
            @AuthenticationPrincipal UserDetails principal) {
        if (principal == null) return ResponseEntity.ok(java.util.Map.of("authenticated", false));
        return ResponseEntity.ok(java.util.Map.of("authenticated", true,
                "user", authService.getCurrentUser(principal.getUsername())));
    }

    // POST /api/auth/login
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Dang nhap thanh cong!", response));
    }

    // POST /api/auth/register/candidate
    @PostMapping("/register/candidate")
    public ResponseEntity<ApiResponse<AuthResponse>> registerCandidate(
            @Valid @RequestBody RegisterCandidateRequest request) {
        AuthResponse response = authService.registerCandidate(request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tao tai khoan Ung vien thanh cong!", response));
    }

    // POST /api/auth/register/employer
    @PostMapping(value = "/register/employer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> registerEmployer(
            @Valid @ModelAttribute RegisterEmployerRequest request,
            @RequestParam("licenseFile") MultipartFile licenseFile) {
            
        authService.registerEmployer(request, licenseFile);
        
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng ký thành công. Đang chờ phê duyệt từ Admin."));
    }

    // POST /api/auth/oauth/complete-registration
    // Called after Google OAuth when new user completes their profile
    @PostMapping(value = "/oauth/complete-registration", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<AuthResponse>> googleCompleteRegistration(
            @Valid @ModelAttribute OAuthRegisterRequest request,
            @RequestParam(value = "licenseFile", required = false) MultipartFile licenseFile) {
        AuthResponse response = authService.oauthCompleteRegistration(request, licenseFile);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dang ky tai khoan thanh cong!", response));
    }

    // Keep legacy endpoint for backward compatibility
    @PostMapping("/oauth-register")
    public ResponseEntity<ApiResponse<AuthResponse>> oauthRegister(
            @Valid @RequestBody OAuthRegisterRequest request) {
        AuthResponse response = authService.oauthCompleteRegistration(request, null);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Dang ky tai khoan thanh cong!", response));
    }

    // GET /api/auth/password-status
    @GetMapping("/password-status")
    public ResponseEntity<ApiResponse<PasswordStatusResponse>> getPasswordStatus(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        PasswordStatusResponse status = authService.getPasswordStatus(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy trạng thái mật khẩu thành công.", status));
    }

    // POST /api/auth/change-password
    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        authService.changePassword(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật mật khẩu thành công!"));
    }

    // DELETE /api/auth/account
    @DeleteMapping("/account")
    public ResponseEntity<ApiResponse<Void>> deleteAccount(
            @AuthenticationPrincipal UserDetails userDetails) {
        if (userDetails == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        authService.deleteAccount(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Tài khoản đã được xóa thành công."));
    }
}
