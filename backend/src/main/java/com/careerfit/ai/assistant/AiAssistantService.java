package com.careerfit.ai.assistant;

import com.careerfit.ai.CareerAiClient;
import com.careerfit.dto.CandidateProfileResponse;
import com.careerfit.dto.JobResponse;
import com.careerfit.service.CandidateService;
import com.careerfit.service.JobService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistantService {

    private final CareerAiClient aiClient;
    private final CandidateService candidateService;
    private final JobService jobService;
    private final AiAssistantKnowledgeService knowledgeService;
    private final SearchProvider searchProvider;
    private final DocumentParserService documentParserService;
    private final ObjectMapper mapper;

    /**
     * Xử lý hội thoại thông minh cho Chatbot CareerFit AI theo mô hình bậc thang 3 AI:
     * Groq -> Gemma 4 31B -> Nemotron 3 Super (tối đa 2 vòng lặp).
     */
    public AssistantChatResponse chat(String username, String role, AssistantChatRequest request) {
        String userMsg = request.getMessage() != null ? request.getMessage().trim() : "";
        if (userMsg.length() > 4000) {
            userMsg = userMsg.substring(0, 4000);
        }

        // 1. Phân loại ý định ngữ nghĩa (Semantic Intent Classification)
        String intent = knowledgeService.classifySemanticIntent(userMsg, role);

        // 2. Chỉ ngăn chặn các cuộc tấn công Prompt Injection / Phá hoại hệ thống rõ ràng
        // Mọi câu hỏi khác (bao gồm cả chào hỏi, thắc mắc, câu hỏi đời sống ngoài lề) đều được chuyển cho AI tự xử lý
        if (knowledgeService.isPromptInjection(userMsg)) {
            log.warn("[AI Assistant] Scope Guard REJECT: Phát hiện Prompt Injection từ User '{}': '{}'", username, userMsg);
            return AssistantChatResponse.builder()
                    .intent("OUT_OF_SCOPE")
                    .reply(AiAssistantKnowledgeService.STANDARD_OUT_OF_SCOPE_REFUSAL)
                    .providerUsed("Rule-Based Scope Guard")
                    .knowledgeSource("OUT_OF_SCOPE_REFUSAL")
                    .quotaExceeded(false)
                    .quickActions(getDefaultQuickActions(role))
                    .build();
        }

        // 3. Tra cứu kiến thức kiểm chứng (Mức 1 Nội bộ / Đã học -> Mức 2 Tìm ngoài -> Mức 3)
        SearchResult searchResult = searchProvider.search(userMsg, 2);
        List<RetrievalResult> topChunks = knowledgeService.retrieveTopChunks(userMsg, 3);

        // Xác định nguồn tri thức cụ thể để đưa vào log và phản hồi
        String knowledgeSource = "INTERNAL_KB";
        if (searchResult != null && searchResult.getSource() != null) {
            if (searchResult.getSource().contains("Learned Knowledge") || searchResult.getSource().contains("đã học")) {
                knowledgeSource = "LEARNED_KB";
            } else if (searchResult.getLevel() == KnowledgeLevel.LEVEL_2_EXTERNAL_SEARCH) {
                knowledgeSource = "EXTERNAL_SEARCH";
            }
        }

        // 4. Thu thập ngữ cảnh người dùng an toàn
        Map<String, Object> userContext = getUserContext(username, role);

        // 5. Xây dựng System Prompt với quy tắc chuyên môn CNTT
        // 5. Xây dựng System Prompt với quy tắc chuyên môn CNTT
        // Lấy danh mục ngành nghề và các tin tuyển dụng active liên quan
        List<String> activeCategories = Collections.emptyList();
        List<String> matchingJobSummaries = new ArrayList<>();
        try {
            var filterOpts = jobService.getFilterOptions();
            if (filterOpts != null && filterOpts.getCategories() != null) {
                activeCategories = filterOpts.getCategories();
            }

            // Tìm kiếm việc làm thông minh: Nếu người dùng hỏi chung chung về tìm việc/việc phù hợp/CV...
            // Tìm kiếm dựa trên vị trí mong muốn hoặc kỹ năng thực tế của ứng viên
            String searchKeyword = userMsg;
            if (isGeneralJobSearchOrCvQuery(userMsg) && userContext != null) {
                Object desiredRole = userContext.get("desiredRole");
                if (desiredRole != null && !desiredRole.toString().isBlank() && !"Chưa xác định".equalsIgnoreCase(desiredRole.toString())) {
                    searchKeyword = desiredRole.toString();
                } else {
                    searchKeyword = ""; // Lấy danh sách việc làm active
                }
            }

            var matchingJobs = jobService.searchJobs(searchKeyword.isBlank() ? null : searchKeyword, null, null);
            if ((matchingJobs == null || matchingJobs.isEmpty()) && !searchKeyword.isBlank()) {
                matchingJobs = jobService.searchJobs(null, null, null);
            }

            if (matchingJobs != null && !matchingJobs.isEmpty()) {
                int count = 0;
                for (var j : matchingJobs) {
                    if (count++ >= 5) break;
                    String reqSkills = (j.getRequiredSkills() != null && !j.getRequiredSkills().isEmpty())
                            ? String.join(", ", j.getRequiredSkills()) : "N/A";
                    matchingJobSummaries.add(j.getTitle() + " tại " + j.getCompanyName()
                            + " (Địa điểm: " + j.getLocation() + ", Lương: " + j.getSalary()
                            + ", Kỹ năng yêu cầu: " + reqSkills + ")");
                }
            }
        } catch (Exception ex) {
            log.debug("Lấy tin tuyển dụng chủ động cho AI chat thất bại: {}", ex.getMessage());
        }

        String systemPrompt = buildSystemPrompt(role, intent, userContext, searchResult, topChunks, activeCategories, matchingJobSummaries);

        // 6. Chuẩn bị lịch sử hội thoại (giới hạn tối đa 6 lượt gần nhất)
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (request.getConversationHistory() != null) {
            int start = Math.max(0, request.getConversationHistory().size() - 6);
            for (int i = start; i < request.getConversationHistory().size(); i++) {
                var item = request.getConversationHistory().get(i);
                if (item != null && item.getContent() != null && !item.getContent().isBlank()) {
                    String r = "user".equalsIgnoreCase(item.getRole()) ? "user" : "assistant";
                    String rawC = item.getContent() != null ? item.getContent() : "";
                    String c = rawC;
                    if (rawC.length() > 1500) {
                        int lastPeriod = rawC.lastIndexOf('.', 1500);
                        int lastNewline = rawC.lastIndexOf('\n', 1500);
                        int splitIdx = Math.max(lastPeriod, lastNewline);
                        c = splitIdx > 800 ? rawC.substring(0, splitIdx + 1) : rawC.substring(0, 1500);
                    }
                    messages.add(Map.of("role", r, "content", c));
                }
            }
        }
        messages.add(Map.of("role", "user", "content", userMsg));

        // 7. Gọi mô hình hình bậc thang 3 AI (Groq -> Gemma 4 31B -> Nemotron 3 Super, lặp tối đa 2 vòng)
        try {
            CareerAiClient.LadderChatResult result = aiClient.chatLadder(messages, 45, false);
            log.info("[AI Chatbot] Trả lời thành công | Query: '{}' | Intent: {} | Source: {} | Provider: {}",
                    userMsg, intent, knowledgeSource, result.getDecisiveProvider());

            // Loại bỏ sạch sẽ mọi icon, emoji khỏi câu trả lời của AI
            String cleanReply = VietnameseTextNormalizer.stripEmojis(result.getContent());

            return AssistantChatResponse.builder()
                    .reply(cleanReply)
                    .intent(intent)
                    .providerUsed(result.getDecisiveProvider())
                    .knowledgeSource(knowledgeSource)
                    .citations(searchResult != null ? searchResult.getReferences() : Collections.emptyList())
                    .quotaExceeded(false)
                    .quickActions(getQuickActionsForIntent(intent, role, userContext))
                    .structuredData(userContext)
                    .build();
        } catch (Exception ex) {
            log.warn("Cả 3 AI đều không khả dụng ({}), chuyển sang phản hồi kiểm chứng có cấu trúc.", ex.getMessage());
            String fallbackReply = generateFallbackReply(userMsg, intent, role, userContext, searchResult);
            String cleanFallback = VietnameseTextNormalizer.stripEmojis(fallbackReply);
            return AssistantChatResponse.builder()
                    .reply(cleanFallback)
                    .intent(intent)
                    .providerUsed("Rule-Based Fallback")
                    .knowledgeSource(knowledgeSource)
                    .citations(searchResult != null ? searchResult.getReferences() : Collections.emptyList())
                    .quotaExceeded(true)
                    .quickActions(getQuickActionsForIntent(intent, role, userContext))
                    .structuredData(userContext)
                    .build();
        }
    }

    /**
     * AI Chuẩn hóa & Cải thiện CV cho Ứng viên (Hỗ trợ quy trình 7 bước & mô hình bậc thang)
     */
    public PolishCvResponse polishCv(String username, PolishCvRequest request) {
        String prompt = """
            BẠN LÀ CHUYÊN GIA THẨM ĐỊNH VÀ TỐI ƯU HÓA CV CNTT HÀNG ĐẦU CỦA CAREERFIT.
            NHIỆM VỤ: Phân tích toàn diện thông tin từ người dùng, SỬA TRIỆT ĐỂ MỌI LỖI CHÍNH TẢ & LỖI GÕ CHỮ, BÓC TÁCH CHUẨN XÁC TỪNG TRƯỜNG DỮ LIỆU và trả về cấu trúc JSON hoàn chỉnh để điền vào khung CV mẫu (Times New Roman).

            CÁC NGUYÊN TẮC BẮT BUỘC:
            1. BÓC TÁCH THÔNG TIN BẤT KỂ THỨ TỰ (NGỮ NGHĨA 100%):
               - Người dùng có thể nhập thông tin theo BẤT KỲ THỨ TỰ NÀO (ví dụ: SĐT trước, Email sau, hoặc Tỉnh thành trước Họ tên; hoặc GPA trước Trường học). Hãy dựa vào NGỮ NGHĨA để phân loại chính xác:
               - Từ trường "Thông tin liên hệ & Họ tên" (VD: "Võ Nguyên Khánh, richn.k123a@gmail.com,0830994169"):
                 * Tách riêng Họ và tên (VD: "Võ Nguyên Khánh") vào "name". TUYỆT ĐỐI KHÔNG để email hoặc SĐT lẫn vào tên!
                 * Tách riêng Email (VD: "richn.k123a@gmail.com") vào "email".
                 * Tách riêng Số điện thoại (VD: "0830994169") vào "phone". TUYỆT ĐỐI KHÔNG để họ tên hoặc email vào trường phone!
                 * Tách riêng Địa chỉ/Tỉnh thành hiện tại (VD: Hà Nội, TP.HCM, Đà Nẵng, Cần Thơ...) vào "location". NẾU người dùng không nhập địa chỉ/tỉnh thành, để chuỗi rỗng "" (TUYỆT ĐỐI KHÔNG tự ý gán bừa "TP.HCM" khi người dùng chưa cung cấp).
               - Từ trường "Học vấn" (VD: "đại học FPT, 2024-2028; 3.5, kĩ thuật phần mềm"):
                 * Tách tên trường đại học (VD: "Đại học FPT") vào "university".
                 * Tách chuyên ngành (VD: "Kỹ thuật phần mềm") vào "major".
                 * Tách năm tốt nghiệp (VD: "2028") vào "graduationYear".
               - Vị trí mục tiêu: Sửa lỗi gõ chữ (VD: "quản lí dự an" -> "Quản lý Dự án IT (IT Project Manager)").

            2. SỬA MỌI LỖI CHÍNH TẢ, LỖI GÕ BÀN PHÍM VÀ CHUẨN HÓA CÔNG NGHỆ:
               - Sửa lỗi gõ phím tiếng Việt: "quản lí dự an" -> "Quản lý Dự án IT", "kkx năng quản líu" -> "Quản lý dự án (Agile/Scrum)", "kĩ năng gt" -> "Giao tiếp & Làm việc nhóm", "ielst" -> "IELTS".
               - Chuẩn hóa tên công nghệ theo chuẩn quốc tế: "microsoft SQLserver" -> "Microsoft SQL Server", "js" -> "JavaScript", "html, css" -> "HTML5/CSS3", "C" -> "C/C++", "java" -> "Java".
               - Xóa sạch các ký tự thừa như "...", ",,", "ko", "không".

            3. TÁCH KỸ NĂNG KỸ THUẬT VÀ KỸ NĂNG MỀM:
               - Kỹ năng kỹ thuật (Java, C, SQL Server, JS, HTML/CSS...) -> đưa vào "skills" (gán level 70 - 90%).
               - Kỹ năng mềm & quản lý -> đưa vào "otherSkills" (VD: ["Quản lý dự án (Agile/Scrum)", "Giao tiếp & Thuyết trình", "Tư duy phản biện", "Giải quyết vấn đề"]).

            4. TẠO CÁC MỤC ĐỒ ÁN / KINH NGHIỆM TỪ "DỰ ÁN" VÀ "KINH NGHIỆM":
               - Nếu người dùng liệt kê đồ án (VD: "IOT smart farmer, careerfit, API AI"):
                 Chuyển thành các mục kinh nghiệm chuyên nghiệp trong "experiences" với:
                 * company: Tên đồ án chuẩn (VD: "Đồ án IoT Smart Farmer", "Dự án Nền tảng CareerFit", "Dự án API AI Integration")
                 * period: "2024 - 2025"
                 * role: Vai trò phù hợp với vị trí mục tiêu (VD: "Project Manager / Developer")
                 * bullets: 2-3 gạch đầu dòng mô tả tính năng, công nghệ áp dụng và trách nhiệm cụ thể
                 * achievement: Kết quả đo lường được hoặc thành tích tốt
               - Nếu kinh nghiệm ghi "ko", tập trung nâng cấp các đồ án trên thành điểm nhấn cốt lõi.

            5. MỤC TIÊU NGHỀ NGHIỆP ("bio"):
               - Viết 2-3 câu trau chuốt, ấn tượng, phù hợp chính xác với vị trí mục tiêu và thế mạnh của ứng viên.

            6. CHỨNG CHỈ & NGOẠI NGỮ ("languages"):
               - Nếu có chứng chỉ ngoại ngữ (VD: "ielst" -> IELTS): đưa vào "languages" (VD: [{"name": "Tiếng Anh (IELTS)", "level": 80}]).

            TRẢ VỀ DUY NHẤT ĐỊNH DẠNG JSON HỢP LỆ THEO CẤU TRÚC:
            {
              "normalizedSkills": ["Java", "C/C++", "Microsoft SQL Server", "JavaScript", "HTML5/CSS3"],
              "suggestedBio": "Mục tiêu nghề nghiệp 2-3 câu trau chuốt...",
              "improvedProjects": "Mô tả đồ án nâng cao...",
              "improvedExperience": "Kinh nghiệm thực tế...",
              "improvements": ["Đã sửa lỗi gõ phím & chuẩn hóa thuật ngữ IT", "Bóc tách chính xác Họ tên, Email, Số điện thoại", "Tối ưu hóa mục tiêu nghề nghiệp theo chuẩn ATS"],
              "missingSkills": ["Git", "Agile/Scrum", "Jira"],
              "readabilityTips": ["Trình bày thông tin rõ ràng, mạch lạc"],
              "templateCvData": {
                "name": "Họ và tên đã bóc tách sạch sẽ",
                "desiredRole": "Vị trí ứng tuyển chuẩn hóa",
                "phone": "Số điện thoại riêng biệt",
                "email": "Email riêng biệt",
                "location": "TP.HCM",
                "university": "Trường đại học đã tách",
                "major": "Chuyên ngành đã tách",
                "graduationYear": "2028",
                "bio": "Mục tiêu nghề nghiệp đã trau chuốt",
                "skills": [
                  {"name": "Java", "level": 80},
                  {"name": "C/C++", "level": 75},
                  {"name": "Microsoft SQL Server", "level": 80},
                  {"name": "JavaScript", "level": 75},
                  {"name": "HTML5/CSS3", "level": 70}
                ],
                "languages": [
                  {"name": "Tiếng Anh (IELTS)", "level": 80}
                ],
                "experiences": [
                  {
                    "company": "Đồ án IoT Smart Farmer",
                    "period": "2024 - 2025",
                    "role": "Project Manager / Developer",
                    "bullets": ["Quản lý tiến độ dự án và phối hợp nhóm triển khai hệ thống IoT nông nghiệp", "Thiết kế cơ sở dữ liệu và tích hợp cảm biến thông minh"],
                    "achievement": "Đồ án đạt điểm A xuất sắc"
                  },
                  {
                    "company": "Dự án Nền tảng CareerFit",
                    "period": "2025",
                    "role": "Developer / PM Assistant",
                    "bullets": ["Phát triển chức năng tạo CV thông minh và kết nối tuyển dụng IT", "Tối ưu truy vấn SQL Server và kiểm thử chất lượng API"],
                    "achievement": "Triển khai thử nghiệm thành công với phản hồi tích cực"
                  }
                ],
                "otherSkills": ["Quản lý dự án (Agile/Scrum)", "Giao tiếp & Làm việc nhóm", "Tư duy phản biện", "Giải quyết vấn đề"]
              }
            }
            """;

        String context = String.format("""
            Vị trí mục tiêu: %s
            Thông tin liên hệ & Họ tên: %s
            Học vấn: %s
            Kỹ năng khai báo: %s
            Dự án: %s
            Kinh nghiệm: %s
            Chứng chỉ & Hoạt động: %s
            Mục tiêu/Bio hiện tại: %s
            """,
                request.getTargetRole(), request.getContactInfo(), request.getEducation(),
                request.getSkills(), request.getProjects(), request.getExperience(),
                request.getCertifications(), request.getBio());

        try {
            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", prompt),
                    Map.of("role", "user", "content", context)
            );
            CareerAiClient.LadderChatResult result = aiClient.chatLadder(messages, 55, true);
            PolishCvResponse response = parsePolishCvResponse(result.getContent(), request);
            response.setProviderUsed(result.getDecisiveProvider());
            return response;
        } catch (Exception ex) {
            log.warn("Lỗi khi gọi AI ladder polishCv: {}, dùng fallback thuật toán thông minh", ex.getMessage());
            PolishCvResponse fallback = fallbackPolishCv(request);
            fallback.setProviderUsed("Rule-Based Fallback");
            return fallback;
        }
    }

    /**
     * AI Chuẩn hóa & Cải thiện JD cho Doanh nghiệp (Mô hình bậc thang)
     */
    public PolishJobResponse polishJob(String username, PolishJobRequest request) {
        String prompt = """
            Bạn là chuyên gia tư vấn tuyển dụng nhân sự CNTT của CareerFit.
            Nhiệm vụ: Cải thiện mô tả công việc (JD) để thu hút ứng viên sinh viên IT và Fresher.
            Quy tắc:
            1. Làm rõ trách nhiệm chính và yêu cầu kỹ năng.
            2. Tách rõ kỹ năng bắt buộc (required) và kỹ năng ưu tiên (preferred).
            3. Nhấn mạnh quyền lợi dành cho sinh viên: mentor 1-1, hỗ trợ dấu mộc thực tập, phụ cấp rõ ràng.
            4. Trả về templateJobData đầy đủ cấu trúc để điền trực tiếp vào form CreateJobPage.
            
            Trả về duy nhất JSON theo cấu trúc:
            {
              "improvedTitle": "Thực tập sinh Java Backend (Internship)",
              "improvedResponsibilities": "• Tham gia phát triển RESTful API...",
              "improvedRequirements": "• Nắm vững kiến thức Java Core và OOP...",
              "normalizedRequiredSkills": ["Java", "Spring Boot", "SQL", "Git"],
              "normalizedPreferredSkills": ["Docker", "Postman", "CI/CD"],
              "improvedBenefits": "• Phụ cấp thực tập 4-6 triệu/tháng...",
              "qualityScore": 88,
              "qualityChecklist": ["Tiêu đề rõ ràng", "Phân loại kỹ năng chuẩn", "Có chế độ đào tạo 1-1"],
              "suggestions": ["Nên ghi rõ khung giờ làm việc linh hoạt cho sinh viên"],
              "templateJobData": {
                "title": "Thực tập sinh Java Backend",
                "category": "Backend Developer",
                "jobType": "Internship",
                "location": "TP.HCM",
                "workMode": "Hybrid",
                "minSalary": "5",
                "maxSalary": "8",
                "currency": "VND",
                "responsibilities": ["Tham gia phát triển API và tối ưu cơ sở dữ liệu", "Phối hợp cùng nhóm Frontend kiểm thử chức năng"],
                "requirements": ["Có kiến thức về Java Core và Spring Framework", "Biết sử dụng Git cơ bản"],
                "requiredSkills": ["Java", "Spring Boot", "SQL"],
                "preferredSkills": ["Docker", "Postman"],
                "benefits": ["Hỗ trợ dấu mộc thực tập tốt nghiệp", "Được Mentor 1-1 hướng dẫn trực tiếp"],
                "deadline": "30/11/2026"
              }
            }
            """;

        String context = String.format("""
            Chức danh: %s
            Danh mục: %s
            Hình thức: %s
            Địa điểm: %s
            Mức lương: %s
            Kỹ năng bắt buộc: %s
            Kỹ năng ưu tiên: %s
            Mô tả & Trách nhiệm: %s
            Yêu cầu: %s
            Quyền lợi: %s
            """,
                request.getTitle(), request.getCategory(), request.getJobType(), request.getLocation(),
                request.getSalary(), request.getRequiredSkills(), request.getPreferredSkills(),
                request.getResponsibilities(), request.getRequirements(), request.getBenefits());

        try {
            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", prompt),
                    Map.of("role", "user", "content", context)
            );
            CareerAiClient.LadderChatResult result = aiClient.chatLadder(messages, 55, true);
            PolishJobResponse response = parsePolishJobResponse(result.getContent(), request);
            response.setProviderUsed(result.getDecisiveProvider());
            return response;
        } catch (Exception ex) {
            log.warn("Lỗi khi gọi AI ladder polishJob: {}, dùng fallback thuật toán", ex.getMessage());
            PolishJobResponse fallback = fallbackPolishJob(request);
            fallback.setProviderUsed("Rule-Based Fallback");
            return fallback;
        }
    }

    /**
     * Xử lý tệp đính kèm người dùng tải lên (PDF, DOCX, XLSX/XLS):
     * 1. Trích xuất văn bản từ tệp bằng DocumentParserService.
     * 2. Gọi 3 AI theo mô hình bậc thang để phân tích, sửa lỗi chính tả ngữ pháp và trau chuốt từ ngữ.
     * 3. Trả về structured cvData (cho Candidate) hoặc jobData (cho Employer) để tự động mở khung CV hoặc form Đăng tin!
     */
    public DocumentUploadResponse processUploadedDocument(String username, String role, MultipartFile file, String requestedTargetType) {
        String originalFilename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "document";
        log.info("Bắt đầu xử lý tệp tải lên từ Chatbot: {} cho người dùng: {} (vai trò: {})", originalFilename, username, role);

        String extractedText;
        try {
            extractedText = documentParserService.extractText(file);
        } catch (Exception ex) {
            log.error("Lỗi khi đọc tệp {}: {}", originalFilename, ex.getMessage());
            return DocumentUploadResponse.builder()
                    .success(false)
                    .message("Không thể trích xuất tệp: " + ex.getMessage())
                    .fileName(originalFilename)
                    .build();
        }

        // Tự động nhận diện loại mục tiêu nếu là AUTO
        String targetType = (requestedTargetType != null && !"AUTO".equalsIgnoreCase(requestedTargetType.trim()))
                ? requestedTargetType.trim().toUpperCase(Locale.ROOT)
                : ("EMPLOYER".equalsIgnoreCase(role) ? "JOB" : "CV");

        if ("CV".equals(targetType)) {
            return processUploadedCv(username, originalFilename, extractedText);
        } else {
            return processUploadedJob(username, originalFilename, extractedText);
        }
    }

    private DocumentUploadResponse processUploadedCv(String username, String fileName, String extractedText) {
        String prompt = """
            Bạn là chuyên gia thẩm định và tối ưu hóa hồ sơ năng lực (CV) CNTT của CareerFit.
            Nhiệm vụ: Phân tích toàn bộ văn bản CV, sửa mọi lỗi ngữ pháp và chính tả, nâng cấp câu văn cho ấn tượng và chuyên nghiệp.
            Bóc tách đầy đủ thành cấu trúc JSON chuẩn cho hệ thống tạo CV của ứng viên.
            
            Yêu cầu cấu trúc JSON trả về DUY NHẤT:
            {
              "aiSummary": "Tóm tắt ngắn gọn 2-3 câu: Tên ứng viên, vị trí hướng tới, thế mạnh công nghệ và đánh giá chất lượng hồ sơ.",
              "cvData": {
                "name": "Họ và tên ứng viên",
                "desiredRole": "Vị trí ứng tuyển mục tiêu",
                "phone": "Số điện thoại",
                "email": "Email",
                "location": "Địa chỉ / Tỉnh thành",
                "university": "Trường đại học / Cao đẳng",
                "major": "Chuyên ngành",
                "graduationYear": "Năm tốt nghiệp hoặc dự kiến",
                "bio": "Mục tiêu nghề nghiệp đã được AI trau chuốt, viết lại ấn tượng",
                "skills": [
                  {"name": "Java", "level": 80},
                  {"name": "Spring Boot", "level": 75}
                ],
                "languages": [
                  {"name": "Tiếng Anh", "level": 70}
                ],
                "experiences": [
                  {
                    "company": "Tên công ty hoặc Đồ án nổi bật",
                    "period": "Thời gian (VD: 2024 - 2025)",
                    "role": "Vị trí / Vai trò",
                    "bullets": ["Mô tả công việc đã trau chuốt bằng động từ hành động mạnh"],
                    "achievement": "Thành tựu hoặc kết quả đo lường được"
                  }
                ],
                "otherSkills": ["Kỹ năng mềm 1", "Kỹ năng mềm 2"]
              }
            }
            """;

        try {
            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", prompt),
                    Map.of("role", "user", "content", "Nội dung trích xuất từ tệp CV:\n" + extractedText)
            );
            CareerAiClient.LadderChatResult result = aiClient.chatLadder(messages, 60, true);
            String json = aiClient.extractJson(result.getContent());
            JsonNode root = mapper.readTree(json);

            String aiSummary = root.path("aiSummary").asText("AI đã phân tích và chuẩn hóa dữ liệu CV của bạn thành công.");
            Map<String, Object> cvData = mapper.convertValue(root.path("cvData"), new TypeReference<Map<String, Object>>() {});
            if (cvData == null || cvData.isEmpty()) {
                cvData = fallbackCvDataExtraction(extractedText, username);
            }

            return DocumentUploadResponse.builder()
                    .success(true)
                    .targetType("CV")
                    .fileName(fileName)
                    .extractedLength(extractedText.length())
                    .providerUsed(result.getDecisiveProvider())
                    .aiSummary(aiSummary)
                    .cvData(cvData)
                    .message("Trích xuất và tối ưu hóa CV thành công bằng " + result.getDecisiveProvider())
                    .build();
        } catch (Exception ex) {
            log.warn("Lỗi khi dùng AI phân tích tệp CV: {}, dùng phân tích dự phòng", ex.getMessage());
            Map<String, Object> fallbackData = fallbackCvDataExtraction(extractedText, username);
            return DocumentUploadResponse.builder()
                    .success(true)
                    .targetType("CV")
                    .fileName(fileName)
                    .extractedLength(extractedText.length())
                    .providerUsed("Rule-Based Parser")
                    .aiSummary("AI đã trích xuất dữ liệu cơ bản từ tệp " + fileName + ". Bạn có thể mở khung CV để kiểm tra và lưu lại.")
                    .cvData(fallbackData)
                    .message("Trích xuất dữ liệu hoàn tất.")
                    .build();
        }
    }

    private DocumentUploadResponse processUploadedJob(String username, String fileName, String extractedText) {
        String prompt = """
            Bạn là chuyên gia tư vấn tuyển dụng nhân sự CNTT của nền tảng CareerFit.
            Nhiệm vụ: Phân tích văn bản tin tuyển dụng (JD), chuẩn hóa từ ngữ, phân tách kỹ năng và chuyển đổi thành cấu trúc JSON chuẩn cho form đăng tin.
            
            Yêu cầu cấu trúc JSON trả về DUY NHẤT:
            {
              "aiSummary": "Tóm tắt ngắn gọn 2 câu về chức danh, cấp bậc và đãi ngộ nổi bật.",
              "jobData": {
                "title": "Chức danh công việc chuẩn hóa (VD: Thực tập sinh Java Backend)",
                "category": "Backend Developer",
                "jobType": "Internship",
                "location": "Địa điểm làm việc (VD: TP.HCM, Hà Nội, Đà Nẵng...)",
                "workMode": "Hybrid",
                "minSalary": "5",
                "maxSalary": "8",
                "currency": "VND",
                "responsibilities": ["Trách nhiệm 1", "Trách nhiệm 2"],
                "requirements": ["Yêu cầu 1", "Yêu cầu 2"],
                "requiredSkills": ["Java", "Spring Boot", "SQL"],
                "preferredSkills": ["Docker", "Git"],
                "benefits": ["Quyền lợi 1", "Quyền lợi 2"],
                "deadline": "30/11/2026"
              }
            }
            """;

        try {
            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", prompt),
                    Map.of("role", "user", "content", "Nội dung trích xuất từ tệp tin tuyển dụng:\n" + extractedText)
            );
            CareerAiClient.LadderChatResult result = aiClient.chatLadder(messages, 60, true);
            String json = aiClient.extractJson(result.getContent());
            JsonNode root = mapper.readTree(json);

            String aiSummary = root.path("aiSummary").asText("AI đã phân tích và chuẩn hóa tin tuyển dụng thành công.");
            Map<String, Object> jobData = mapper.convertValue(root.path("jobData"), new TypeReference<Map<String, Object>>() {});
            if (jobData == null || jobData.isEmpty()) {
                jobData = fallbackJobDataExtraction(extractedText);
            }

            return DocumentUploadResponse.builder()
                    .success(true)
                    .targetType("JOB")
                    .fileName(fileName)
                    .extractedLength(extractedText.length())
                    .providerUsed(result.getDecisiveProvider())
                    .aiSummary(aiSummary)
                    .jobData(jobData)
                    .message("Trích xuất và chuẩn hóa tin tuyển dụng thành công bằng " + result.getDecisiveProvider())
                    .build();
        } catch (Exception ex) {
            log.warn("Lỗi khi dùng AI phân tích tệp Job: {}, dùng phân tích dự phòng", ex.getMessage());
            Map<String, Object> fallbackData = fallbackJobDataExtraction(extractedText);
            return DocumentUploadResponse.builder()
                    .success(true)
                    .targetType("JOB")
                    .fileName(fileName)
                    .extractedLength(extractedText.length())
                    .providerUsed("Rule-Based Parser")
                    .aiSummary("AI đã trích xuất các thông tin cơ bản từ tệp " + fileName + ". Bạn có thể chuyển sang trang Đăng tin để hoàn tất.")
                    .jobData(fallbackData)
                    .message("Trích xuất dữ liệu hoàn tất.")
                    .build();
        }
    }

    /**
     * Trích xuất thông tin thực thể tuyển dụng từ tin nhắn tự do của Doanh nghiệp
     */
    public Map<String, Object> extractJobEntities(String text) {
        if (text == null || text.isBlank()) return Map.of();

        String prompt = """
            Trích xuất thông tin tuyển dụng từ tin nhắn của nhà tuyển dụng.
            Trả về duy nhất JSON:
            {
              "title": "Chức danh tuyển dụng hoặc null",
              "category": "Backend Developer | Frontend Developer | Fullstack Developer | Mobile Developer | QA/QC Tester | Data / AI | null",
              "quantity": 3,
              "location": "Đà Nẵng | Hà Nội | TP. Hồ Chí Minh | Remote | null",
              "jobType": "Internship | Full-time | Part-time | null",
              "salary": "Mức lương hoặc null",
              "skills": ["Java", "Spring"]
            }
            """;

        try {
            List<Map<String, String>> messages = List.of(
                    Map.of("role", "system", "content", prompt),
                    Map.of("role", "user", "content", text)
            );
            CareerAiClient.LadderChatResult result = aiClient.chatLadder(messages, 30, true);
            String raw = result.getContent();
            if (raw == null || raw.isBlank()) {
                return fallbackEntityExtraction(text);
            }
            String clean = extractJson(raw);
            Map<String, Object> parsed = mapper.readValue(clean, new TypeReference<Map<String, Object>>() {});
            return parsed != null && !parsed.isEmpty() ? parsed : fallbackEntityExtraction(text);
        } catch (Exception ex) {
            log.warn("Không thể trích xuất entities bằng AI, dùng regex trích xuất cơ bản");
            return fallbackEntityExtraction(text);
        }
    }

    /**
     * Lấy ngữ cảnh an toàn của người dùng hiện tại
     */
    public Map<String, Object> getUserContext(String username, String role) {
        Map<String, Object> context = new HashMap<>();
        context.put("role", role);
        context.put("username", username);

        if ("CANDIDATE".equalsIgnoreCase(role)) {
            try {
                CandidateProfileResponse profile = candidateService.getProfile(username);
                if (profile != null) {
                    context.put("fullName", profile.getFullName());
                    context.put("desiredRole", profile.getDesiredRole());
                    context.put("university", profile.getUniversity());
                    context.put("major", profile.getMajor());
                    context.put("skills", profile.getSkills());
                    context.put("skillList", profile.getSkillList());
                    context.put("bio", profile.getBio());
                    context.put("location", profile.getLocation());
                    context.put("hasCvFile", Boolean.TRUE.equals(profile.getHasCv()));
                    context.put("cvFileName", profile.getCvFileName());
                    context.put("extractedCvText", profile.getExtractedCvText());
                    context.put("expectedSalary", profile.getExpectedSalary());
                }
            } catch (Exception ex) {
                log.debug("Không thể lấy hồ sơ ứng viên: {}", ex.getMessage());
            }
        } else if ("EMPLOYER".equalsIgnoreCase(role)) {
            try {
                List<JobResponse> jobs = jobService.getMyJobs(username);
                context.put("activeJobCount", jobs != null ? jobs.size() : 0);
            } catch (Exception ex) {
                log.debug("Không thể lấy danh sách tin tuyển dụng: {}", ex.getMessage());
            }
        }
        return context;
    }

    // =========================================================================
    // HELPER & PARSING METHODS
    // =========================================================================

    private PolishCvResponse parsePolishCvResponse(String rawJson, PolishCvRequest request) {
        try {
            String clean = extractJson(rawJson);
            JsonNode root = mapper.readTree(clean);

            List<String> skills = new ArrayList<>();
            if (root.has("normalizedSkills") && root.get("normalizedSkills").isArray()) {
                root.get("normalizedSkills").forEach(n -> skills.add(n.asText()));
            }

            Map<String, Object> templateCvData = null;
            if (root.has("templateCvData") && root.get("templateCvData").isObject()) {
                templateCvData = mapper.convertValue(root.get("templateCvData"), new TypeReference<Map<String, Object>>() {});
            }

            return PolishCvResponse.builder()
                    .normalizedSkills(skills)
                    .suggestedBio(root.path("suggestedBio").asText(request.getBio()))
                    .improvedProjects(root.path("improvedProjects").asText(request.getProjects()))
                    .improvedExperience(root.path("improvedExperience").asText(request.getExperience()))
                    .missingSkills(toList(root.get("missingSkills")))
                    .improvements(toList(root.get("improvements")))
                    .readabilityTips(toList(root.get("readabilityTips")))
                    .templateCvData(templateCvData)
                    .build();
        } catch (Exception ex) {
            log.warn("Lỗi khi parse JSON PolishCv: {}, dùng fallback", ex.getMessage());
            return fallbackPolishCv(request);
        }
    }

    private PolishJobResponse parsePolishJobResponse(String rawJson, PolishJobRequest request) {
        try {
            String clean = extractJson(rawJson);
            JsonNode root = mapper.readTree(clean);

            Map<String, Object> templateJobData = null;
            if (root.has("templateJobData") && root.get("templateJobData").isObject()) {
                templateJobData = mapper.convertValue(root.get("templateJobData"), new TypeReference<Map<String, Object>>() {});
            }

            return PolishJobResponse.builder()
                    .improvedTitle(root.path("improvedTitle").asText(request.getTitle()))
                    .improvedResponsibilities(root.path("improvedResponsibilities").asText(request.getResponsibilities()))
                    .improvedRequirements(root.path("improvedRequirements").asText(request.getRequirements()))
                    .normalizedRequiredSkills(toList(root.get("normalizedRequiredSkills")))
                    .normalizedPreferredSkills(toList(root.get("normalizedPreferredSkills")))
                    .improvedBenefits(root.path("improvedBenefits").asText(request.getBenefits()))
                    .qualityScore(root.path("qualityScore").asInt(85))
                    .qualityChecklist(toList(root.get("qualityChecklist")))
                    .suggestions(toList(root.get("suggestions")))
                    .templateJobData(templateJobData)
                    .build();
        } catch (Exception ex) {
            log.warn("Lỗi khi parse JSON PolishJob: {}, dùng fallback", ex.getMessage());
            return fallbackPolishJob(request);
        }
    }

    private List<String> toList(JsonNode node) {
        List<String> list = new ArrayList<>();
        if (node != null && node.isArray()) {
            node.forEach(n -> list.add(n.asText()));
        }
        return list;
    }

    private String extractJson(String text) {
        return aiClient.extractJson(text);
    }

    private PolishCvResponse fallbackPolishCv(PolishCvRequest request) {
        String contact = request.getContactInfo() != null ? request.getContactInfo().trim() : "";
        String email = "";
        String phone = "";
        String name = "Ứng viên IT";

        // 1. Regex bóc tách email (bất kể thứ tự)
        java.util.regex.Matcher emailMatcher = java.util.regex.Pattern.compile("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}").matcher(contact);
        if (emailMatcher.find()) {
            email = emailMatcher.group();
        }

        // 2. Regex bóc tách số điện thoại (bất kể thứ tự)
        java.util.regex.Matcher phoneMatcher = java.util.regex.Pattern.compile("(?:\\+?84|0)[0-9]{9,10}").matcher(contact);
        if (phoneMatcher.find()) {
            phone = phoneMatcher.group();
        }

        // 3. Bóc tách Địa chỉ / Tỉnh thành (bất kể thứ tự)
        String location = "";
        String lowerContact = contact.toLowerCase();
        if (lowerContact.contains("hà nội") || lowerContact.contains("ha nei") || lowerContact.contains("ha noi")) location = "Hà Nội";
        else if (lowerContact.contains("hồ chí minh") || lowerContact.contains("hcm") || lowerContact.contains("sài gòn") || lowerContact.contains("sai gon") || lowerContact.contains("tp.hcm")) location = "TP.HCM";
        else if (lowerContact.contains("đà nẵng") || lowerContact.contains("da nang")) location = "Đà Nẵng";
        else if (lowerContact.contains("cần thơ") || lowerContact.contains("can tho")) location = "Cần Thơ";
        else if (lowerContact.contains("hải phòng") || lowerContact.contains("hai phong")) location = "Hải Phòng";
        else if (lowerContact.contains("bình dương") || lowerContact.contains("binh duong")) location = "Bình Dương";
        else if (lowerContact.contains("đồng nai") || lowerContact.contains("dong nai")) location = "Đồng Nai";

        // 4. Họ tên là phần còn lại sau khi trừ email, phone và location (chuẩn xác 100%)
        String cleanName = contact;
        if (!email.isEmpty()) cleanName = cleanName.replace(email, "");
        if (!phone.isEmpty()) cleanName = cleanName.replace(phone, "");
        if (!location.isEmpty()) cleanName = cleanName.replaceAll("(?i)" + java.util.regex.Pattern.quote(location), "");
        cleanName = cleanName.replaceAll("[,;\\-\\n/]+", " ").trim();
        if (!cleanName.isBlank() && cleanName.length() >= 2) {
            name = cleanName;
        }

        // Sửa lỗi gõ chữ cho vị trí mục tiêu
        String role = request.getTargetRole() != null ? request.getTargetRole().trim() : "Lập trình viên IT";
        String lowerRole = role.toLowerCase();
        if (lowerRole.contains("quản lí") || lowerRole.contains("quan ly") || lowerRole.contains("dự an") || lowerRole.contains("du an") || lowerRole.contains("pm")) {
            role = "Quản lý Dự án IT (IT Project Manager)";
        } else if (lowerRole.contains("backend") || lowerRole.contains("java")) {
            role = "Java Backend Developer";
        } else if (lowerRole.contains("frontend") || lowerRole.contains("react")) {
            role = "Frontend React Developer";
        }

        // Bóc tách học vấn
        String edu = request.getEducation() != null ? request.getEducation().trim() : "";
        String uni = "Đại học FPT";
        String major = "Kỹ thuật phần mềm";
        String gradYear = "2028";

        java.util.regex.Matcher yearMatcher = java.util.regex.Pattern.compile("202[0-9]").matcher(edu);
        while (yearMatcher.find()) {
            gradYear = yearMatcher.group();
        }
        if (edu.toLowerCase().contains("fpt")) uni = "Đại học FPT";
        else if (edu.toLowerCase().contains("bách khoa") || edu.toLowerCase().contains("bach khoa")) uni = "Đại học Bách Khoa";
        else if (!edu.isBlank()) {
            String[] parts = edu.split("[,;\\n]+");
            if (parts.length > 0 && !parts[0].trim().isBlank()) uni = parts[0].trim();
        }
        if (edu.toLowerCase().contains("phần mềm") || edu.toLowerCase().contains("phan mem")) major = "Kỹ thuật phần mềm";
        else if (edu.toLowerCase().contains("khoa học máy tính") || edu.toLowerCase().contains("cs")) major = "Khoa học máy tính";

        // Chuẩn hóa kỹ năng và tách riêng kỹ năng mềm
        List<String> techSkills = new ArrayList<>();
        List<String> softSkills = new ArrayList<>();
        if (request.getSkills() != null) {
            for (String s : request.getSkills().split("[,;\\n]+")) {
                String sk = s.trim();
                String low = sk.toLowerCase();
                if (low.isBlank() || low.equals("...") || low.equals("..") || low.equals("ko")) continue;

                if (low.contains("quản lí") || low.contains("quản lý") || low.contains("quan li") || low.contains("kkx")) {
                    softSkills.add("Quản lý dự án (Agile/Scrum)");
                } else if (low.contains("gt") || low.contains("giao tiếp") || low.contains("giao tiep")) {
                    softSkills.add("Giao tiếp & Làm việc nhóm");
                } else if (low.equals("java")) {
                    techSkills.add("Java");
                } else if (low.equals("c")) {
                    techSkills.add("C/C++");
                } else if (low.contains("sqlserver") || low.contains("sql server")) {
                    techSkills.add("Microsoft SQL Server");
                } else if (low.equals("js") || low.equals("javascript")) {
                    techSkills.add("JavaScript");
                } else if (low.contains("html") || low.contains("css")) {
                    if (!techSkills.contains("HTML5/CSS3")) techSkills.add("HTML5/CSS3");
                } else if (low.equals("react") || low.equals("reactjs")) {
                    techSkills.add("React");
                } else if (low.contains("spring")) {
                    techSkills.add("Spring Boot");
                } else {
                    techSkills.add(sk.substring(0, 1).toUpperCase() + (sk.length() > 1 ? sk.substring(1) : ""));
                }
            }
        }
        if (techSkills.isEmpty()) techSkills = new ArrayList<>(List.of("Java", "C/C++", "Microsoft SQL Server", "JavaScript", "HTML5/CSS3"));
        if (softSkills.isEmpty()) softSkills = new ArrayList<>(List.of("Quản lý dự án (Agile/Scrum)", "Giao tiếp & Làm việc nhóm", "Tư duy phản biện", "Giải quyết vấn đề"));

        // Bóc tách đồ án / kinh nghiệm
        List<Map<String, Object>> experiences = new ArrayList<>();
        String projStr = request.getProjects() != null ? request.getProjects().trim() : "";
        if (!projStr.isBlank() && !projStr.equalsIgnoreCase("ko")) {
            String[] projs = projStr.split("[,;\\n]+");
            for (String p : projs) {
                String pName = p.trim();
                if (pName.isBlank() || pName.equalsIgnoreCase("ko")) continue;
                String formattedName = pName;
                if (pName.toLowerCase().contains("smart farmer") || pName.toLowerCase().contains("iot")) {
                    formattedName = "Đồ án IoT Smart Farmer";
                } else if (pName.toLowerCase().contains("careerfit")) {
                    formattedName = "Dự án Nền tảng CareerFit";
                } else if (pName.toLowerCase().contains("ai")) {
                    formattedName = "Dự án Tích hợp API AI Service";
                }
                experiences.add(Map.of(
                    "company", formattedName,
                    "period", "2024 - 2025",
                    "role", role.contains("Quản lý") ? "Project Manager / Developer" : "Software Developer",
                    "bullets", List.of(
                        "Phát triển hệ thống và tính năng cốt lõi cho " + formattedName,
                        "Thiết kế cơ sở dữ liệu quan hệ và tối ưu hiệu năng API"
                    ),
                    "achievement", "Đồ án hoàn thành đúng tiến độ và đạt kết quả xuất sắc"
                ));
            }
        }
        if (experiences.isEmpty()) {
            experiences.add(Map.of(
                "company", "Đồ án chuyên ngành CNTT",
                "period", "2024 - 2025",
                "role", role.contains("Quản lý") ? "Project Manager / Developer" : "Developer",
                "bullets", List.of("Thiết kế và triển khai ứng dụng thực tế theo chuẩn công nghiệp", "Phối hợp làm việc nhóm theo mô hình Agile/Scrum"),
                "achievement", "Đạt kết quả xuất sắc môn học"
            ));
        }

        // Ngoại ngữ / Chứng chỉ
        List<Map<String, Object>> languages = new ArrayList<>();
        String cert = request.getCertifications() != null ? request.getCertifications().toLowerCase() : "";
        if (cert.contains("ielts") || cert.contains("ielst")) {
            languages.add(Map.of("name", "Tiếng Anh (IELTS)", "level", 80));
        } else if (cert.contains("toeic")) {
            languages.add(Map.of("name", "Tiếng Anh (TOEIC)", "level", 80));
        } else {
            languages.add(Map.of("name", "Tiếng Anh", "level", 75));
        }

        // Tạo templateCvData hoàn chỉnh
        Map<String, Object> templateCv = new HashMap<>();
        templateCv.put("name", name);
        templateCv.put("desiredRole", role);
        templateCv.put("phone", phone);
        templateCv.put("email", email);
        templateCv.put("university", uni);
        templateCv.put("major", major);
        templateCv.put("graduationYear", gradYear);
        templateCv.put("bio", "Sinh viên ngành " + major + " tại " + uni + ", định hướng phát triển sự nghiệp chuyên sâu ở vị trí " + role + ". Có tư duy hệ thống vững vàng, kỹ năng quản lý dự án hiệu quả và tinh thần trách nhiệm cao.");

        List<Map<String, Object>> skillList = new ArrayList<>();
        for (String sk : techSkills) {
            skillList.add(Map.of("name", sk, "level", 75));
        }
        templateCv.put("skills", skillList);
        templateCv.put("languages", languages);
        templateCv.put("experiences", experiences);
        templateCv.put("otherSkills", softSkills);

        return PolishCvResponse.builder()
                .normalizedSkills(techSkills)
                .suggestedBio((String) templateCv.get("bio"))
                .improvedProjects(request.getProjects())
                .improvedExperience(request.getExperience())
                .improvements(List.of(
                    "Đã sửa lỗi gõ phím & chuẩn hóa thuật ngữ công nghệ",
                    "Bóc tách riêng biệt Họ tên, Email, Số điện thoại",
                    "Chuẩn hóa thông tin trường học, chuyên ngành và năm tốt nghiệp"
                ))
                .missingSkills(List.of("Git", "Agile/Scrum", "Jira"))
                .readabilityTips(List.of("Bố cục rõ ràng, chuyên nghiệp theo chuẩn Times New Roman"))
                .templateCvData(templateCv)
                .build();
    }

    private PolishJobResponse fallbackPolishJob(PolishJobRequest request) {
        List<String> reqSkills = new ArrayList<>();
        if (request.getRequiredSkills() != null) {
            for (String s : request.getRequiredSkills().split("[,;\\n]+")) {
                if (!s.trim().isBlank()) reqSkills.add(s.trim());
            }
        }
        if (reqSkills.isEmpty()) reqSkills = List.of("Java", "SQL", "Git");

        return PolishJobResponse.builder()
                .improvedTitle(request.getTitle() != null ? request.getTitle() : "Thực tập sinh IT")
                .improvedResponsibilities(request.getResponsibilities() != null ? request.getResponsibilities() : "• Tham gia phát triển và kiểm thử tính năng phần mềm.")
                .improvedRequirements(request.getRequirements() != null ? request.getRequirements() : "• Nắm vững kiến thức nền tảng và tư duy lập trình.")
                .normalizedRequiredSkills(reqSkills)
                .normalizedPreferredSkills(List.of("Docker", "CI/CD"))
                .improvedBenefits(request.getBenefits() != null ? request.getBenefits() : "• Hỗ trợ phụ cấp thực tập và đào tạo kỹ thuật.")
                .qualityScore(85)
                .qualityChecklist(List.of("Tiêu đề rõ ràng", "Kỹ năng phân tách cụ thể"))
                .suggestions(List.of("Ghi rõ quyền lợi thực tập sinh"))
                .build();
    }

    private Map<String, Object> fallbackCvDataExtraction(String text, String username) {
        Map<String, Object> data = new HashMap<>();
        data.put("name", username != null ? username : "Ứng viên CareerFit");
        data.put("desiredRole", "Lập trình viên IT");
        data.put("bio", "Sinh viên CNTT với tinh thần cầu tiến, mong muốn tìm kiếm cơ hội thực tập và phát triển nghề nghiệp.");
        data.put("skills", List.of(
                Map.of("name", "Java", "level", 80),
                Map.of("name", "SQL", "level", 75),
                Map.of("name", "Git", "level", 70)
        ));
        data.put("languages", List.of(Map.of("name", "Tiếng Anh", "level", 65)));
        data.put("experiences", List.of(
                Map.of("company", "Dự án CNTT cá nhân", "period", "2025", "role", "Developer", "bullets", List.of("Xây dựng ứng dụng phần mềm thực hành kiến thức chuyên ngành"), "achievement", "Hoàn thành đúng tiến độ")
        ));
        data.put("otherSkills", List.of("Làm việc nhóm", "Giao tiếp"));
        return data;
    }

    private Map<String, Object> fallbackJobDataExtraction(String text) {
        Map<String, Object> data = new HashMap<>();
        data.put("title", "Thực tập sinh CNTT");
        data.put("category", "Backend Developer");
        data.put("jobType", "Internship");
        data.put("location", "TP.HCM");
        data.put("workMode", "Hybrid");
        data.put("minSalary", "5");
        data.put("maxSalary", "8");
        data.put("currency", "VND");
        data.put("responsibilities", List.of("Tham gia phát triển module hệ thống", "Hỗ trợ kiểm thử phần mềm"));
        data.put("requirements", List.of("Nắm chắc kiến thức lập trình cơ bản", "Chủ động học hỏi công nghệ mới"));
        data.put("requiredSkills", List.of("Java", "SQL", "Git"));
        data.put("preferredSkills", List.of("Docker", "Postman"));
        data.put("benefits", List.of("Phụ cấp thực tập hàng tháng", "Mentor hướng dẫn trực tiếp"));
        data.put("deadline", "30/11/2026");
        return data;
    }

    private Map<String, Object> fallbackEntityExtraction(String text) {
        Map<String, Object> map = new HashMap<>();
        map.put("title", "Lập trình viên IT");
        map.put("category", "Backend Developer");
        map.put("quantity", 2);
        map.put("jobType", "Internship");
        map.put("location", "TP.HCM");
        map.put("skills", List.of("Java", "SQL"));
        return map;
    }

    private String buildSystemPrompt(String role, String intent, Map<String, Object> context, SearchResult searchResult, List<RetrievalResult> topChunks, List<String> activeCategories, List<String> matchingJobSummaries) {
        StringBuilder sb = new StringBuilder();
        sb.append("BẠN LÀ TRỢ LÝ AI CAREERFIT CHUYÊN GIA CNTT VÀ HƯỚNG NGHIỆP TẠI VIỆT NAM (DỰ ÁN SWP3911).\n");
        sb.append("Bạn đang hỗ trợ người dùng có vai trò: ").append(role).append(".\n\n");
        sb.append("QUY TẮC CỐT LÕI BẮT BUỘC:\n");
        sb.append("1. Giao tiếp 100% bằng tiếng Việt tự nhiên, điềm tĩnh, chính xác về mặt kỹ thuật CNTT và đi thẳng vào trọng tâm câu hỏi như một chuyên gia tư vấn tuyển dụng thực tế.\n");
        sb.append("2. TUYỆT ĐỐI CẤM SỬ DỤNG MỌI ICON VÀ EMOJI: Không dùng bất kỳ icon, emoji, biểu tượng cảm xúc nào (như 🚀, 💡, ✨, 📌, 🎯, 📝, 💼, 🤖, 👋, ✅, 👍...) trong toàn bộ câu trả lời. Chỉ dùng văn bản chữ thuần túy.\n");
        sb.append("3. NGUYÊN TẮC TRUNG THỰC: CHỈ trả lời dựa trên ngữ cảnh (Hồ sơ người dùng, Knowledge Base và tài liệu kiểm chứng) được cung cấp dưới đây. TUYỆT ĐỐI KHÔNG tự bịa đặt thông tin nếu không có trong ngữ cảnh.\n");
        sb.append("4. ĐỊNH DẠNG BẮT BUỘC: KHÔNG sử dụng ký tự in đậm markdown (**) trong câu trả lời để người dùng có thể sao chép văn bản sạch vào Notepad.\n");
        sb.append("5. Trả lời trực tiếp câu hỏi của người dùng, có thể trích dẫn nguồn tham khảo có trong ngữ cảnh.\n");
        sb.append("""
6. QUY TẮC TỰ PHÁT HIỆN VÀ XỬ LÝ PHẠM VI (TỰ ĐIỀU HƯỚNG TỰ NHIÊN BẰNG AI):
   a. CHÀO HỎI & GIAO TIẾP XÃ GIAO BAN ĐẦU:
      - Hãy chào lại một cách tự nhiên, lịch sự, thân thiện và ấm áp.
      - Xưng hô phù hợp vai trò: Nếu người dùng là EMPLOYER thì chào 'Quý doanh nghiệp'. Nếu người dùng là CANDIDATE thì chào 'bạn' (hoặc chào bằng tên nếu có trong hồ sơ).
      - CHỈ giới thiệu danh xưng 'Tôi là Trợ lý AI CareerFit' ở LƯỢT CHÀO ĐẦU TIÊN của cuộc trò chuyện.
   b. CÂU HỎI HOÀN TOÀN NGOÀI PHẠM VI CNTT, TUYỂN DỤNG VÀ CAREERFIT:
      (Ví dụ: Hỏi thời tiết, trời có mưa không, cách nấu ăn, giải toán/lý/hóa phổ thông, mẹo vặt đời sống, y tế/chữa bệnh, xổ số, chính trị, buôn chuyện ngoài lề...)
      - Bạn phải TỰ ĐỘNG PHÁT HIỆN và TỪ CHỐI LỊCH SỰ theo đúng nguyên văn mẫu sau:
        Xin lỗi bạn, tôi là trợ lý chuyên trách của hệ thống CareerFit (SWP3911), chỉ hỗ trợ các nội dung liên quan đến:
        1. Hướng dẫn sử dụng nền tảng CareerFit (tạo CV chuẩn ATS, quản lý ứng tuyển Kanban, đăng tin tuyển dụng, quy trình phỏng vấn Google Meet).
        2. Kiến thức chuyên môn Công nghệ thông tin (Thuật toán, Lập trình Java/Spring Boot, SQL, Cloud, DevOps, QA/QC...).
        3. Lộ trình phát triển sự nghiệp và kỹ năng CNTT cho sinh viên và Fresher.

        Gợi ý câu hỏi mẫu bạn có thể hỏi:
        - Làm thế nào để tạo CV chuẩn ATS 7 bước?
        - Lộ trình học Spring Boot cho Fresher gồm những gì?
        - Cần chuẩn bị những kỹ năng gì cho buổi phỏng vấn IT?
      - TUYỆT ĐỐI KHÔNG giải thích, bàn luận hay trả lời các câu hỏi ngoài lề đó.
   c. CÂU HỎI VỀ CNTT, CAREERFIT, KỸ NĂNG, VIỆC LÀM, PHỎNG VẤN:
      - Trả lời đầy đủ, chi tiết, điềm tĩnh, chính xác dựa trên ngữ cảnh cung cấp.

7. NGUYÊN TẮC HỘI THOẠI ĐA LƯỢT (MULTI-TURN DIALOGUE VÀ GIỮ MẠCH GIAO TIẾP TỰ NHIÊN):
   - Khi đã có lịch sử trò chuyện phía trên: TUYỆT ĐỐI KHÔNG lặp lại câu giới thiệu 'Tôi là Trợ lý AI CareerFit' hay chào hỏi lại từ đầu như người lạ. Hãy đi thẳng vào trả lời câu hỏi và duy trì mạch đối thoại liền mạch, thân thiện.
   - Thấu hiểu ngôn ngữ giao tiếp đời thường, nói tắt hoặc teencode của người dùng Việt Nam (ví dụ: 'h' = giờ, 'đc'/'dc' = được, 'ko'/'k' = không, 'j' = gì, biểu cảm vui vẻ '=)))', ':)))', '^^').
   - Khi người dùng hỏi dạng 'h làm lại được không', 'làm lại nhé', 'bắt đầu lại', 'tiếp tục':
     Hãy niềm nở, vui vẻ trả lời ngay một cách tự nhiên (ví dụ: 'Dạ hoàn toàn được ạ! Quý doanh nghiệp có thể nhấn vào nút gợi ý bên dưới hoặc gửi tiêu đề công việc để mình bắt đầu lại ngay nhé!').
""");
        if ("CANDIDATE".equalsIgnoreCase(role) && context != null && !context.isEmpty()) {
            boolean hasCv = Boolean.TRUE.equals(context.get("hasCvFile"));
            String fullName = (String) context.get("fullName");
            String desiredRole = (String) context.get("desiredRole");
            String skills = (String) context.get("skills");
            String university = (String) context.get("university");
            String major = (String) context.get("major");
            String location = (String) context.get("location");
            String bio = (String) context.get("bio");
            String extractedCv = (String) context.get("extractedCvText");

            sb.append("\n=== DỮ LIỆU HỒ SƠ & CV THỰC TẾ CỦA ỨNG VIÊN ĐANG TRÒ CHUYỆN ===\n");
            if (fullName != null && !fullName.isBlank()) sb.append("- Họ và tên: ").append(fullName).append("\n");
            if (desiredRole != null && !desiredRole.isBlank()) sb.append("- Vị trí mong muốn / Chuyên môn: ").append(desiredRole).append("\n");
            if (university != null && !university.isBlank()) sb.append("- Trường đại học: ").append(university).append("\n");
            if (major != null && !major.isBlank()) sb.append("- Chuyên ngành: ").append(major).append("\n");
            if (location != null && !location.isBlank()) sb.append("- Khu vực sinh sống: ").append(location).append("\n");
            if (skills != null && !skills.isBlank()) sb.append("- Kỹ năng đã lưu trong hồ sơ: ").append(skills).append("\n");
            if (bio != null && !bio.isBlank()) sb.append("- Giới thiệu bản thân: ").append(bio).append("\n");
            sb.append("- Trạng thái tệp CV: ").append(hasCv ? "ĐÃ CÓ TỆP CV TRÊN HỆ THỐNG" : "Chưa tải lên tệp CV").append("\n");
            if (hasCv && context.get("cvFileName") != null) {
                sb.append("- Tên tệp CV: ").append(context.get("cvFileName")).append("\n");
            }
            if (extractedCv != null && !extractedCv.isBlank()) {
                String cvPreview = extractedCv.trim();
                if (cvPreview.length() > 3000) {
                    cvPreview = cvPreview.substring(0, 3000) + "... [Đã tóm lược phần còn lại]";
                }
                sb.append("\nNỘI DUNG VĂN BẢN TRÍCH XUẤT TỪ FILE CV CỦA ỨNG VIÊN:\n\"\"\"\n")
                  .append(cvPreview)
                  .append("\n\"\"\"\n");
            }

            sb.append("\nCHỈ THỊ ĐẶC BIỆT KHI ỨNG VIÊN HỎI VỀ TÌM VIỆC, GỢI Ý VIỆC, PHÂN TÍCH/ĐÁNH GIÁ CV:\n");
            sb.append("1. Hãy đọc kỹ hồ sơ và nội dung CV thực tế của ứng viên ở trên để trả lời cụ thể, cá nhân hóa.\n");
            sb.append("2. TUYỆT ĐỐI KHÔNG hướng dẫn người dùng các bước lý thuyết sáo rỗng (như 'Bước 1: Đăng nhập tài khoản CANDIDATE, Bước 2: Hoàn thiện hồ sơ và tải lên CV...') vì ứng viên này ĐÃ đăng nhập và ĐÃ có CV đầy đủ trên hệ thống rồi!\n");
            sb.append("3. Hãy chào ứng viên bằng tên (ví dụ: 'Chào bạn ").append(fullName != null && !fullName.isBlank() ? fullName : "bạn").append("'), nhận xét trực tiếp về các kỹ năng, kinh nghiệm/đồ án có trong CV của họ, và đối chiếu với các vị trí tuyển dụng thực tế đang có trên hệ thống CareerFit (được liệt kê ở dưới) để gợi ý công việc cụ thể và mức độ phù hợp.\n");
        }

        if (activeCategories != null && !activeCategories.isEmpty()) {
            sb.append("\nDANH MỤC NGÀNH NGHỀ CNTT ĐANG HOẠT ĐỘNG TRÊN SÀN CAREERFIT:\n");
            sb.append(String.join(", ", activeCategories)).append("\n");
        }

        if (matchingJobSummaries != null && !matchingJobSummaries.isEmpty()) {
            sb.append("\nCÁC CƠ HỘI VIỆC LÀM ĐANG TUYỂN DỤNG THỰC TẾ LIÊN QUAN:\n");
            for (String js : matchingJobSummaries) {
                sb.append("- ").append(js).append("\n");
            }
            sb.append("HƯỚNG DẪN: Nếu người dùng hỏi về ngành nghề hoặc tìm kiếm vị trí việc làm, hãy giải thích rõ ngành nghề đó là gì và chủ động giới thiệu các vị trí việc làm thực tế trên sàn CareerFit ở trên.\n");
        }

        // Đưa các đoạn tài liệu có điểm phù hợp cao nhất từ Knowledge Base vào ngữ cảnh
        if (topChunks != null && !topChunks.isEmpty()) {
            sb.append("\nTÀI LIỆU VÀ QUY TRÌNH NỘI BỘ CAREERFIT PHÙ HỢP:\n");
            for (RetrievalResult rr : topChunks) {
                KnowledgeChunk ch = rr.getChunk();
                sb.append("=== [").append(ch.getTitle()).append("] (Nguồn: ").append(ch.getSource()).append(") ===\n");
                sb.append(ch.getContent()).append("\n\n");
            }
        }

        if (searchResult != null && searchResult.getSnippet() != null && !searchResult.getSnippet().isBlank()) {
            sb.append("\nKIẾN THỨC KIỂM CHỨNG BỔ SUNG (Nguồn: ").append(searchResult.getSource()).append("):\n");
            sb.append(searchResult.getSnippet()).append("\n");
        }
        return sb.toString();
    }

    private boolean isGeneralJobSearchOrCvQuery(String query) {
        if (query == null) return false;
        String n = VietnameseTextNormalizer.normalizeText(query);
        return n.contains("tim viec") || n.contains("viec phu hop") || n.contains("goi y viec")
                || n.contains("viec nao hop") || n.contains("co viec nao") || n.contains("tim viec lam")
                || n.contains("phan tich cv") || n.contains("danh gia cv") || n.contains("cv cua toi")
                || n.contains("doc cv") || n.contains("hop voi toi");
    }

    private String generateFallbackReply(String userMsg, String intent, String role, Map<String, Object> context, SearchResult searchResult) {
        if ("CV_CREATE".equals(intent)) {
            return "Chào bạn. Để tạo CV chuẩn, bạn có thể nhập thông tin học vấn, kỹ năng hoặc đính kèm tệp CV (.pdf, .docx) để hệ thống tự động phân tích và điền thông tin cho bạn.";
        }
        if ("JOB_CREATE".equals(intent)) {
            return "Chào quý doanh nghiệp. Quý vị có thể nhập yêu cầu tuyển dụng hoặc đính kèm tệp JD (.pdf, .docx) để AI tự động trích xuất và điền vào biểu mẫu đăng tin.";
        }
        if (context != null && Boolean.TRUE.equals(context.get("hasCvFile"))) {
            String name = (String) context.get("fullName");
            return "Chào " + (name != null ? name : "bạn") + ". Hệ thống đã ghi nhận hồ sơ và tệp CV của bạn trên CareerFit. Tôi có thể hỗ trợ phân tích điểm mạnh trong CV, gợi ý việc làm phù hợp với kỹ năng của bạn hoặc giải đáp các thắc mắc kỹ thuật. Bạn cần hỗ trợ gì cụ thể?";
        }
        return "Chào bạn. Tôi là Trợ lý AI CareerFit chuyên về định hướng và tuyển dụng CNTT. Tôi có thể giải đáp các kiến thức kỹ thuật IT, tư vấn xu hướng ngành nghề hoặc thông tin tuyển dụng thực tế. Bạn cần hỗ trợ gì hôm nay?";
    }

    private List<AssistantChatResponse.QuickAction> getDefaultQuickActions(String role) {
        return getQuickActionsForIntent("GENERAL", role, null);
    }

    private List<AssistantChatResponse.QuickAction> getQuickActionsForIntent(String intent, String role, Map<String, Object> context) {
        if ("EMPLOYER".equalsIgnoreCase(role)) {
            return List.of(
                    AssistantChatResponse.QuickAction.builder().label("Tạo tin tuyển dụng mới").prompt("Tôi muốn đăng tin tuyển dụng mới").navPage("create-job").build(),
                    AssistantChatResponse.QuickAction.builder().label("Đính kèm tệp JD").prompt("Tôi muốn tải lên tệp JD để AI điền vào form").build(),
                    AssistantChatResponse.QuickAction.builder().label("Quản lý tin tuyển dụng").prompt("Xem danh sách việc làm").navPage("job-management").build()
            );
        }

        boolean hasCv = context != null && Boolean.TRUE.equals(context.get("hasCvFile"));
        if (hasCv) {
            return List.of(
                    AssistantChatResponse.QuickAction.builder().label("Phân tích CV của tôi").prompt("Hãy phân tích chi tiết CV của tôi và điểm cần cải thiện").build(),
                    AssistantChatResponse.QuickAction.builder().label("Gợi ý việc làm phù hợp").prompt("Dựa vào CV của tôi, gợi ý các việc làm phù hợp nhất").navPage("job-search").build(),
                    AssistantChatResponse.QuickAction.builder().label("Xem lộ trình học tập").prompt("Lộ trình học nâng cao kỹ năng").navPage("learning-roadmap").build()
            );
        }

        return List.of(
                AssistantChatResponse.QuickAction.builder().label("Tạo CV chuẩn 7 bước").prompt("Tôi muốn tạo CV chuẩn cho sinh viên IT").build(),
                AssistantChatResponse.QuickAction.builder().label("Đính kèm tệp CV").prompt("Tôi muốn tải lên file CV để AI phân tích").build(),
                AssistantChatResponse.QuickAction.builder().label("Xem việc làm phù hợp").prompt("Tìm việc làm phù hợp").navPage("job-search").build()
        );
    }
}
