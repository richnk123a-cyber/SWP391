package com.careerfit.controller;

import com.careerfit.dto.CandidateProfileResponse;
import com.careerfit.dto.UpdateCandidateProfileRequest;
import com.careerfit.exception.ApiResponse;
import com.careerfit.service.CandidateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

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

    // ============================================================
    // UC04 (SCRUM-69, SCRUM-35) - TẢI LÊN / CẬP NHẬT CV (PDF/DOCX)
    // ============================================================
    @PostMapping(value = "/cv", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CandidateProfileResponse>> uploadOrUpdateCv(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        String userId = userDetails.getUsername();
        CandidateProfileResponse updated = candidateService.uploadOrUpdateCv(userId, file);
        return ResponseEntity.ok(ApiResponse.success("Tải lên và trích xuất CV thành công.", updated));
    }

    // ============================================================
    // UC05 (SCRUM-36) - XÓA CV
    // ============================================================
    @DeleteMapping("/cv")
    public ResponseEntity<ApiResponse<CandidateProfileResponse>> deleteCv(
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        CandidateProfileResponse updated = candidateService.deleteCv(userId);
        return ResponseEntity.ok(ApiResponse.success("Xóa CV thành công.", updated));
    }

    // ============================================================
    // TẢI / XEM LẠI FILE CV
    // ============================================================
    @GetMapping("/cv/download")
    public ResponseEntity<Resource> downloadCv(
            @AuthenticationPrincipal UserDetails userDetails) {
        String userId = userDetails.getUsername();
        Resource resource = candidateService.getCvFileResource(userId);
        String fileName = candidateService.getCvFileName(userId);

        MediaType mediaType = fileName.toLowerCase().endsWith(".pdf")
                ? MediaType.APPLICATION_PDF
                : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
