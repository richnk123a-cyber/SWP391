package com.careerfit.controller;

import com.careerfit.dto.*;
import com.careerfit.exception.ApiResponse;
import com.careerfit.service.ReportService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @PostMapping("/api/jobs/{jobId}/reports")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<ReportResponse>> createReport(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId,
            @Valid @RequestBody CreateReportRequest request) {
        ReportResponse report = reportService.createReport(userDetails.getUsername(), jobId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Gửi báo cáo thành công.", report));
    }

    @GetMapping("/api/candidate/reports")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<PagedResponse<ReportResponse>>> getMyReports(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy lịch sử báo cáo thành công.",
                PagedResponse.from(reportService.getMyReports(userDetails.getUsername(), page, size))
        ));
    }

    @GetMapping("/api/admin/reports")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<PagedResponse<ReportResponse>>> getAdminReports(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách báo cáo thành công.",
                PagedResponse.from(reportService.getAdminReports(status, keyword, page, size))
        ));
    }

    @GetMapping("/api/admin/reports/{reportId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> getAdminReport(@PathVariable String reportId) {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy chi tiết báo cáo thành công.", reportService.getAdminReport(reportId)
        ));
    }

    @PatchMapping("/api/admin/reports/{reportId}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<ReportResponse>> updateStatus(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String reportId,
            @Valid @RequestBody UpdateReportStatusRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                "Cập nhật trạng thái báo cáo thành công.",
                reportService.updateStatus(userDetails.getUsername(), reportId, request)
        ));
    }
}
