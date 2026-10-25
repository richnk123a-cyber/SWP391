package com.careerfit.ai.assistant;

import org.springframework.stereotype.Service;

import java.util.*;
import java.util.regex.Pattern;

@Service
public class AiAssistantKnowledgeService {

    public static final String STANDARD_OUT_OF_SCOPE_REFUSAL =
            "Xin lỗi bạn, mình là trợ lý chuyên môn của CareerFit, chỉ hỗ trợ các câu hỏi liên quan đến việc làm IT, kiến thức và kỹ năng Công nghệ thông tin, tạo và chỉnh sửa CV, đăng tin tuyển dụng, quy trình phỏng vấn và sử dụng nền tảng CareerFit. Bạn vui lòng đặt câu hỏi liên quan đến các chủ đề này nhé!";

    // Danh sách các mẫu tấn công Prompt Injection / Jailbreak cần từ chối ngay lập tức
    private static final List<String> INJECTION_PATTERNS = List.of(
            "bỏ qua quy định", "bỏ qua mọi quy định", "bỏ qua luật", "bỏ qua tất cả",
            "ignore previous instructions", "ignore all instructions", "disregard instructions",
            "system prompt", "trả lời mọi chủ đề", "không bị giới hạn", "bỏ qua hạn chế",
            "bỏ qua các ràng buộc", "jailbreak", "đóng vai không giới hạn"
    );

    // Danh sách các chủ đề hoàn toàn ngoài phạm vi CNTT & Tuyển dụng (Nấu ăn, cá cược, y tế, chính trị, giải trí thuần túy...)
    private static final List<String> OBVIOUS_OUT_OF_SCOPE = List.of(
            "nấu phở", "nấu ăn", "cách làm bánh", "món ăn ngon", "công thức nấu", "pha nước chấm",
            "bún bò", "bánh mì", "kho thịt", "luộc gà", "xổ số", "lô đề", "soi cầu", "cá độ",
            "đoán điềm", "tử vi", "chiêm tinh", "cung hoàng đạo", "bói toán",
            "uống thuốc gì", "chữa bệnh", "khám bệnh", "triệu chứng bệnh",
            "bầu cử", "chính trị gia", "chiến tranh", "scandal giới trẻ", "tin đồn showbiz"
    );

    // Danh sách các thuật ngữ đa nghĩa (Polysemous terms) giữa đời sống thông thường và chuyên ngành CNTT
    private static final Map<String, String> POLYSEMOUS_TERMS = Map.of(
            "đám mây", "Cloud Computing (Điện toán đám mây)",
            "tỉa cây", "Tree Pruning (Cắt tỉa cây quyết định / Tối ưu thuật toán trong ML & DSA)",
            "cây đỏ đen", "Red-Black Tree (Cấu trúc dữ liệu cây tự cân bằng)",
            "luồng", "Thread (Đơn vị thực thi độc lập trong lập trình đa luồng)",
            "con trỏ", "Pointer (Biến lưu địa chỉ ô nhớ trong C/C++)",
            "socket", "Network Socket (Điểm cuối truyền thông mạng TCP/UDP)",
            "đóng băng", "UI/Process Freeze (Treo giao diện / Tiến trình bị chặn)",
            "rò rỉ", "Memory Leak (Rò rỉ bộ nhớ trong phát triển phần mềm)",
            "sâu", "Software Bug / Web Crawler",
            "chuột rút", "Deadlock / Thread Starvation"
    );

    // Bộ nhận diện ngữ cảnh kỹ thuật / CNTT rõ ràng
    private static final List<String> IT_CONTEXT_MARKERS = List.of(
            "it", "cntt", "lập trình", "phần mềm", "thuật toán", "công nghệ", "máy tính",
            "decision tree", "cây quyết định", "ml", "ai", "machine learning", "code",
            "developer", "kỹ thuật", "cấu trúc dữ liệu", "mạng", "database", "backend", "frontend"
    );

    // Bộ từ khóa bao phủ toàn diện các lĩnh vực CNTT (DSA, Web, DB, Cloud, DevOps, QA, Security, AI...)
    private static final List<String> IT_DOMAIN_KEYWORDS = List.of(
            // Lập trình & Ngôn ngữ
            "java", "python", "javascript", "typescript", "c++", "c#", "golang", "rust", "php", "swift",
            "kotlin", "dart", "ruby", "html", "css", "sql", "oop", "hướng đối tượng",
            // DSA & Giải thuật
            "cấu trúc dữ liệu", "giải thuật", "thuật toán", "cây", "tree", "pruning", "tỉa cây", "cây avl", "avl",
            "cây đỏ đen", "red-black", "binary search tree", "bst", "đồ thị", "graph", "ngăn xếp", "stack",
            "hàng đợi", "queue", "heap", "hash table", "bảng băm", "sắp xếp", "quicksort", "mergesort",
            "độ phức tạp", "big-o", "o(n)", "o(log n)", "quy hoạch động", "dynamic programming", "đệ quy",
            // AI, Machine Learning & Data
            "ai", "trí tuệ nhân tạo", "machine learning", "deep learning", "decision tree", "cây quyết định",
            "random forest", "overfitting", "underfitting", "neural network", "mạng nơ-ron", "nlp", "llm",
            "data science", "khoa học dữ liệu", "scikit-learn", "tensorflow", "pytorch",
            // Cloud, DevOps & Mạng
            "cloud", "cloud computing", "điện toán đám mây", "đám mây", "aws", "gcp", "azure", "docker",
            "container", "kubernetes", "k8s", "ci/cd", "devops", "linux", "bash", "tcp/ip", "tcp", "udp",
            "dns", "http", "https", "socket", "websocket", "rest", "restful", "api", "graphql", "microservices",
            // Cơ sở dữ liệu & Security
            "cơ sở dữ liệu", "database", "mysql", "postgresql", "mongodb", "redis", "acid", "index", "chỉ mục",
            "transaction", "b-tree", "jwt", "oauth", "oauth2", "token", "xác thực", "phân quyền", "bảo mật",
            "an toàn thông tin", "sql injection", "xss", "csrf", "mã hóa",
            // Software Engineering & Testing QA
            "software engineering", "kỹ thuật phần mềm", "design pattern", "singleton", "factory", "solid",
            "clean code", "unit test", "integration test", "tester", "qa", "qc", "kiểm thử", "test case",
            "automation test", "agile", "scrum", "sprint", "git", "github", "gitlab",
            // CareerFit Platform & Nghề nghiệp
            "cv", "hồ sơ", "tuyển dụng", "việc làm", "job", "careerfit", "đăng tin", "tạo tin", "tạo cv",
            "viết cv", "làm cv", "tìm việc", "phỏng vấn", "interview", "star", "fresher", "intern",
            "thực tập", "lương", "salary", "jd", "mô tả công việc", "match score", "kanban", "lộ trình"
    );

    /**
     * Kiểm tra xem câu hỏi có nằm trong phạm vi hỗ trợ (hoặc cần làm rõ) hay không.
     * Trả về false CHỈ KHI câu hỏi rõ ràng là OUT_OF_SCOPE hoặc vi phạm Prompt Injection.
     */
    public boolean isWithinScope(String message) {
        if (message == null || message.isBlank()) return false;
        String lower = message.toLowerCase(Locale.ROOT).trim();

        // 1. Kiểm tra Prompt Injection / Phá vỡ quy tắc
        for (String pattern : INJECTION_PATTERNS) {
            if (lower.contains(pattern)) {
                return false;
            }
        }

        // 2. Kiểm tra chủ đề hoàn toàn ngoài phạm vi (ẩm thực, giải trí, bói toán...)
        for (String out : OBVIOUS_OUT_OF_SCOPE) {
            if (lower.contains(out)) {
                return false;
            }
        }

        // 3. Câu chào hỏi thông thường
        if (lower.startsWith("chào") || lower.startsWith("hi") || lower.startsWith("hello")
                || lower.startsWith("ơi") || lower.contains("cảm ơn") || lower.contains("tks")
                || lower.contains("thank") || lower.contains("tạm biệt") || lower.contains("bạn là ai")) {
            return true;
        }

        // 4. Kiểm tra thuật ngữ đa nghĩa (Ví dụ: "đám mây", "tỉa cây", "luồng", "con trỏ", "socket")
        for (String polyKey : POLYSEMOUS_TERMS.keySet()) {
            if (lower.contains(polyKey)) {
                return true;
            }
        }

        // 5. Kiểm tra từ khóa kỹ thuật CNTT & CareerFit
        for (String kw : IT_DOMAIN_KEYWORDS) {
            if (lower.contains(kw)) {
                return true;
            }
        }

        // 6. Câu hỏi ngắn hoặc có dấu hiệu học tập/nghề nghiệp
        if (lower.length() < 25 && !containsObviousNonItWord(lower)) {
            return true;
        }

        // Mặc định: nếu không rơi vào các chủ đề bị cấm rõ ràng thì vẫn cho phép xử lý ngữ nghĩa
        return true;
    }

    /**
     * Phân loại ý định ngữ nghĩa theo 5 nhóm chuẩn:
     * - CAREERFIT_TASK
     * - IT_KNOWLEDGE
     * - IT_CAREER
     * - AMBIGUOUS
     * - OUT_OF_SCOPE
     */
    public String classifySemanticIntent(String message, String role) {
        if (message == null || message.isBlank()) return "GENERAL_CHAT";
        String lower = message.toLowerCase(Locale.ROOT).trim();

        // 1. Kiểm tra ngoài phạm vi hoặc Prompt Injection
        for (String pattern : INJECTION_PATTERNS) {
            if (lower.contains(pattern)) return "OUT_OF_SCOPE";
        }
        for (String out : OBVIOUS_OUT_OF_SCOPE) {
            if (lower.contains(out)) return "OUT_OF_SCOPE";
        }

        // 2. Nhóm CAREERFIT_TASK (Tác vụ trên nền tảng)
        boolean isEmployer = "EMPLOYER".equalsIgnoreCase(role);
        if (isEmployer) {
            if (lower.contains("đăng tin") || lower.contains("tạo tin") || lower.contains("tuyển dụng mới")
                    || lower.contains("tuyển thực tập sinh") || lower.contains("cần tuyển") || lower.contains("muốn tuyển")
                    || lower.contains("viết jd") || lower.contains("mô tả công việc")) {
                return "JOB_CREATE";
            }
            if (lower.contains("sửa tin") || lower.contains("chỉnh sửa tin") || lower.contains("cải thiện tin")) {
                return "JOB_IMPROVE";
            }
        } else {
            if (lower.contains("tạo cv") || lower.contains("làm cv") || lower.contains("viết cv")
                    || lower.contains("chưa có hồ sơ") || lower.contains("chưa biết viết cv")
                    || lower.contains("làm hồ sơ") || lower.contains("hướng dẫn cv")) {
                return "CV_CREATE";
            }
            if (lower.contains("cải thiện cv") || lower.contains("sửa cv") || lower.contains("chuẩn hóa cv")
                    || lower.contains("tối ưu cv") || lower.contains("chỉnh cv")) {
                return "CV_IMPROVE";
            }
        }

        // 3. Nhóm AMBIGUOUS (Thuật ngữ nhiều nghĩa hoặc chưa đủ ngữ cảnh)
        for (String polyKey : POLYSEMOUS_TERMS.keySet()) {
            if (lower.contains(polyKey)) {
                // Kiểm tra xem người dùng có cung cấp ngữ cảnh IT hay không
                boolean hasItContext = false;
                for (String marker : IT_CONTEXT_MARKERS) {
                    if (lower.contains(marker)) {
                        hasItContext = true;
                        break;
                    }
                }
                if (!hasItContext && isIsolatedTermQuery(lower, polyKey)) {
                    return "AMBIGUOUS";
                }
                // Nếu đã có ngữ cảnh IT rõ ràng (như "Tỉa cây trong IT là gì?", "Pruning trong Decision Tree là gì?")
                return "IT_KNOWLEDGE";
            }
        }

        // 4. Nhóm IT_CAREER (Lộ trình học, nghề nghiệp, phỏng vấn, fresher)
        if (lower.contains("lộ trình") || lower.contains("roadmap") || lower.contains("học gì")
                || lower.contains("muốn học") || lower.contains("học java") || lower.contains("học backend")
                || lower.contains("học frontend") || lower.contains("phỏng vấn") || lower.contains("interview")
                || lower.contains("chưa có kinh nghiệm") || lower.contains("tìm việc phù hợp") || lower.contains("mẹo phỏng vấn")) {
            return "IT_CAREER";
        }

        // 5. Nhóm IT_KNOWLEDGE (Kiến thức công nghệ, thuật toán, cấu trúc dữ liệu, cloud, v.v.)
        for (String kw : IT_DOMAIN_KEYWORDS) {
            if (lower.contains(kw)) {
                return "IT_KNOWLEDGE";
            }
        }

        // 6. Chào hỏi hoặc giao tiếp thông thường
        if (lower.startsWith("chào") || lower.startsWith("hi") || lower.startsWith("hello") || lower.length() < 15) {
            return "GENERAL_CHAT";
        }

        return "IT_KNOWLEDGE";
    }

    /**
     * Backward-compatible alias cho classifyIntent
     */
    public String classifyIntent(String message, String role) {
        return classifySemanticIntent(message, role);
    }

    /**
     * Kiểm tra xem câu hỏi có phải dạng hỏi từ khóa cô lập không (VD: "Đám mây là gì?", "Tỉa cây là gì?")
     */
    private boolean isIsolatedTermQuery(String text, String term) {
        String cleaned = text.replaceAll("[?.,!]", "").trim();
        return cleaned.equals(term)
                || cleaned.equals(term + " là gì")
                || cleaned.equals("khái niệm " + term)
                || cleaned.equals(term + " nghĩa là gì")
                || cleaned.equals("thế nào là " + term)
                || cleaned.length() <= term.length() + 10;
    }

    private boolean containsObviousNonItWord(String text) {
        for (String out : OBVIOUS_OUT_OF_SCOPE) {
            if (text.contains(out)) return true;
        }
        return false;
    }

    public String getCareerFitKnowledge() {
        return """
            === KIẾN THỨC NỀN TẢNG CAREERFIT ===
            1. GIỚI THIỆU:
               CareerFit là nền tảng kết nối sinh viên IT, Fresher và Nhà tuyển dụng.
            2. VAI TRÒ ỨNG VIÊN (CANDIDATE):
               - Quản lý hồ sơ: Thông tin cá nhân, vị trí mục tiêu, học vấn, kỹ năng, đồ án, tải file CV (PDF/DOCX).
               - Match Score: Hệ thống tự động tính điểm phù hợp giữa kỹ năng ứng viên và yêu cầu tin tuyển dụng.
               - Phân tích CV chuyên sâu: AI so sánh CV với JD, chỉ ra kỹ năng thiếu và thiết kế lộ trình học tập.
               - Quản lý đơn ứng tuyển: Theo dõi trạng thái đơn nộp qua Kanban (Đã nộp, Đang duyệt, Phỏng vấn, Trúng tuyển, Từ chối).
               - Phỏng vấn: Nhận lịch hẹn và link Google Meet trực tiếp từ nhà tuyển dụng.
            3. VAI TRÒ DOANH NGHIỆP (EMPLOYER):
               - Đăng tin tuyển dụng: Cung cấp đầy đủ Chức danh, Danh mục, Cấp bậc, Địa điểm, Lương, Kỹ năng (Required & Preferred), Mô tả và Quyền lợi.
               - Kiểm duyệt: Mọi tin đăng mới phải được Admin phê duyệt trước khi công khai.
               - Quản lý ứng viên: Xem danh sách ứng viên, điểm Match Score, tải CV gốc PDF/DOCX.
               - Pipeline tuyển dụng: Kéo thả ứng viên qua các cột trạng thái. Khi chuyển sang Phỏng vấn, hệ thống yêu cầu nhập thời gian và link Google Meet để gửi thông báo cho ứng viên.
            4. NGUYÊN TẮC HƯỚNG DẪN CV SINH VIÊN:
               - Không đòi hỏi kinh nghiệm làm việc thực tế cho vị trí Intern/Fresher.
               - Đồ án môn học, dự án cá nhân (kèm GitHub) và kiến thức nền tảng (OOP, SQL, Git) là bằng chứng quan trọng nhất.
               - Không tự bịa chứng chỉ, kỹ năng hoặc số năm kinh nghiệm.
            """;
    }
}
