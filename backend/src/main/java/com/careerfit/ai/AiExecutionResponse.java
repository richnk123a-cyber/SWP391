package com.careerfit.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO chứa kết quả AI trả về sau khi hoàn tất quy trình điều phối.
 * Chứa kết luận cuối cùng, độ tin cậy, luồng suy luận và lịch sử các bước xử lý qua các AI.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiExecutionResponse {

    /**
     * Trạng thái thành công hay thất bại
     */
    private boolean success;

    /**
     * Mã chức năng đã xử lý
     */
    private String featureCode;

    /**
     * Câu trả lời / Kết luận cuối cùng để hiển thị cho người dùng trên giao diện
     */
    private String finalAnswer;

    /**
     * Tên AI đã đưa ra kết luận cuối cùng
     */
    private String decisiveAiName;

    /**
     * Mã model AI quyết định (VD: google/gemma-4-31b-it:free)
     */
    private String decisiveModelId;

    /**
     * Luồng hoạt động đã kích hoạt:
     * 1: DB_RESOLVED (Đáp án có sẵn trong CSDL, xử lý tuần tự có failover 2 vòng)
     * 2: CONSENSUS_MULTI_AI (Dữ liệu thiếu / tra cứu ngoài, luồng đánh giá chéo AI1 -> AI2 -> AI3)
     */
    private int flowType;

    /**
     * Độ tin cậy của kết quả (tính theo phần trăm, từ 0 đến 100%)
     */
    private double confidenceScore;

    /**
     * Toàn bộ luồng suy luận tổng hợp (reasoning chain)
     */
    private String reasoningChain;

    /**
     * Thông báo lỗi chi tiết nếu tất cả AI gặp sự cố qua 2 vòng
     */
    private String errorMessage;

    /**
     * Danh sách lịch sử các bước thực thi chi tiết qua các AI
     */
    private List<AiStepLog> executionLogs;

    /**
     * Thời điểm hoàn thành
     */
    @Builder.Default
    private LocalDateTime completedAt = LocalDateTime.now();

    /**
     * Chi tiết nhật ký từng bước xử lý của một AI trong chuỗi
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AiStepLog {
        private int stepNumber;
        private String aiName;
        private String modelId;
        private String role; // "PRIMARY_GENERATOR", "CROSS_EVALUATOR_2", "ARBITRATOR_3", "SELF_REFLECTOR_1", ...
        private String action;
        private String reasoning;
        private String answer;
        private Double confidenceScore;
        private boolean isAgreementWithPrevious;
        private boolean success;
        private String errorDetails;
        private long executionTimeMs;
    }
}
