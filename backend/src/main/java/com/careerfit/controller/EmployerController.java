package com.careerfit.controller;

import com.careerfit.dto.CandidateProfileResponse;
import com.careerfit.dto.CompanyResponse;
import com.careerfit.dto.UpdateCompanyRequest;
import com.careerfit.exception.ApiResponse;
import com.careerfit.service.CandidateService;
import com.careerfit.service.EmployerService;
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
@RequestMapping("/api/employer")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
public class EmployerController {

    private final EmployerService employerService;
    private final CandidateService candidateService;

    // GET /api/employer/company
    // Employer xem thông tin công ty của mình
    @GetMapping("/company")
    public ResponseEntity<ApiResponse<CompanyResponse>> getMyCompany(
            @AuthenticationPrincipal UserDetails userDetails) {
        CompanyResponse company = employerService.getMyCompany(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy thông tin công ty thành công.", company));
    }

    // PUT /api/employer/company
    // Employer cập nhật thông tin công ty của mình
    @PutMapping("/company")
    public ResponseEntity<ApiResponse<CompanyResponse>> updateMyCompany(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody UpdateCompanyRequest request) {
        CompanyResponse updated = employerService.updateMyCompany(userDetails.getUsername(), request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật thông tin công ty thành công.", updated));
    }

    // POST /api/employer/company/logo
    // Employer tải lên logo công ty
    @PostMapping(value = "/company/logo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<CompanyResponse>> uploadCompanyLogo(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam("file") MultipartFile file) {
        CompanyResponse updated = employerService.uploadLogo(userDetails.getUsername(), file);
        return ResponseEntity.ok(ApiResponse.success("Tải lên logo công ty thành công.", updated));
    }

    // ============================================================
    // SCRUM-52: XEM HỒ SƠ ỨNG VIÊN CHI TIẾT
    // ============================================================
    @GetMapping("/candidates/{candidateId}")
    public ResponseEntity<ApiResponse<CandidateProfileResponse>> getCandidateProfile(
            @PathVariable String candidateId) {
        CandidateProfileResponse profile = candidateService.getProfileByCandidateId(candidateId);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết hồ sơ ứng viên thành công.", profile));
    }

    // ============================================================
    // SCRUM-52: TẢI / XEM FILE CV CỦA ỨNG VIÊN
    // ============================================================
    @GetMapping("/candidates/{candidateId}/cv/download")
    public ResponseEntity<Resource> downloadCandidateCv(
            @PathVariable String candidateId) {
        Resource resource = candidateService.getCvFileResourceByCandidateId(candidateId);
        String fileName = candidateService.getCvFileNameByCandidateId(candidateId);

        MediaType mediaType = fileName.toLowerCase().endsWith(".pdf")
                ? MediaType.APPLICATION_PDF
                : MediaType.APPLICATION_OCTET_STREAM;

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + fileName + "\"")
                .body(resource);
    }
}
