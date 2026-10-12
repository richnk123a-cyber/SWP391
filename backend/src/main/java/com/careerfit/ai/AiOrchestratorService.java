package com.careerfit.ai;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * CLASS 3: AiOrchestratorService
 * Chức năng: Điều phối luồng hoạt động giữa 3 AI:
 *   - AI 1: Google: Gemma 4 31B (free)
 *   - AI 2: OpenAI: gpt-oss-20b (free)
 *   - AI 3: NVIDIA: Nemotron 3 Super (free)
 *
 * QUY TẮC ĐIỀU PHỐI:
 *
 * 1. QUY TẮC DỰ PHÒNG CHUNG (FAILOVER):
 *    Khi một AI gặp sự cố (mạng, lỗi OpenRouter, rate-limit), tự động chuyển sang AI tiếp theo:
 *    AI1 -> AI2 -> AI3 -> AI1...
 *    Tối đa 2 vòng quét qua cả 3 AI (tổng cộng 6 lượt thử).
 *    Nếu qua 2 vòng mà cả 3 AI đều không phản hồi, báo lỗi hệ thống.
 *
 * 2. LUỒNG 1: TRƯỜNG HỢP ĐÁP ÁN ĐÃ CÓ TRONG CSDL (answerInDatabase = true):
 *    - Không cần tra cứu bên ngoài.
 *    - Gửi yêu cầu + dữ liệu CSDL cho AI đầu tiên xử lý.
 *    - Nếu AI1 gặp sự cố -> chuyển sang AI2 -> AI3 -> lặp lại tối đa 2 vòng.
 *    - Khi một AI xử lý thành công, trả về kết quả ngay lập tức.
 *
 * 3. LUỒNG 2: TRƯỜNG HỢP CSDL KHÔNG CÓ KẾT QUẢ HOẶC PHẢI TÌM KIẾM BÊN NGOÀI / INTERNET (answerInDatabase = false):
 *    - BƯỚC 1: AI1 nhận yêu cầu -> đọc CSDL, nếu thiếu thì kích hoạt tra cứu thông tin ngoài internet
 *              và đưa ra luồng suy nghĩ + câu trả lời + độ tin cậy của AI1.
 *    - BƯỚC 2: Gửi toàn bộ (Yêu cầu ban đầu, CSDL, luồng suy nghĩ & kết luận của AI1) sang cho AI2.
 *              * Nếu AI2 đánh giá kết quả là CHÍNH XÁC (đồng thuận) -> Trả về kết quả ngay.
 *              * Nếu AI2 cho ra KẾT QUẢ KHÁC với AI1 -> Chuyển sang Bước 3.
 *    - BƯỚC 3: Chuyển toàn bộ (Yêu cầu ban đầu, CSDL, luồng suy luận & đáp án của AI1 và AI2) sang cho AI3 nhận xét.
 *              * Nếu AI3 đưa ra kết luận GIỐNG 1 trong 2 (đồng thuận đa số 2/3) -> Trả về kết luận đó.
 *              * Nếu AI3 KHÁC CẢ HAI -> Chuyển sang Bước 4.
 *    - BƯỚC 4: Toàn bộ dữ liệu gửi lại cho AI1 để AI1 tự kiểm tra, nhận xét và đưa ra kết quả:
 *              * Nếu độ tin cậy >= 90% -> Trả về ngay.
 *              * Nếu độ tin cậy < 90% -> Lặp lại quá trình: gửi toàn bộ sang cho AI2 xử lý.
 *              * Nếu AI2 vẫn không đạt -> Chuyển sang AI3 và AI3 TRỰC TIẾP ĐƯA RA KẾT LUẬN để tránh lặp vô hạn hoặc mất quá nhiều thời gian.
 *
 *    ƯU TIÊN LỰA CHỌN AI:
 *    Các AI1, 2, 3 hoàn toàn có thể được gọi linh hoạt, tuy nhiên trong mỗi vòng sẽ ưu tiên AI chưa được gọi.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiOrchestratorService {

    private final OpenRouterAiClient aiClient;
    private final AiDataIntegrationService integrationService;

    private static final int MAX_ROUNDS = 2;
    private static final double CONFIDENCE_THRESHOLD = 90.0;

    /**
     * Điểm điều phối chính cho mọi chức năng kích hoạt AI từ Frontend / Backend.
     */
    public AiExecutionResponse execute(AiExecutionRequest request) {
        log.info("Bắt đầu điều phối AI cho chức năng [{}] - User [{}] - CSDL có sẵn đáp án: {}",
                request.getFeatureCode(), request.getUserId(), request.isAnswerInDatabase());

        List<AiExecutionResponse.AiStepLog> stepLogs = new ArrayList<>();

        try {
            if (request.isAnswerInDatabase()) {
                // Kích hoạt LUỒNG 1: Dữ liệu đã có trong CSDL
                return executeFlow1DbResolved(request, stepLogs);
            } else {
                // Kích hoạt LUỒNG 2: CSDL thiếu dữ liệu / cần tra cứu internet và thẩm định chéo
                return executeFlow2ConsensusAndSearch(request, stepLogs);
            }
        } catch (Exception ex) {
            log.error("Lỗi nghiêm trọng khi điều phối AI: {}", ex.getMessage(), ex);
            return AiExecutionResponse.builder()
                    .success(false)
                    .featureCode(request.getFeatureCode())
                    .errorMessage("Hệ thống AI không thể hoàn thành yêu cầu: " + ex.getMessage())
                    .executionLogs(stepLogs)
                    .build();
        }
    }

    // =========================================================================
    // LUỒNG 1: ĐÁP ÁN ĐÃ CÓ TRONG CSDL (FAILOVER 2 VÒNG)
    // =========================================================================
    private AiExecutionResponse executeFlow1DbResolved(
            AiExecutionRequest request,
            List<AiExecutionResponse.AiStepLog> stepLogs
    ) {
        log.info("==> [LUỒNG 1] Khởi chạy xử lý dữ liệu CSDL có sẵn...");
        String userMessage = integrationService.buildUserMessageForAi(request, null);
        String systemPrompt = request.getPrompt();

        int modelCount = aiClient.getModelCount();
        int totalAttempts = MAX_ROUNDS * modelCount;

        Exception lastException = null;

        for (int attempt = 0; attempt < totalAttempts; attempt++) {
            int round = (attempt / modelCount) + 1;
            int aiIndex = attempt % modelCount;
            AiModelDescriptor currentAi = aiClient.getModelByIndex(aiIndex);

            log.info("[LUỒNG 1 - Vòng {}/{}] Đang gọi AI [{}]: {}",
                    round, MAX_ROUNDS, currentAi.getDisplayName(), currentAi.getPrimaryModelId());

            long start = System.currentTimeMillis();
            try {
                String rawResponse = aiClient.callAi(currentAi, systemPrompt, userMessage);
                long duration = System.currentTimeMillis() - start;

                Map<String, Object> parsed = integrationService.parseAiStructuredResponse(rawResponse);
                String answer = String.valueOf(parsed.getOrDefault("answer", rawResponse));
                String reasoning = String.valueOf(parsed.getOrDefault("reasoning", ""));
                double confidence = parseConfidence(parsed.get("confidence"));

                stepLogs.add(AiExecutionResponse.AiStepLog.builder()
                        .stepNumber(stepLogs.size() + 1)
                        .aiName(currentAi.getDisplayName())
                        .modelId(currentAi.getPrimaryModelId())
                        .role("PRIMARY_PROCESSOR")
                        .action("Xử lý thành công yêu cầu từ CSDL (Vòng " + round + ")")
                        .reasoning(reasoning)
                        .answer(answer)
                        .confidenceScore(confidence)
                        .isAgreementWithPrevious(true)
                        .success(true)
                        .executionTimeMs(duration)
                        .build());

                return AiExecutionResponse.builder()
                        .success(true)
                        .featureCode(request.getFeatureCode())
                        .finalAnswer(answer)
                        .decisiveAiName(currentAi.getDisplayName())
                        .decisiveModelId(currentAi.getPrimaryModelId())
                        .flowType(1)
                        .confidenceScore(confidence)
                        .reasoningChain(reasoning)
                        .executionLogs(stepLogs)
                        .build();

            } catch (Exception ex) {
                long duration = System.currentTimeMillis() - start;
                log.warn("[LUỒNG 1] AI [{}] gặp sự cố: {}. Chuyển sang AI tiếp theo...",
                        currentAi.getDisplayName(), ex.getMessage());
                lastException = ex;

                stepLogs.add(AiExecutionResponse.AiStepLog.builder()
                        .stepNumber(stepLogs.size() + 1)
                        .aiName(currentAi.getDisplayName())
                        .modelId(currentAi.getPrimaryModelId())
                        .role("PRIMARY_PROCESSOR")
                        .action("Thất bại khi gọi AI")
                        .success(false)
                        .errorDetails(ex.getMessage())
                        .executionTimeMs(duration)
                        .build());
            }
        }

        // Đã qua 2 vòng mà cả 3 AI đều thất bại
        String errMsg = "Sau 2 vòng thử lại (tổng cộng " + totalAttempts + " lần gọi), không có mô hình AI nào hoạt động.";
        log.error("[LUỒNG 1 THẤT BẠI] {}", errMsg);

        return AiExecutionResponse.builder()
                .success(false)
                .featureCode(request.getFeatureCode())
                .flowType(1)
                .errorMessage(errMsg + " Chi tiết lỗi gần nhất: " + (lastException != null ? lastException.getMessage() : "N/A"))
                .executionLogs(stepLogs)
                .build();
    }

    // =========================================================================
    // LUỒNG 2: THẨM ĐỊNH CHÉO & TÌM KIẾM BÊN NGOÀI
    // =========================================================================
    private AiExecutionResponse executeFlow2ConsensusAndSearch(
            AiExecutionRequest request,
            List<AiExecutionResponse.AiStepLog> stepLogs
    ) {
        log.info("==> [LUỒNG 2] Khởi chạy thẩm định chéo (Cross-Evaluation) & tra cứu bên ngoài...");

        // BƯỚC 1: AI 1 (Google: Gemma 4 31B) nhận yêu cầu và tra cứu internet nếu thiếu csdl
        AiModelDescriptor ai1 = aiClient.getModelByIndex(0);
        AiExecutionResult ai1Result = callWithFailover(
                0,
                request.getPrompt(),
                integrationService.buildUserMessageForAi(request, "(Kích hoạt chế độ tra cứu Internet cho thông tin chưa có trong CSDL)"),
                "AI1_INITIAL_GENERATOR",
                stepLogs
        );

        if (!ai1Result.success) {
            return buildFailureResponse(request, 2, "AI1 gặp sự cố và không thể khởi tạo câu trả lời ban đầu.", stepLogs);
        }

        log.info("[LUỒNG 2 - BƯỚC 1] AI1 hoàn thành. Kết luận: {}", ai1Result.answer);

        // BƯỚC 2: Gửi sang AI 2 (OpenAI: gpt-oss-20b) để đánh giá chéo
        AiModelDescriptor ai2 = aiClient.getModelByIndex(1);
        String crossPromptAi2 = integrationService.buildCrossEvaluationPrompt(
                request,
                ai1Result.reasoning,
                ai1Result.answer,
                ai1.getDisplayName()
        );

        AiExecutionResult ai2Result = callWithFailover(
                1,
                "Bạn là thẩm định viên chuyên nghiệp.",
                crossPromptAi2,
                "AI2_CROSS_EVALUATOR",
                stepLogs
        );

        if (ai2Result.success && ai2Result.isAgreement) {
            // AI 2 đồng ý với AI 1 -> Kết quả chính xác -> Trả về ngay
            log.info("[LUỒNG 2 - BƯỚC 2] AI2 ĐỒNG THUẬN với AI1! Trả về kết quả.");
            return AiExecutionResponse.builder()
                    .success(true)
                    .featureCode(request.getFeatureCode())
                    .finalAnswer(ai1Result.answer)
                    .decisiveAiName(ai2.getDisplayName() + " (Đồng thuận cùng " + ai1.getDisplayName() + ")")
                    .decisiveModelId(ai2.getPrimaryModelId())
                    .flowType(2)
                    .confidenceScore(Math.max(ai1Result.confidence, ai2Result.confidence))
                    .reasoningChain("AI1: " + ai1Result.reasoning + "\n\nAI2 Đánh giá: " + ai2Result.reasoning)
                    .executionLogs(stepLogs)
                    .build();
        }

        log.info("[LUỒNG 2 - BƯỚC 2] AI2 cho ra kết quả KHÁC hoặc bất đồng với AI1. Chuyển sang AI3...");

        // BƯỚC 3: AI 2 khác AI 1 -> Chuyển sang AI 3 (NVIDIA: Nemotron 3 Super) nhận xét
        AiModelDescriptor ai3 = aiClient.getModelByIndex(2);
        String arbitrationPromptAi3 = buildArbitrationPrompt(request, ai1, ai1Result, ai2, ai2Result);

        AiExecutionResult ai3Result = callWithFailover(
                2,
                "Bạn là trọng tài phân xử độc lập giữa các mô hình AI.",
                arbitrationPromptAi3,
                "AI3_ARBITRATOR",
                stepLogs
        );

        if (ai3Result.success) {
            // Kiểm tra xem AI3 kết luận giống AI1 hay AI2
            if (ai3Result.agreesWithAi1) {
                log.info("[LUỒNG 2 - BƯỚC 3] AI3 đồng thuận với AI1 (Đa số 2/3).");
                return AiExecutionResponse.builder()
                        .success(true)
                        .featureCode(request.getFeatureCode())
                        .finalAnswer(ai1Result.answer)
                        .decisiveAiName(ai3.getDisplayName() + " (Đồng thuận với " + ai1.getDisplayName() + ")")
                        .decisiveModelId(ai3.getPrimaryModelId())
                        .flowType(2)
                        .confidenceScore(Math.max(ai1Result.confidence, ai3Result.confidence))
                        .reasoningChain("AI3 phân xử đồng ý với AI1:\n" + ai3Result.reasoning)
                        .executionLogs(stepLogs)
                        .build();
            } else if (ai3Result.agreesWithAi2) {
                log.info("[LUỒNG 2 - BƯỚC 3] AI3 đồng thuận với AI2 (Đa số 2/3).");
                return AiExecutionResponse.builder()
                        .success(true)
                        .featureCode(request.getFeatureCode())
                        .finalAnswer(ai2Result.answer)
                        .decisiveAiName(ai3.getDisplayName() + " (Đồng thuận với " + ai2.getDisplayName() + ")")
                        .decisiveModelId(ai3.getPrimaryModelId())
                        .flowType(2)
                        .confidenceScore(Math.max(ai2Result.confidence, ai3Result.confidence))
                        .reasoningChain("AI3 phân xử đồng ý với AI2:\n" + ai3Result.reasoning)
                        .executionLogs(stepLogs)
                        .build();
            }
        }

        log.info("[LUỒNG 2 - BƯỚC 3] AI3 đưa ra kết quả KHÁC CẢ HAI! Chuyển sang BƯỚC 4: gửi lại cho AI1 tự kiểm tra...");

        // BƯỚC 4: Khác cả hai -> Gửi lại toàn bộ cho AI 1 kiểm tra, nhận xét và đưa ra kết quả
        String selfReflectionPromptAi1 = buildSelfReflectionPrompt(request, ai1Result, ai2Result, ai3Result);
        AiExecutionResult ai1RecheckResult = callWithFailover(
                0,
                "Bạn đang tự phản biện và đưa ra kết luận cuối cùng dựa trên các ý kiến bất đồng.",
                selfReflectionPromptAi1,
                "AI1_SELF_REFLECTOR",
                stepLogs
        );

        if (ai1RecheckResult.success && ai1RecheckResult.confidence >= CONFIDENCE_THRESHOLD) {
            log.info("[LUỒNG 2 - BƯỚC 4] AI1 tái đánh giá đạt độ tin cậy cao ({}% >= {}%). Trả về kết quả.",
                    ai1RecheckResult.confidence, CONFIDENCE_THRESHOLD);
            return AiExecutionResponse.builder()
                    .success(true)
                    .featureCode(request.getFeatureCode())
                    .finalAnswer(ai1RecheckResult.answer)
                    .decisiveAiName(ai1.getDisplayName() + " (Tự đánh giá lại đạt tin cậy >= 90%)")
                    .decisiveModelId(ai1.getPrimaryModelId())
                    .flowType(2)
                    .confidenceScore(ai1RecheckResult.confidence)
                    .reasoningChain(ai1RecheckResult.reasoning)
                    .executionLogs(stepLogs)
                    .build();
        }

        log.info("[LUỒNG 2 - BƯỚC 4] AI1 tái đánh giá có độ tin cậy < 90% ({}%). Gửi sang AI2 xử lý lại...",
                ai1RecheckResult.confidence);

        // Gửi toàn bộ sang AI2 xử lý
        String recheckPromptAi2 = "Dưới đây là toàn bộ lịch sử tranh luận của 3 AI nhưng AI1 vẫn chưa đạt độ tin cậy 90%:\n"
                + selfReflectionPromptAi1 + "\n\nKết luận gần nhất của AI1:\n" + ai1RecheckResult.answer
                + "\n\nHãy phân tích và đưa ra giải pháp dứt khoát nhất:";
        AiExecutionResult ai2RecheckResult = callWithFailover(
                1,
                "Chuyên gia giải quyết bế tắc thông tin.",
                recheckPromptAi2,
                "AI2_RECHECK",
                stepLogs
        );

        if (ai2RecheckResult.success && ai2RecheckResult.confidence >= CONFIDENCE_THRESHOLD) {
            log.info("[LUỒNG 2 - BƯỚC 4] AI2 xử lý lại đạt độ tin cậy >= 90%. Trả về kết quả.");
            return AiExecutionResponse.builder()
                    .success(true)
                    .featureCode(request.getFeatureCode())
                    .finalAnswer(ai2RecheckResult.answer)
                    .decisiveAiName(ai2.getDisplayName() + " (Xử lý lại đạt tin cậy >= 90%)")
                    .decisiveModelId(ai2.getPrimaryModelId())
                    .flowType(2)
                    .confidenceScore(ai2RecheckResult.confidence)
                    .reasoningChain(ai2RecheckResult.reasoning)
                    .executionLogs(stepLogs)
                    .build();
        }

        log.info("[LUỒNG 2 - BƯỚC 4] AI2 vẫn không đạt. Chuyển sang AI3 và trực tiếp đưa ra kết luận để tránh lặp vô hạn!");

        // Chuyển sang AI3 và AI3 TRỰC TIẾP ĐƯA RA KẾT LUẬN để tránh lặp vô hạn
        String finalArbitrationPrompt = "Hệ thống cần một quyết định dứt điểm ngay lập tức để tránh lặp vô hạn.\n"
                + "Dựa trên toàn bộ dữ liệu CSDL và các tranh luận trước đó:\n"
                + "AI1 recheck: " + ai1RecheckResult.answer + "\n"
                + "AI2 recheck: " + ai2RecheckResult.answer + "\n"
                + "Hãy trực tiếp đưa ra kết luận dứt khoát, chính xác và an toàn nhất cho người dùng:";

        AiExecutionResult ai3FinalResult = callWithFailover(
                2,
                "Trọng tài tối cao ra quyết định cuối cùng dứt khoát.",
                finalArbitrationPrompt,
                "AI3_FINAL_DECISION_MAKER",
                stepLogs
        );

        String decisiveAnswer = ai3FinalResult.success ? ai3FinalResult.answer : ai1RecheckResult.answer;
        String decisiveAiName = ai3FinalResult.success ? ai3.getDisplayName() : ai1.getDisplayName();
        String decisiveModel = ai3FinalResult.success ? ai3.getPrimaryModelId() : ai1.getPrimaryModelId();

        return AiExecutionResponse.builder()
                .success(true)
                .featureCode(request.getFeatureCode())
                .finalAnswer(decisiveAnswer)
                .decisiveAiName(decisiveAiName + " (Phán quyết dứt điểm cuối cùng)")
                .decisiveModelId(decisiveModel)
                .flowType(2)
                .confidenceScore(ai3FinalResult.confidence > 0 ? ai3FinalResult.confidence : 85.0)
                .reasoningChain(ai3FinalResult.reasoning != null ? ai3FinalResult.reasoning : "Quyết định chốt cuối cùng bởi trọng tài AI3.")
                .executionLogs(stepLogs)
                .build();
    }

    // =========================================================================
    // HELPER: GỌI AI KÈM CƠ CHẾ FAILOVER 2 VÒNG CHUẨN XÁC
    // =========================================================================
    private AiExecutionResult callWithFailover(
            int preferredStartIndex,
            String systemPrompt,
            String userMessage,
            String role,
            List<AiExecutionResponse.AiStepLog> stepLogs
    ) {
        int modelCount = aiClient.getModelCount();
        int totalAttempts = MAX_ROUNDS * modelCount;

        for (int attempt = 0; attempt < totalAttempts; attempt++) {
            int round = (attempt / modelCount) + 1;
            // Ưu tiên AI bắt đầu chỉ định trước, nếu lỗi thì chuyển AI tiếp theo trong vòng
            int aiIndex = (preferredStartIndex + attempt) % modelCount;
            AiModelDescriptor currentAi = aiClient.getModelByIndex(aiIndex);

            long start = System.currentTimeMillis();
            try {
                String rawResponse = aiClient.callAi(currentAi, systemPrompt, userMessage);
                long duration = System.currentTimeMillis() - start;

                Map<String, Object> parsed = integrationService.parseAiStructuredResponse(rawResponse);
                String answer = String.valueOf(parsed.getOrDefault("answer", rawResponse));
                String reasoning = String.valueOf(parsed.getOrDefault("reasoning", ""));
                double confidence = parseConfidence(parsed.get("confidence"));

                boolean isAgreement = true;
                if (parsed.containsKey("isAgreement")) {
                    isAgreement = Boolean.parseBoolean(String.valueOf(parsed.get("isAgreement")));
                }

                boolean agreesWithAi1 = false;
                boolean agreesWithAi2 = false;
                if (parsed.containsKey("agreesWith")) {
                    String agrees = String.valueOf(parsed.get("agreesWith")).toLowerCase();
                    agreesWithAi1 = agrees.contains("ai1") || agrees.contains("1");
                    agreesWithAi2 = agrees.contains("ai2") || agrees.contains("2");
                }

                stepLogs.add(AiExecutionResponse.AiStepLog.builder()
                        .stepNumber(stepLogs.size() + 1)
                        .aiName(currentAi.getDisplayName())
                        .modelId(currentAi.getPrimaryModelId())
                        .role(role)
                        .action("Gọi AI thành công (Vòng " + round + ")")
                        .reasoning(reasoning)
                        .answer(answer)
                        .confidenceScore(confidence)
                        .isAgreementWithPrevious(isAgreement)
                        .success(true)
                        .executionTimeMs(duration)
                        .build());

                return new AiExecutionResult(true, answer, reasoning, confidence, isAgreement, agreesWithAi1, agreesWithAi2, null);

            } catch (Exception ex) {
                long duration = System.currentTimeMillis() - start;
                log.warn("[FAILOVER] Gọi AI [{}] cho vai trò [{}] thất bại: {}. Đang thử tiếp...",
                        currentAi.getDisplayName(), role, ex.getMessage());

                stepLogs.add(AiExecutionResponse.AiStepLog.builder()
                        .stepNumber(stepLogs.size() + 1)
                        .aiName(currentAi.getDisplayName())
                        .modelId(currentAi.getPrimaryModelId())
                        .role(role)
                        .action("Gọi AI thất bại (Vòng " + round + ")")
                        .success(false)
                        .errorDetails(ex.getMessage())
                        .executionTimeMs(duration)
                        .build());
            }
        }

        return new AiExecutionResult(false, null, null, 0.0, false, false, false, "Cả 3 AI đều không phản hồi sau 2 vòng.");
    }

    private String buildArbitrationPrompt(
            AiExecutionRequest request,
            AiModelDescriptor ai1,
            AiExecutionResult ai1Result,
            AiModelDescriptor ai2,
            AiExecutionResult ai2Result
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hai AI trước đó đã đưa ra kết quả KHÁC NHAU về cùng một yêu cầu.\n\n");
        sb.append("--- YÊU CẦU & DỮ LIỆU CSDL ---\n");
        sb.append("Chức năng: ").append(request.getFeatureName()).append("\n");
        sb.append("Yêu cầu người dùng: ").append(request.getUserQuery()).append("\n");
        sb.append("Dữ liệu CSDL: ").append(request.getDatabaseSummaryText()).append("\n\n");

        sb.append("--- QUAN ĐIỂM CỦA AI1 (").append(ai1.getDisplayName()).append(") ---\n");
        sb.append("Suy luận: ").append(ai1Result.reasoning).append("\n");
        sb.append("Kết luận: ").append(ai1Result.answer).append("\n\n");

        sb.append("--- QUAN ĐIỂM CỦA AI2 (").append(ai2.getDisplayName()).append(") ---\n");
        sb.append("Suy luận: ").append(ai2Result.reasoning).append("\n");
        sb.append("Kết luận: ").append(ai2Result.answer).append("\n\n");

        sb.append("Nhiệm vụ của bạn là thẩm định độc lập:\n");
        sb.append("1. Bạn đồng ý với AI1, hay AI2, hay bạn có kết luận khác cả hai?\n");
        sb.append("Phản hồi định dạng JSON:\n");
        sb.append("{\n");
        sb.append("  \"agreesWith\": \"AI1\" (hoặc \"AI2\" hoặc \"NEITHER\"),\n");
        sb.append("  \"reasoning\": \"Lý do phân xử của bạn\",\n");
        sb.append("  \"answer\": \"Kết luận được chọn\",\n");
        sb.append("  \"confidence\": 95\n");
        sb.append("}\n");

        return sb.toString();
    }

    private String buildSelfReflectionPrompt(
            AiExecutionRequest request,
            AiExecutionResult ai1,
            AiExecutionResult ai2,
            AiExecutionResult ai3
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Cả 3 AI đã đưa ra các kết quả khác nhau. Là AI khởi tạo ban đầu, hãy xem xét lại toàn bộ:\n\n");
        sb.append("Yêu cầu: ").append(request.getUserQuery()).append("\n");
        sb.append("CSDL: ").append(request.getDatabaseSummaryText()).append("\n\n");
        sb.append("Kết quả ban đầu của bạn (AI1): ").append(ai1.answer).append("\n");
        sb.append("Phản biện của AI2: ").append(ai2.answer).append("\n");
        sb.append("Nhận xét của AI3: ").append(ai3.answer).append("\n\n");
        sb.append("Hãy tự đánh giá khách quan, điều chỉnh sai sót (nếu có) và đưa ra kết luận với độ tin cậy chính xác theo JSON:\n");
        sb.append("{\n");
        sb.append("  \"reasoning\": \"Phân tích tự kiểm tra lại\",\n");
        sb.append("  \"answer\": \"Kết luận chính xác nhất\",\n");
        sb.append("  \"confidence\": 92\n");
        sb.append("}\n");

        return sb.toString();
    }

    private AiExecutionResponse buildFailureResponse(
            AiExecutionRequest request,
            int flowType,
            String errorMsg,
            List<AiExecutionResponse.AiStepLog> stepLogs
    ) {
        return AiExecutionResponse.builder()
                .success(false)
                .featureCode(request.getFeatureCode())
                .flowType(flowType)
                .errorMessage(errorMsg)
                .executionLogs(stepLogs)
                .build();
    }

    private double parseConfidence(Object confObj) {
        if (confObj == null) return 85.0;
        try {
            return Double.parseDouble(String.valueOf(confObj));
        } catch (Exception e) {
            return 85.0;
        }
    }

    private static class AiExecutionResult {
        final boolean success;
        final String answer;
        final String reasoning;
        final double confidence;
        final boolean isAgreement;
        final boolean agreesWithAi1;
        final boolean agreesWithAi2;
        final String error;

        AiExecutionResult(boolean success, String answer, String reasoning, double confidence,
                          boolean isAgreement, boolean agreesWithAi1, boolean agreesWithAi2, String error) {
            this.success = success;
            this.answer = answer;
            this.reasoning = reasoning;
            this.confidence = confidence;
            this.isAgreement = isAgreement;
            this.agreesWithAi1 = agreesWithAi1;
            this.agreesWithAi2 = agreesWithAi2;
            this.error = error;
        }
    }
}
