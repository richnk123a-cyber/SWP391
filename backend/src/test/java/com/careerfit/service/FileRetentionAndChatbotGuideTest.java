package com.careerfit.service;

import com.careerfit.ai.assistant.AiAssistantService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import java.io.IOException;
import java.lang.reflect.Method;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class FileRetentionAndChatbotGuideTest {

    @Test
    @DisplayName("Kiểm tra retention CV: Chỉ giữ 2 bản gần nhất, xóa bản thứ 3 trở đi")
    void testCvRetentionKeepTwoDeleteThird(@TempDir Path tempDir) throws Exception {
        CandidateService candidateService = new CandidateService(null, null, null, null);
        String userId = "user-test-cand";
        String profileId = "cand-profile-test";

        // Tạo 3 bản CV giả lập với các mốc thời gian khác nhau
        Path cv1 = tempDir.resolve(userId + "_cv_1000.pdf");
        Path cv2 = tempDir.resolve(userId + "_cv_2000.pdf");
        Path cv3 = tempDir.resolve(userId + "_cv_3000.pdf");

        Files.writeString(cv1, "CV Version 1 (Cũ nhất - Bản thứ 3)");
        Thread.sleep(100);
        Files.writeString(cv2, "CV Version 2 (Liền trước đó - Bản thứ 2)");
        Thread.sleep(100);
        Files.writeString(cv3, "CV Version 3 (Mới nhất - Bản thứ 1)");

        // Gọi method private cleanupOldCvVersions qua Reflection
        Method cleanupMethod = CandidateService.class.getDeclaredMethod("cleanupOldCvVersions", Path.class, String.class, String.class);
        cleanupMethod.setAccessible(true);
        cleanupMethod.invoke(candidateService, tempDir, userId, profileId);

        // Bản #1 (cv3) và Bản #2 (cv2) PHẢI CÒN
        assertTrue(Files.exists(cv3), "Bản mới nhất (cv3) phải được giữ lại");
        assertTrue(Files.exists(cv2), "Bản liền kề trước đó (cv2) phải được giữ lại");

        // Bản #3 (cv1) PHẢI BỊ XÓA
        assertFalse(Files.exists(cv1), "Bản thứ 3 kể từ bản mới nhất (cv1) phải bị xóa khỏi ổ đĩa");

        // Kiểm tra findLatestCvFile phải trả về bản mới nhất (cv3)
        Method findLatestMethod = CandidateService.class.getDeclaredMethod("findLatestCvFile", Path.class, String.class, String.class, String.class);
        findLatestMethod.setAccessible(true);
        Path latestPath = (Path) findLatestMethod.invoke(candidateService, tempDir, userId, profileId, "my_cv.pdf");

        assertNotNull(latestPath);
        assertEquals(cv3.getFileName(), latestPath.getFileName());
    }

    @Test
    @DisplayName("Kiểm tra retention Logo: Chỉ giữ 2 bản gần nhất, xóa bản thứ 3 trở đi")
    void testLogoRetentionKeepTwoDeleteThird(@TempDir Path tempDir) throws Exception {
        EmployerService employerService = new EmployerService(null, null);
        String companyId = "comp-12345";

        Path logo1 = tempDir.resolve("LOGO_" + companyId + "_1000.png");
        Path logo2 = tempDir.resolve("LOGO_" + companyId + "_2000.png");
        Path logo3 = tempDir.resolve("LOGO_" + companyId + "_3000.png");

        Files.writeString(logo1, "Logo V1");
        Thread.sleep(100);
        Files.writeString(logo2, "Logo V2");
        Thread.sleep(100);
        Files.writeString(logo3, "Logo V3");

        Method cleanupMethod = EmployerService.class.getDeclaredMethod("cleanupOldLogoVersions", Path.class, String.class, String.class);
        cleanupMethod.setAccessible(true);
        cleanupMethod.invoke(employerService, tempDir, companyId, "/uploads/" + logo3.getFileName().toString());

        // Bản 3 và Bản 2 giữ lại
        assertTrue(Files.exists(logo3), "Logo mới nhất phải được giữ");
        assertTrue(Files.exists(logo2), "Logo liền kề trước đó phải được giữ");

        // Bản 1 (bản thứ 3) bị xóa
        assertFalse(Files.exists(logo1), "Bản logo thứ 3 kể từ bản mới nhất phải bị xóa");
    }

    @Test
    @DisplayName("Kiểm tra Chatbot checkGuideExitIntent: Không tự thoát ở Bước 2, phân biệt chính xác")
    void testChatbotGuideExitSafety() {
        AiAssistantService assistantService = new AiAssistantService(null, null, null, null, null, null, null);

        // Bước 2: Thông tin cá nhân có tên Huy, Dũng, Nghĩa, Email, Phone -> KHÔNG ĐƯỢC THOÁT
        assertFalse(assistantService.checkGuideExitIntent("Nguyễn Văn Huy - 0987654321 - huy@gmail.com - Hà Nội", "Thông tin cá nhân & Liên hệ"));
        assertFalse(assistantService.checkGuideExitIntent("Trần Tiến Dũng, dungtt@fpt.edu.vn, 0901234567, TP.HCM", "Thông tin cá nhân & Liên hệ"));
        assertFalse(assistantService.checkGuideExitIntent("Lê Văn Nghĩa - nghia@gmail.com - github.com/nghia", "Thông tin cá nhân & Liên hệ"));
        assertFalse(assistantService.checkGuideExitIntent("Nguyễn Văn A - 0987654321 - nguyenvana@gmail.com - Hà Nội - github.com/nguyenvana", "Thông tin cá nhân & Liên hệ"));

        // Bước 3: Học vấn có từ 'Công nghiệp', 'Nghĩa', 'Kinh nghiệm' -> KHÔNG ĐƯỢC THOÁT
        assertFalse(assistantService.checkGuideExitIntent("Đại học Công nghiệp Hà Nội - CNTT - 2026", "Học vấn & Chuyên ngành"));

        // Lệnh THOÁT THẬT -> BẮT BUỘC PHẢI NHẬN DIỆN THOÁT (true)
        assertTrue(assistantService.checkGuideExitIntent("thoát", "Bước 2"));
        assertTrue(assistantService.checkGuideExitIntent("tôi muốn thoát", "Bước 2"));
        assertTrue(assistantService.checkGuideExitIntent("dừng lại", "Bước 2"));
        assertTrue(assistantService.checkGuideExitIntent("hủy bỏ", "Bước 2"));
        assertTrue(assistantService.checkGuideExitIntent("không làm nữa", "Bước 2"));
        assertTrue(assistantService.checkGuideExitIntent("thôi dẹp đi", "Bước 2"));
        assertTrue(assistantService.checkGuideExitIntent("dừng hướng dẫn", "Bước 2"));
    }
    @Test
    @DisplayName("Kiểm tra Job Polish Fallback: Bảo toàn 100% trách nhiệm, đồng bộ category, title và khoảng lương")
    void testPolishJobFidelityAndSync() throws Exception {
        AiAssistantService assistantService = new AiAssistantService(null, null, null, null, null, null, null);

        com.careerfit.ai.assistant.PolishJobRequest req = com.careerfit.ai.assistant.PolishJobRequest.builder()
                .title("Thực tập sinh QA Part-time")
                .category("QA/QC Tester")
                .jobType("Full-time (On-site)")
                .salary("8.000.000 - 12.000.000 VNĐ")
                .responsibilities("Đi làm đúng giờ, có thái độ tích cực")
                .requiredSkills("Manual Testing, Test Cases")
                .benefits("Phụ cấp đầy đủ")
                .build();

        Method fallbackMethod = AiAssistantService.class.getDeclaredMethod("fallbackPolishJob", com.careerfit.ai.assistant.PolishJobRequest.class);
        fallbackMethod.setAccessible(true);
        com.careerfit.ai.assistant.PolishJobResponse res = (com.careerfit.ai.assistant.PolishJobResponse) fallbackMethod.invoke(assistantService, req);

        assertNotNull(res);
        assertNotNull(res.getTemplateJobData());

        // 1. Trách nhiệm người dùng PHẢI ĐƯỢC BẢO TOÀN, KHÔNG BỊA ĐẶT
        @SuppressWarnings("unchecked")
        List<String> resps = (List<String>) res.getTemplateJobData().get("responsibilities");
        assertNotNull(resps);
        assertTrue(resps.contains("Đi làm đúng giờ, có thái độ tích cực"));
        assertFalse(res.getImprovedResponsibilities().toLowerCase().contains(".net"));

        // 2. Chuyên ngành (Category) map sang 6 chuẩn
        assertEquals("QA / Testing", res.getTemplateJobData().get("category"));

        // 3. Khoảng lương bóc tách chính xác
        assertEquals("8", res.getTemplateJobData().get("minSalary"));
        assertEquals("12", res.getTemplateJobData().get("maxSalary"));
        assertEquals("VNĐ", res.getTemplateJobData().get("currency"));

        // 4. Đồng bộ Title & JobType: Full-time không được chứa Part-time
        assertEquals("Full-time", res.getTemplateJobData().get("jobType"));
        assertFalse(res.getImprovedTitle().toLowerCase().contains("part-time"));
        assertFalse(res.getImprovedTitle().toLowerCase().contains("part time"));
    }
}
