package com.careerfit.ai;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * CLASS 2: AiDataIntegrationService
 * Chức năng: Nhận dữ liệu từ cơ sở dữ liệu (Database), yêu cầu từ Frontend và Backend
 * khi người dùng bấm nút kích hoạt chức năng, chuẩn hóa dữ liệu đầu vào cho AI và
 * tiếp nhận, bóc tách kết quả AI trả về để phản hồi lại cho hệ thống / người dùng.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiDataIntegrationService {

    private final ObjectMapper objectMapper;

    /**
     * Nhận và đóng gói dữ liệu từ Frontend, Backend và CSDL thành một AiExecutionRequest hoàn chỉnh.
     *
     * @param featureCode     Mã chức năng (VD: "CV_ANALYSIS", "JOB_RECOMMENDATION", ...)
     * @param featureName     Tên hiển thị của chức năng
     * @param systemPrompt    Prompt nghiệp vụ mặc định được thiết lập sẵn cho chức năng
     * @param userQuery       Yêu cầu / câu hỏi thêm từ người dùng khi bấm nút ở Frontend
     * @param userId          ID người dùng đang đăng nhập
     * @param userRole        Vai trò người dùng (CANDIDATE, EMPLOYER, ADMIN)
     * @param dbDataMap       Map chứa các thực thể/dữ liệu lấy từ các bảng CSDL liên quan
     * @param isDbAnswerReady Đánh dấu dữ liệu trong CSDL đã có câu trả lời hay chưa (true: Luồng 1, false: Luồng 2)
     * @param allowWebSearch  Cho phép tìm kiếm bên ngoài / internet nếu thiếu dữ liệu
     * @return Đối tượng AiExecutionRequest đã chuẩn hóa
     */
    public AiExecutionRequest assembleRequest(
            String featureCode,
            String featureName,
            String systemPrompt,
            String userQuery,
            String userId,
            String userRole,
            Map<String, Object> dbDataMap,
            boolean isDbAnswerReady,
            boolean allowWebSearch
    ) {
        String dbSummaryText = formatDatabaseContext(dbDataMap);

        return AiExecutionRequest.builder()
                .featureCode(featureCode)
                .featureName(featureName)
                .prompt(systemPrompt)
                .userQuery(userQuery)
                .userId(userId)
                .userRole(userRole)
                .databaseContext(dbDataMap != null ? dbDataMap : new HashMap<>())
                .databaseSummaryText(dbSummaryText)
                .answerInDatabase(isDbAnswerReady)
                .allowWebSearch(allowWebSearch)
                .build();
    }

    /**
     * Chuyển đổi dữ liệu CSDL phong phú thành văn bản tóm tắt có cấu trúc để AI dễ đọc hiểu.
     */
    public String formatDatabaseContext(Map<String, Object> dbDataMap) {
        if (dbDataMap == null || dbDataMap.isEmpty()) {
            return "Không có dữ liệu bổ sung trong cơ sở dữ liệu.";
        }
        try {
            return objectMapper.writerWithDefaultPrettyPrinter().writeValueAsString(dbDataMap);
        } catch (Exception e) {
            log.warn("Không thể serialize databaseContext sang JSON: {}", e.getMessage());
            return dbDataMap.toString();
        }
    }

    /**
     * Xây dựng câu nhắc (User message) tổng hợp gửi cho AI bao gồm:
     * - Yêu cầu nghiệp vụ
     * - Câu hỏi người dùng
     * - Dữ liệu từ cơ sở dữ liệu
     * - Các nguồn tìm kiếm internet (nếu có)
     */
    public String buildUserMessageForAi(AiExecutionRequest request, String webSearchResults) {
        StringBuilder sb = new StringBuilder();

        sb.append("=== QUY ĐỊNH BẮT BUỘC VỀ NGÔN NGỮ (LANGUAGE MANDATE: 100% TIẾNG VIỆT) ===\n");
        sb.append("Nền tảng CareerFit dành riêng cho người dùng Việt Nam. Do đó:\n");
        sb.append("1. TẤT CẢ các nội dung phản hồi, văn bản giải thích, phân tích chi tiết, suy luận từng bước (bao gồm các trường 'reasoning', 'answer', 'unrelatedDocumentWarning', 'strengths', 'areasToImprove') BẮT BUỘC 100% PHẢI ĐƯỢC VIẾT BẰNG TIẾNG VIỆT CHUẨN XÁC, TỰ NHIÊN, CHUYÊN NGHIỆP.\n");
        sb.append("2. TUYỆT ĐỐI KHÔNG ĐƯỢC VIẾT BẰNG TIẾNG ANH trong bất kỳ trường giải thích hay phân tích nào (DO NOT WRITE IN ENGLISH UNDER ANY CIRCUMSTANCES). Ngay cả phần suy nghĩ phân tích từng bước trong trường 'reasoning' cũng BẮT BUỘC viết hoàn toàn bằng tiếng Việt.\n");
        sb.append("3. Chỉ giữ nguyên tiếng Anh đối với tên riêng kỹ thuật / công nghệ quốc tế (như Java, React, Docker, Spring Boot, MySQL, Git, AWS, v.v.).\n\n");

        sb.append("=== THÔNG TIN YÊU CẦU TỪ NGƯỜI DÙNG & HỆ THỐNG ===\n");
        sb.append("Chức năng: ").append(request.getFeatureName() != null ? request.getFeatureName() : request.getFeatureCode()).append("\n");
        if (request.getUserQuery() != null && !request.getUserQuery().isBlank()) {
            sb.append("Yêu cầu bổ sung của người dùng: ").append(request.getUserQuery()).append("\n");
        }
        sb.append("\n=== DỮ LIỆU TỪ CƠ SỞ DỮ LIỆU (DATABASE CONTEXT) ===\n");
        sb.append(request.getDatabaseSummaryText() != null ? request.getDatabaseSummaryText() : "Trống").append("\n");

        if (webSearchResults != null && !webSearchResults.isBlank()) {
            sb.append("\n=== DỮ LIỆU TÌM KIẾM BÊN NGOÀI / INTERNET ===\n");
            sb.append(webSearchResults).append("\n");
        }

        if ("CV_MATCH_EVALUATION".equalsIgnoreCase(request.getFeatureCode())
                || "CV_ANALYSIS".equalsIgnoreCase(request.getFeatureCode())) {
            sb.append("\n=== QUY TẮC THẨM ĐỊNH CV IT NGHIÊM NGẶT (CHỐNG FAKE & BẤT KỲ TÀI LIỆU KHÔNG PHẢI CV IT) ===\n");
            sb.append("Bạn là chuyên gia thẩm định hồ sơ kỹ thuật cấp cao (Senior IT Technical Recruiter & CV Auditor).\n");
            sb.append("Nhiệm vụ của bạn là thẩm định tính xác thực của tài liệu và đánh giá độ phù hợp của ứng viên với vị trí CNTT tuyển dụng.\n\n");

            sb.append("TIÊU CHÍ BẮT BUỘC SỐ 1: KIỂM SOÁT ĐỊNH DANH TÀI LIỆU (DOCUMENT TYPE VALIDATION):\n");
            sb.append("- Đọc kỹ phần nội dung văn bản trích xuất từ file tải lên và hồ sơ ứng viên (trong databaseSummaryText).\n");
            sb.append("- Một hồ sơ / CV cá nhân ngành CNTT hợp lệ bao gồm:\n");
            sb.append("  1. Là hồ sơ cá nhân có tên, mục tiêu nghề nghiệp, học vấn (trường ĐH, chuyên ngành CNTT, SE...), kỹ năng lập trình (Java, React, SQL...) hoặc kinh nghiệm/dự án công nghệ.\n");
            sb.append("  2. QUY TẮC BẢO VỆ ỨNG VIÊN CNTT THẬT: NẾU trong databaseSummaryText có thông tin ứng viên thuộc ngành CNTT (như chuyên ngành SE/IT, kỹ năng profileSkills, vị trí mong muốn Developer, hoặc nội dung trích xuất là CV/Hồ sơ kỹ thuật):\n");
            sb.append("     -> BẮT BUỘC XÁC ĐỊNH ĐÂY LÀ CV CNTT HỢP LỆ: isValidCv = true, documentType = 'CV Công nghệ Thông tin'.\n");
            sb.append("     -> Tuyệt đối KHÔNG được đánh giá là 'Tài liệu không xác định' hay từ chối hồ sơ thật của ứng viên.\n");
            sb.append("- NẾU VÀ CHỈ NẾU NỘI DUNG TÀI LIỆU LÀ VĂN BẢN HOÀN TOÀN KHÔNG PHẢI LÀ CV CNTT:\n");
            sb.append("  (Bao gồm: Biên bản cuộc họp, hợp đồng kinh tế/lao động, hóa đơn/chứng từ kế toán, báo cáo tài chính/kinh doanh, bài tiểu luận/nghiên cứu triết học, văn bản hành chính công văn, hoặc CV ngành nghề hoàn toàn phi IT như kế toán, xây dựng, y tế, phục vụ bàn...):\n");
            sb.append("  -> BẮT BUỘC PHẢI THIẾT LẬP TOÀN BỘ CÁC TRƯỜNG JSON NHƯ SAU (100% TIẾNG VIỆT):\n");
            sb.append("     * \"isValidCv\": false\n");
            sb.append("     * \"documentType\": [Nêu rõ tên loại tài liệu thực tế của văn bản bằng tiếng Việt, VD: 'Biên bản cuộc họp', 'Hợp đồng lao động', 'Hóa đơn tài chính', 'Văn bản hành chính', 'CV ngành Kế toán / Phi IT', 'Bài tiểu luận / Giáo trình']\n");
            sb.append("     * \"experienceMatch\": 0 (Tuyệt đối đặt 0% - Không chấm điểm kinh nghiệm cho tài liệu phi IT)\n");
            sb.append("     * \"projectRelevance\": 0 (Tuyệt đối đặt 0% - Không có dự án phần mềm liên quan)\n");
            sb.append("     * \"skillMatch\": 0\n");
            sb.append("     * \"overallMatch\": 0\n");
            sb.append("     * \"matchedSkills\": [BẮT BUỘC giữ lại nguyên vẹn danh sách kỹ năng matchedSkills đã cung cấp trong databaseSummaryText]\n");
            sb.append("     * \"missingSkills\": [BẮT BUỘC giữ lại danh sách missingSkills từ databaseSummaryText]\n");
            sb.append("     * \"unrelatedDocumentWarning\": \"CẢNH BÁO: Tệp tài liệu tải lên được nhận diện là [Tên loại tài liệu thực tế], KHÔNG PHẢI là bản CV/Resume cá nhân thuộc lĩnh vực Công nghệ Thông tin. Hệ thống từ chối tính điểm kinh nghiệm (0%) và dự án (0%). Vui lòng tải lên đúng bản CV cá nhân ngành CNTT (chứa thông tin kỹ năng lập trình, dự án phần mềm và kinh nghiệm kỹ thuật) để được đánh giá chính xác.\"\n");
            sb.append("     * \"reasoning\": [Viết giải thích chi tiết lý do từ chối bằng 100% TIẾNG VIỆT, tuyệt đối không dùng tiếng Anh]\n");
            sb.append("     * \"answer\": \"Tài liệu bạn cung cấp là [Tên loại tài liệu thực tế], không phải là hồ sơ xin việc (CV) chuyên ngành Công nghệ Thông tin. Hệ thống đã đặt điểm kinh nghiệm và mức độ phù hợp dự án về 0%. Để nhận được đánh giá chính xác từ CareerFit AI, vui lòng cập nhật lại bản CV kỹ thuật cá nhân của bạn.\"\n\n");

                        sb.append("TIÊU CHÍ BẮT BUỘC SỐ 2: KẾT HỢP ĐẦY ĐỦ CẢ 2 NGUỒN KỸ NĂNG & SO KHỚP NGỮ NGHĨA (COMBINE WEB PROFILE + DECLARED CV SKILLS):\n");
            sb.append("- KẾT HỢP CẢ 2 NGUỒN: Kỹ năng của ứng viên được cung cấp từ 2 nguồn: (1) Kỹ năng chọn trên web (profileSkills) VÀ (2) Kỹ năng khai trong bản CV (cvDeclaredSkills, combinedCandidateSkills & trích xuất văn bản CV: như Java, SQL, Git, Giao tiếp & Làm việc nhóm, Tư duy phản biện, Quản lý thời gian, Giải quyết vấn đề, Dẫn dắt/Lãnh đạo...).\n");
            sb.append("- BẠN BẮT BUỘC PHẢI HỢP NHẤT TOÀN BỘ CẢ 2 NGUỒN NÀY LẠI ĐỂ ĐỐI CHIẾU VỚI JD:\n");
            sb.append("  * TUYỆT ĐỐI KHÔNG ĐƯỢC chỉ so sánh các kỹ năng khai báo trên web mà bỏ sót các kỹ năng người dùng khai trong CV.\n");
            sb.append("  * Nếu ứng viên đã ghi trong CV (dù ở phần Kỹ năng chính, Kỹ năng khác, Kỹ năng mềm, Kinh nghiệm hay Dự án), BẮT BUỘC coi là ứng viên ĐÃ CÓ kỹ năng đó và đưa vào 'matchedSkills' nếu JD có yêu cầu.\n");
            sb.append("- NGUYÊN TẮC PHÂN BIỆT RÕ KỸ NĂNG MỀM VS CÔNG CỤ KỸ THUẬT (TUYỆT ĐỐI CẤM SUY LUẬN NHẦM LẪN):\n");
            sb.append("  * 'Làm việc nhóm' / 'Teamwork' KHÔNG BAO GIỜ được coi là biết dùng 'Git', 'GitHub', 'GitLab', 'Jira' hay 'Trello'.\n");
            sb.append("  * 'Quản lý thời gian' / 'Time management' KHÔNG BAO GIỜ được coi là biết 'Agile', 'Scrum', 'Jira' hay 'Project Management'.\n");
            sb.append("  * 'Giải quyết vấn đề' / 'Problem solving' KHÔNG BAO GIỜ được coi là biết 'Debugging', 'Troubleshooting' hay 'Unit Testing'.\n");
            sb.append("  * 'Giao tiếp' / 'Communication' KHÔNG BAO GIỜ được coi là biết viết 'API Documentation' hay 'Swagger'.\n");
            sb.append("  * CÁC KỸ NĂNG KỸ THUẬT & CÔNG CỤ (như Git, Docker, SQL, Java, React, Linux, AWS, Jira...) BẮT BUỘC ứng viên phải TỰ KHAI RÕ TRONG CV/HỒ SƠ mới được đưa vào 'matchedSkills'.\n");
            sb.append("- SO KHỚP NGỮ NGHĨA LINH HOẠT GIỮA CÁC KỸ NĂNG CÙNG LOẠI:\n");
            sb.append("  * 'Kĩ năng giao tiếp' / 'Kỹ năng giao tiếp' / 'Giao tiếp': KHỚP HOÀN TOÀN với 'Giao tiếp & Làm việc nhóm' hoặc 'Giao tiếp tốt'.\n");
            sb.append("  * 'Kĩ năng dẫn dắt' / 'Kỹ năng lãnh đạo' / 'Leadership': KHỚP với vai trò 'Giám đốc điều hành', 'Quản lý', 'Trưởng nhóm', 'Lead', 'Leader'.\n");
            sb.append("  * 'Làm việc nhóm' / 'Teamwork': KHỚP với 'Giao tiếp & Làm việc nhóm'.\n");
            sb.append("  * 'Tư duy phản biện' / 'Critical thinking': KHỚP với phân tích vấn đề, tư duy logic, giải quyết sự cố.\n");
            sb.append("  * 'Quản lý thời gian' / 'Time management': KHỚP với kỹ năng sắp xếp công việc, đúng tiến độ.\n");
            sb.append("  * 'Giải quyết vấn đề' / 'Problem solving': KHỚP với xử lý lỗi, tư duy phản biện.\n");
            sb.append("  * 'Java' / 'Java dev': KHỚP với kỹ năng lập trình Java (dù ghi java, java core, java 70%).\n");
            sb.append("- BẮT BUỘC đưa TẤT CẢ các kỹ năng ứng viên đã thể hiện ở 1 trong 2 nơi (kỹ thuật lẫn kỹ năng mềm) vào danh sách 'matchedSkills'.\n");
            sb.append("- 'missingSkills': CHỈ chứa những kỹ năng thực sự còn thiếu ở CẢ 2 NGUỒN (cả trên web lẫn trong CV).\n\n");sb.append("TIÊU CHÍ BẮT BUỘC SỐ 3: ĐÁNH GIÁ KINH NGHIỆM PHÙ HỢP CẤP BẬC VỊ TRÍ:\n");
            sb.append("  1. \"experienceMatch\" (0 - 100):\n");
            sb.append("     - NẾU VỊ TRÍ LÀ THỰC TẬP SINH (INTERNSHIP) HOẶC FRESHER (như trong jobTitle / jobLevel / yêu cầu công việc):\n");
            sb.append("       Đối tượng tuyển dụng là sinh viên đang đi học hoặc mới ra trường. Nếu ứng viên là sinh viên ngành CNTT/SE (Software Engineering, FPT University...) hoặc có kỹ năng lập trình phù hợp: TUYỆT ĐỐI KHÔNG ĐƯỢC CHẤM 0%! Điểm kinh nghiệm tiềm năng cho Internship/Fresher phải đạt từ 45% đến 80% để phản ánh đúng tiềm năng học hỏi và nền tảng học thuật của ứng viên.\n");
            sb.append("     - NẾU VỊ TRÍ LÀ JUNIOR/MIDDLE/SENIOR: Đối chiếu số năm kinh nghiệm thực tế (10% - 35% cho Fresher chưa có kinh nghiệm, 40% - 60% cho Junior, 70% - 95% cho Middle/Senior đúng chuyên môn).\n");
            sb.append("  2. \"projectRelevance\" (0 - 100): Soi chiếu chi tiết các dự án phần mềm, bài tập lớn hoặc ứng dụng thực tế. Nếu là sinh viên thực tập có học stack công nghệ của JD: chấm từ 30% - 65%.\n");
            sb.append("  3. \"skillMatch\" (0 - 100): Tỷ lệ phần trăm số kỹ năng yêu cầu trong JD mà ứng viên đáp ứng được (dựa trên danh sách matchedSkills thực tế).\n");
            sb.append("  4. \"overallMatch\" (0 - 100): Điểm tổng hợp: (skillMatch * 0.5) + (experienceMatch * 0.3) + (projectRelevance * 0.2).\n\n");

            sb.append("=== HƯỚNG DẪN TRẢ LỜI BẮT BUỘC THEO JSON (100% TIẾNG VIỆT) ===\n");
            sb.append("{\n");
            sb.append("  \"isValidCv\": true,\n");
            sb.append("  \"documentType\": \"CV Công nghệ Thông tin\",\n");
            sb.append("  \"experienceMatch\": 75,\n");
            sb.append("  \"projectRelevance\": 80,\n");
            sb.append("  \"skillMatch\": 85,\n");
            sb.append("  \"overallMatch\": 80,\n");
            sb.append("  \"unrelatedDocumentWarning\": null,\n");
            sb.append("  \"matchedSkills\": [\"Java\", \"SQL\"],\n");
            sb.append("  \"missingSkills\": [\"Spring Boot\"],\n");
            sb.append("  \"strengths\": [\"Điểm mạnh thực tế viết bằng tiếng Việt\"],\n");
            sb.append("  \"areasToImprove\": [\"Điểm cần cải thiện viết bằng tiếng Việt\"],\n");
            sb.append("  \"reasoning\": \"Phân tích chi tiết chỉ rõ bằng chứng từ CV (BẮT BUỘC VIẾT HOÀN TOÀN BẰNG TIẾNG VIỆT, TUYỆT ĐỐI KHÔNG DÙNG TIẾNG ANH)\",\n");
            sb.append("  \"answer\": \"Nhận xét tổng hợp cho ứng viên và nhà tuyển dụng (BẮT BUỘC VIẾT HOÀN TOÀN BẰNG TIẾNG VIỆT)\",\n");
            sb.append("  \"confidence\": 95\n");
            sb.append("}\n");
            sb.append("Lưu ý: Nếu isValidCv = false thì unrelatedDocumentWarning là chuỗi cảnh báo nhắc nhở cụ thể bằng tiếng Việt, còn lại là null. Mọi văn bản giải thích BẮT BUỘC bằng tiếng Việt.\n");
        } else {
            sb.append("\n=== HƯỚNG DẪN TRẢ LỜI (100% TIẾNG VIỆT) ===\n");
            sb.append("Hãy phân tích các dữ liệu trên và đưa ra phản hồi theo cấu trúc JSON sau (toàn bộ nội dung bằng tiếng Việt):\n");
            sb.append("{\n");
            sb.append("  \"reasoning\": \"Luồng suy nghĩ và phân tích chi tiết của bạn (bắt buộc viết bằng tiếng Việt)\",\n");
            sb.append("  \"answer\": \"Kết luận/Đáp án cụ thể rõ ràng cho người dùng (bắt buộc viết bằng tiếng Việt)\",\n");
            sb.append("  \"confidence\": 95\n");
            sb.append("}\n");
            sb.append("Lưu ý: Toàn bộ nội dung giải thích phải được viết bằng tiếng Việt chuẩn mực.\n");
        }

        return sb.toString();
    }

    /**
     * Xây dựng nội dung yêu cầu đánh giá chéo (Cross-Evaluation) giữa các AI (Dùng trong Luồng 2).
     */
    public String buildCrossEvaluationPrompt(
            AiExecutionRequest request,
            String initialReasoning,
            String initialAnswer,
            String previousAiName
    ) {
        StringBuilder sb = new StringBuilder();
        sb.append("Bạn là chuyên gia thẩm định và đánh giá chéo độc lập.\n");
        sb.append("Dưới đây là yêu cầu ban đầu, dữ liệu cơ sở dữ liệu và kết quả xử lý của ").append(previousAiName).append(":\n\n");
        sb.append("--- DỮ LIỆU GỐC & YÊU CẦU ---\n");
        sb.append("Chức năng: ").append(request.getFeatureName()).append("\n");
        sb.append("Yêu cầu người dùng: ").append(request.getUserQuery()).append("\n");
        sb.append("Dữ liệu CSDL: ").append(request.getDatabaseSummaryText()).append("\n\n");

        sb.append("--- LUỒNG SUY NGHĨ CỦA ").append(previousAiName).append(" ---\n");
        sb.append(initialReasoning).append("\n\n");

        sb.append("--- KẾT LUẬN CỦA ").append(previousAiName).append(" ---\n");
        sb.append(initialAnswer).append("\n\n");

        if ("CV_MATCH_EVALUATION".equalsIgnoreCase(request.getFeatureCode())
                || "CV_ANALYSIS".equalsIgnoreCase(request.getFeatureCode())) {
            sb.append("--- QUY TẮC ĐÁNH GIÁ CHÉO CV BẮT BUỘC ---\n");
            sb.append("1. Kiểm tra xem ").append(previousAiName).append(" có bị đánh lừa bởi tài liệu không phải CV IT (như biên bản cuộc họp, hợp đồng, bài luận, hóa đơn, CV ngành nghề phi IT, văn bản hành chính...) không.\n");
            sb.append("2. NẾU tài liệu là bất cứ văn bản nào không phải là CV cá nhân ngành CNTT mà ").append(previousAiName).append(" lại chấm điểm kinh nghiệm (experienceMatch) hay dự án (projectRelevance) trên 0%, bạn BẮT BUỘC PHẢI BÁC BỎ (isAgreement: false), sửa điểm về 0, đặt isValidCv: false và đưa ra cảnh báo nhắc nhở người dùng tải đúng CV IT.\n\n");
        }

        sb.append("Nhiệm vụ của bạn:\n");
        sb.append("1. Đánh giá xem kết luận của ").append(previousAiName).append(" có CHÍNH XÁC và hợp lý không.\n");
        sb.append("2. Nếu ĐỒNG Ý là chính xác, hãy xác nhận và giữ nguyên kết luận.\n");
        sb.append("3. Nếu KHÔNG ĐỒNG Ý (cho ra kết quả khác), hãy đưa ra luồng suy nghĩ và kết luận độc lập của bạn.\n\n");
        sb.append("QUY TẮC NGÔN NGỮ BẮT BUỘC:\n");
        sb.append("Toàn bộ phản hồi trong trường 'reasoning' và 'answer' BẮT BUỘC PHẢI VIẾT 100% HOÀN TOÀN BẰNG TIẾNG VIỆT CHUẨN MỰC. TUYỆT ĐỐI KHÔNG DÙNG TIẾNG ANH.\n\n");
        sb.append("Phản hồi BẮT BUỘC theo format JSON:\n");
        sb.append("{\n");
        sb.append("  \"isAgreement\": true,\n");
        sb.append("  \"reasoning\": \"Phân tích đánh giá của bạn (100% bằng tiếng Việt)\",\n");
        sb.append("  \"answer\": \"Kết luận cuối cùng (100% bằng tiếng Việt)\",\n");
        sb.append("  \"confidence\": 92\n");
        sb.append("}\n");

        return sb.toString();
    }

    /**
     * Bóc tách phản hồi JSON từ AI (hỗ trợ cả trường hợp AI bọc trong ```json ... ```)
     */
    public Map<String, Object> parseAiStructuredResponse(String rawAiResponse) {
        Map<String, Object> result = new HashMap<>();
        if (rawAiResponse == null || rawAiResponse.isBlank()) {
            result.put("answer", "Không nhận được phản hồi từ AI.");
            result.put("confidence", 0.0);
            result.put("reasoning", "Empty response");
            return result;
        }

        try {
            String cleanedJson = extractJsonSubstring(rawAiResponse);
            result = objectMapper.readValue(cleanedJson, new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            log.debug("Phản hồi AI không phải JSON chuẩn, trích xuất dưới dạng plain text: {}", e.getMessage());
            result.put("answer", rawAiResponse.trim());
            result.put("reasoning", "AI phản hồi trực tiếp văn bản.");
            result.put("confidence", 85.0);
        }

        // Đảm bảo có các trường cần thiết
        if (!result.containsKey("answer")) {
            result.put("answer", rawAiResponse.trim());
        }
        if (!result.containsKey("reasoning")) {
            result.put("reasoning", "Phân tích tự động từ AI.");
        }
        if (!result.containsKey("confidence")) {
            result.put("confidence", 85.0);
        }

        return result;
    }

    private String extractJsonSubstring(String text) {
        String trimmed = text.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        trimmed = trimmed.trim();

        int firstBrace = trimmed.indexOf('{');
        int lastBrace = trimmed.lastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace) {
            return trimmed.substring(firstBrace, lastBrace + 1);
        }
        return trimmed;
    }
}
