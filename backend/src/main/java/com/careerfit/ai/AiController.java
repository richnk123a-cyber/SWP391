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
}
