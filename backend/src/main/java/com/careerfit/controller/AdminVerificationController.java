package com.careerfit.controller;

import com.careerfit.dto.CompanyResponse;
import com.careerfit.exception.ApiResponse;
import com.careerfit.model.Company;
import com.careerfit.repository.CompanyRepository;
import com.careerfit.service.EmployerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/verifications")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminVerificationController {

    private final CompanyRepository companyRepository;
    private final EmployerService employerService;

    // GET /api/admin/verifications - Lấy danh sách tất cả công ty chờ xác minh
    @GetMapping
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getPendingVerifications() {
        List<CompanyResponse> pending = companyRepository.findByVerificationStatus("Pending")
                .stream()
                .map(employerService::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách chờ xác minh thành công.", pending));
    }

    // GET /api/admin/verifications/all - Lấy tất cả công ty (mọi trạng thái)
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<CompanyResponse>>> getAllVerifications() {
        List<CompanyResponse> all = companyRepository.findAll()
                .stream()
                .filter(c -> c.getVerificationStatus() != null)
                .map(employerService::mapToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách xác minh thành công.", all));
    }

    // PUT /api/admin/verifications/{id}/approve - Admin phê duyệt xác minh doanh nghiệp
    @PutMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<CompanyResponse>> approveVerification(@PathVariable String id) {
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công ty với id: " + id));
        company.setVerificationStatus("Verified");
        company.setRejectionReason(null);
        company = companyRepository.save(company);

        // Dọn dẹp các bản ghi mồ côi cùng email
        if (company.getEmail() != null && !company.getEmail().isBlank()) {
            List<Company> duplicates = companyRepository.findAllByEmail(company.getEmail().toLowerCase());
            for (Company dup : duplicates) {
                if (!dup.getId().equals(company.getId())) {
                    companyRepository.delete(dup);
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Đã phê duyệt xác minh doanh nghiệp.", employerService.mapToResponse(company)));
    }

    // PUT /api/admin/verifications/{id}/reject - Admin từ chối xác minh doanh nghiệp
    @PutMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<CompanyResponse>> rejectVerification(
            @PathVariable String id,
            @RequestBody Map<String, String> body) {
        String reason = body.getOrDefault("reason", "");
        Company company = companyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy công ty với id: " + id));
        company.setVerificationStatus("Rejected");
        company.setRejectionReason(reason);
        company = companyRepository.save(company);

        // Dọn dẹp các bản ghi mồ côi cùng email
        if (company.getEmail() != null && !company.getEmail().isBlank()) {
            List<Company> duplicates = companyRepository.findAllByEmail(company.getEmail().toLowerCase());
            for (Company dup : duplicates) {
                if (!dup.getId().equals(company.getId())) {
                    companyRepository.delete(dup);
                }
            }
        }

        return ResponseEntity.ok(ApiResponse.success("Đã từ chối xác minh doanh nghiệp.", employerService.mapToResponse(company)));
    }
}
