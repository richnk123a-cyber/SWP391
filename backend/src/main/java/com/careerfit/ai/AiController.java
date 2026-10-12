package com.careerfit.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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

    /**
     * Lấy danh sách các mô hình AI đang được đăng ký trong hệ thống
     */
    @GetMapping("/models")
    public ResponseEntity<List<AiModelDescriptor>> getRegisteredModels() {
        return ResponseEntity.ok(aiClient.getRegisteredModels());
    }

    /**
     * Endpoint kích hoạt chức năng AI từ Frontend / Backend.
     */
    @PostMapping("/execute")
    public ResponseEntity<AiExecutionResponse> executeAiFeature(@RequestBody AiExecutionRequest request) {
        log.info("Nhận yêu cầu kích hoạt AI từ Client: featureCode=[{}]", request.getFeatureCode());
        AiExecutionResponse response = orchestratorService.execute(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Endpoint khám phá kỹ năng mới & thẩm định nguồn học trực tuyến qua AI chuyên ngành CNTT.
     */
    @PostMapping("/skill-discovery")
    public ResponseEntity<AiSkillDiscoveryService.SkillDiscoveryResult> discoverSkillResources(
            @RequestBody Map<String, Object> request
    ) {
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
