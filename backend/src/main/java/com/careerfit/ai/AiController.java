package com.careerfit.ai;

import com.careerfit.model.Job;
import com.careerfit.model.User;
import com.careerfit.repository.JobRepository;
import com.careerfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller cung cấp REST API cho Frontend kích hoạt chức năng AI.
 */
@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiOrchestratorService orchestratorService;
    private final AiDataIntegrationService integrationService;
    private final OpenRouterAiClient aiClient;
    private final AiSkillDiscoveryService skillDiscoveryService;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;

    /**
     * Lấy danh sách các mô hình AI đang được đăng ký trong hệ thống
     */
    @GetMapping("/models")
    public ResponseEntity<List<AiModelDescriptor>> getRegisteredModels() {
        return ResponseEntity.ok(aiClient.getRegisteredModels());
    }

    /**
     * Endpoint kích hoạt chức năng AI từ Frontend / Backend.
     * Kiểm tra trạng thái tài khoản người dùng và trạng thái kiểm duyệt của tin tuyển dụng.
     */
    @PostMapping("/execute")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<AiExecutionResponse> executeAiFeature(
            @RequestBody AiExecutionRequest request,
            Authentication authentication
    ) {
        log.info("Nhận yêu cầu kích hoạt AI từ Client: featureCode=[{}]", request.getFeatureCode());

        // 1. Kiểm duyệt trạng thái tài khoản người dùng (User Status Check)
        String currentUserId = authentication != null ? authentication.getName() : request.getUserId();
        if (currentUserId != null && !currentUserId.isBlank()) {
            User user = userRepository.findById(currentUserId)
                    .or(() -> userRepository.findByUsername(currentUserId))
                    .or(() -> userRepository.findFirstByEmail(currentUserId.toLowerCase()))
                    .orElse(null);
            if (user != null && user.getStatus() != null && "LOCKED".equalsIgnoreCase(user.getStatus().trim())) {
                log.warn("Tài khoản bị khóa [{}] cố tình kích hoạt AI qua API execute", currentUserId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        AiExecutionResponse.builder()
                                .success(false)
                                .featureCode(request.getFeatureCode())
                                .errorMessage("Tài khoản của bạn đã bị khóa bởi quản trị viên. Không thể sử dụng chức năng AI.")
                                .build()
                );
            }
        }

        // 2. Kiểm duyệt trạng thái tin tuyển dụng (Job Moderation Check)
        String jobId = null;
        if (request.getDatabaseContext() != null && request.getDatabaseContext().containsKey("jobId")) {
            jobId = String.valueOf(request.getDatabaseContext().get("jobId"));
        }
        if (jobId != null && !jobId.isBlank() && !"null".equalsIgnoreCase(jobId) && !"undefined".equalsIgnoreCase(jobId)) {
            Job job = jobRepository.findById(jobId).orElse(null);
            if (job != null) {
                boolean isApproved = job.getVerificationStatus() != null &&
                        ("Verified".equalsIgnoreCase(job.getVerificationStatus()) || "Approved".equalsIgnoreCase(job.getVerificationStatus()));
                boolean isVisible = Boolean.TRUE.equals(job.getIsVisible());

                if (!isApproved || !isVisible) {
                    log.warn("Từ chối AI xử lý do tin tuyển dụng [{}] chưa được Admin phê duyệt (status={}) hoặc đang ẩn (isVisible={})",
                            jobId, job.getVerificationStatus(), job.getIsVisible());
                    return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                            AiExecutionResponse.builder()
                                    .success(false)
                                    .featureCode(request.getFeatureCode())
                                    .errorMessage("Tin tuyển dụng chưa được quản trị viên phê duyệt hoặc đang bị ẩn. AI không thể phân tích hoặc xử lý tin này.")
                                    .build()
                    );
                }
            }
        }

        AiExecutionResponse response = orchestratorService.execute(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint khám phá kỹ năng mới & thẩm định nguồn học trực tuyến qua AI chuyên ngành CNTT.
     */
    @PostMapping("/skill-discovery")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> discoverSkillResources(
            @RequestBody Map<String, Object> request,
            Authentication authentication
    ) {
        String currentUserId = authentication != null ? authentication.getName() : null;
        if (currentUserId != null && !currentUserId.isBlank()) {
            User user = userRepository.findById(currentUserId)
                    .or(() -> userRepository.findByUsername(currentUserId))
                    .or(() -> userRepository.findFirstByEmail(currentUserId.toLowerCase()))
                    .orElse(null);
            if (user != null && user.getStatus() != null && "LOCKED".equalsIgnoreCase(user.getStatus().trim())) {
                log.warn("Tài khoản bị khóa [{}] cố tình gọi API AI skill-discovery", currentUserId);
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(
                        Map.of("success", false, "message", "Tài khoản của bạn đã bị khóa bởi quản trị viên. Không thể sử dụng chức năng AI.")
                );
            }
        }

        // Kiểm tra jobId nếu có truyền vào
        if (request.containsKey("jobId")) {
            String jobId = String.valueOf(request.get("jobId"));
            if (jobId != null && !jobId.isBlank() && !"null".equalsIgnoreCase(jobId)) {
                Job job = jobRepository.findById(jobId).orElse(null);
                if (job != null) {
                    boolean isApproved = job.getVerificationStatus() != null &&
                            ("Verified".equalsIgnoreCase(job.getVerificationStatus()) || "Approved".equalsIgnoreCase(job.getVerificationStatus()));
                    boolean isVisible = Boolean.TRUE.equals(job.getIsVisible());
                    if (!isApproved || !isVisible) {
                        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(
                                Map.of("success", false, "message", "Tin tuyển dụng chưa được duyệt hoặc đang bị ẩn.")
                        );
                    }
                }
            }
        }

        String skillName = String.valueOf(request.getOrDefault("skillName", "Kỹ năng CNTT"));
        String jobTitle = (String) request.get("jobTitle");
        String company = (String) request.get("company");
        String jobRequirements = (String) request.get("jobRequirements");
        int startIndex = 1;
        if (request.containsKey("startIndex")) {
            try {
                startIndex = Integer.parseInt(String.valueOf(request.get("startIndex")));
            } catch (Exception ignored) {}
        }

        log.info("Nhận yêu cầu AI khám phá kỹ năng IT: [{}] - Vị trí: [{}] - Cty: [{}]", skillName, jobTitle, company);
        AiSkillDiscoveryService.SkillDiscoveryResult result = skillDiscoveryService.discoverSkillResources(
                skillName, jobTitle, company, jobRequirements, startIndex
        );
        return ResponseEntity.ok(result);
    }
}
