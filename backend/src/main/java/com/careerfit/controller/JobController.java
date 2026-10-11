package com.careerfit.controller;

import com.careerfit.dto.*;
import com.careerfit.exception.ApiResponse;
import com.careerfit.service.JobService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    // ===== PUBLIC ENDPOINTS (không cần token) =====

    // GET /api/jobs?keyword=&location=&category=&jobType=&minSalary=&maxSalary=&sort=&page=0&size=10
    @GetMapping
    public ResponseEntity<ApiResponse<PagedResponse<JobResponse>>> searchJobs(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String jobType,
            @RequestParam(required = false) Long minSalary,
            @RequestParam(required = false) Long maxSalary,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Page<JobResponse> jobs = jobService.searchJobs(
                keyword, location, category, jobType, minSalary, maxSalary, sort, page, size
        );
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy danh sách việc làm thành công.",
                PagedResponse.from(jobs)
        ));
    }

    @GetMapping("/filter-options")
    public ResponseEntity<ApiResponse<JobFilterOptionsResponse>> getFilterOptions() {
        return ResponseEntity.ok(ApiResponse.success(
                "Lấy tùy chọn bộ lọc thành công.",
                jobService.getFilterOptions()
        ));
    }

    // GET /api/jobs/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<JobResponse>> getJobDetail(
            @PathVariable String id,
            @AuthenticationPrincipal UserDetails userDetails) {
        String email = userDetails != null ? userDetails.getUsername() : null;
        JobResponse job = jobService.getJobById(id, email);
        return ResponseEntity.ok(ApiResponse.success("Lấy chi tiết việc làm thành công.", job));
    }

    // ===== EMPLOYER ENDPOINTS =====

    // POST /api/jobs - Đăng tin tuyển dụng mới
    @PostMapping
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> postJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @Valid @RequestBody PostJobRequest request) {
        JobResponse job = jobService.postJob(userDetails.getUsername(), request);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đăng tin tuyển dụng thành công! Đang chờ Admin duyệt.", job));
    }

    // PUT /api/jobs/{jobId} - Chỉnh sửa tin tuyển dụng
    @PutMapping("/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<JobResponse>> updateJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId,
            @Valid @RequestBody PostJobRequest request) {
        JobResponse job = jobService.updateJob(userDetails.getUsername(), jobId, request);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tin tuyển dụng thành công!", job));
    }

    // GET /api/jobs/my - Employer xem tin của mình
    @GetMapping("/my")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getMyJobs(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<JobResponse> jobs = jobService.getMyJobs(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tin tuyển dụng của bạn thành công.", jobs));
    }

    // GET /api/jobs/{jobId}/applications - Employer xem ứng viên nộp vào job
    @GetMapping("/{jobId}/applications")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getApplications(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        List<ApplicationResponse> apps = jobService.getApplicationsByJobId(userDetails.getUsername(), jobId);
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách ứng viên thành công.", apps));
    }

    // DELETE /api/jobs/{jobId} - Employer xóa tin của mình
    @DeleteMapping("/{jobId}")
    @PreAuthorize("hasRole('EMPLOYER')")
    public ResponseEntity<ApiResponse<Void>> deleteMyJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        jobService.deleteJob(userDetails.getUsername(), jobId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa tin tuyển dụng thành công."));
    }

    // ===== CANDIDATE ENDPOINTS =====

    // POST /api/jobs/{jobId}/apply - Nộp đơn ứng tuyển
    @PostMapping("/{jobId}/apply")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<ApplicationResponse>> applyJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        ApplicationResponse app = jobService.applyJob(userDetails.getUsername(), jobId);
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success("Nộp đơn ứng tuyển thành công!", app));
    }

    // DELETE /api/jobs/{jobId}/apply - Hủy đơn ứng tuyển
    @DeleteMapping("/{jobId}/apply")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<Void>> cancelApplication(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        jobService.cancelApplication(userDetails.getUsername(), jobId);
        return ResponseEntity.ok(ApiResponse.success("Đã hủy đơn ứng tuyển thành công."));
    }

    // POST /api/jobs/{jobId}/save - Lưu / bỏ lưu job
    @PostMapping("/{jobId}/save")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<Void>> toggleSaveJob(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String jobId) {
        String message = jobService.toggleSaveJob(userDetails.getUsername(), jobId);
        return ResponseEntity.ok(ApiResponse.success(message));
    }

    // GET /api/jobs/applications/my - Candidate xem lịch sử nộp đơn
    @GetMapping("/applications/my")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<List<ApplicationResponse>>> getMyApplications(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<ApplicationResponse> apps = jobService.getMyApplications(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy lịch sử ứng tuyển thành công.", apps));
    }
}
