package com.careerfit.controller;

import com.careerfit.dto.CandidateProfileResponse;
import com.careerfit.dto.UpdateCandidateProfileRequest;
import com.careerfit.exception.ApiResponse;
import com.careerfit.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/candidate")
@RequiredArgsConstructor
@PreAuthorize("hasRole('CANDIDATE')")
public class CandidateController {

    private final CandidateService candidateService;

    // GET /api/candidate/profile
    // Ứng viên xem hồ sơ của chính mình
    @GetMapping("/profile")
    public ResponseEntity<ApiResponse<CandidateProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        CandidateProfileResponse profile = candidateService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Lấy hồ sơ thành công.", profile));
    }

    // PUT /api/candidate/profile
    // Ứng viên cập nhật hồ sơ của chính mình
    @PutMapping("/profile")
    public ResponseEntity<ApiResponse<CandidateProfileResponse>> updateMyProfile(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateCandidateProfileRequest request) {
        String userId = userDetails.getUsername();
        CandidateProfileResponse updated = candidateService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật hồ sơ thành công.", updated));
    }
}
