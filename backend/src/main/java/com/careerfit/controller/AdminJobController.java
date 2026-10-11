package com.careerfit.controller;

import com.careerfit.dto.JobResponse;
import com.careerfit.exception.ApiResponse;
import com.careerfit.service.AdminJobService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/jobs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminJobController {

    private final AdminJobService adminJobService;

    // GET /api/admin/jobs - Lấy tất cả tin tuyển dụng (để Admin kiểm duyệt)
    @GetMapping
    public ResponseEntity<ApiResponse<List<JobResponse>>> getAllJobs() {
        List<JobResponse> jobs = adminJobService.getAllJobs();
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tất cả tin tuyển dụng thành công.", jobs));
    }

    // GET /api/admin/jobs/pending - Lấy danh sách tin đang chờ duyệt
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<JobResponse>>> getPendingJobs() {
        List<JobResponse> jobs = adminJobService.getJobsByStatus("Pending");
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách tin chờ duyệt thành công.", jobs));
    }

    // PUT /api/admin/jobs/{id}/approve - Phê duyệt tin tuyển dụng
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<JobResponse>> approveJob(@PathVariable String id) {
        JobResponse job = adminJobService.approveJob(id);
        return ResponseEntity.ok(ApiResponse.success("Phê duyệt tin tuyển dụng thành công. Bài đăng đã hiển thị công khai!", job));
    }

    // PUT /api/admin/jobs/{id}/reject - Từ chối tin tuyển dụng
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<JobResponse>> rejectJob(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "");
        JobResponse job = adminJobService.rejectJob(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Đã từ chối tin tuyển dụng.", job));
    }

    // DELETE /api/admin/jobs/{id} - Gỡ tin đã phê duyệt
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> removeJob(@PathVariable String id) {
        adminJobService.removeJob(id);
        return ResponseEntity.ok(ApiResponse.success("Đã gỡ bỏ tin tuyển dụng khỏi hệ thống."));
    }
}
