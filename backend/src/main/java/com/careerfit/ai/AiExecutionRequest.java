package com.careerfit.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * DTO chứa thông tin yêu cầu kích hoạt chức năng AI.
 * Nhận dữ liệu từ Frontend, Backend và dữ liệu truy vấn từ Database.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiExecutionRequest {

    /**
     * Mã chức năng (VD: "CV_ANALYSIS", "JOB_RECOMMENDATION", "ROADMAP_GENERATION", "SCAM_CHECK", ...)
     */
    private String featureCode;

    /**
     * Tên chức năng hiển thị cho người dùng
     */
    private String featureName;

    /**
     * Yêu cầu / Câu hỏi hoặc prompt nghiệp vụ được thiết lập sẵn cho chức năng
     */
    private String prompt;

    /**
     * Yêu cầu bổ sung gửi từ frontend (nếu có khi người dùng bấm nút)
     */
    private String userQuery;

    /**
     * ID của người dùng kích hoạt chức năng
     */
    private String userId;

    /**
     * Vai trò người dùng (CANDIDATE, EMPLOYER, ADMIN)
     */
    private String userRole;

    /**
     * Dữ liệu trích xuất từ các bảng trong cơ sở dữ liệu liên quan đến chức năng.
     * Có thể chứa thông tin ứng viên, công việc, kỹ năng, lộ trình, v.v.
     */
    private Map<String, Object> databaseContext;

    /**
     * Dữ liệu csdl đã được chuyển đổi thành chuỗi text / JSON tóm tắt cho AI đọc
     */
    private String databaseSummaryText;

    /**
     * Cờ đánh dấu dữ liệu trong database đã có đáp án đầy đủ hay chưa.
     * True: Database đã có đủ dữ liệu -> Chạy Luồng 1 (Không tìm kiếm bên ngoài).
     * False: Database chưa có câu trả lời hoặc cần tìm kiếm bên ngoài/internet -> Chạy Luồng 2 (Web search + Đánh giá chéo).
     */
    @Builder.Default
    private boolean answerInDatabase = true;

    /**
     * Yêu cầu AI có được phép tra cứu ngoài Internet hay không nếu csdl thiếu thông tin
     */
    @Builder.Default
    private boolean allowWebSearch = false;

    /**
     * Danh sách tài liệu tham khảo hoặc thông tin bên ngoài đã thu thập được (nếu có)
     */
    private List<String> externalSources;
}
