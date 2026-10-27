package com.careerfit.ai.assistant;

import com.careerfit.model.AiLearnedKnowledge;
import com.careerfit.model.Skill;
import com.careerfit.repository.AiLearnedKnowledgeRepository;
import com.careerfit.repository.SkillRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Dịch vụ Quản lý Tri thức (Knowledge Base Service) thông minh cho CareerFit AI:
 * 1. Nạp và lập chỉ mục (index) tự động toàn bộ tài nguyên nội bộ khi khởi động (Markdown, FAQ JSON, DB data.sql/Skills).
 * 2. Phân đoạn tri thức (Chunking) với metadata: nguồn, tiêu đề, chủ đề, từ khóa, thời gian cập nhật.
 * 3. Scope Guard: Kiểm soát phạm vi câu hỏi dựa trên độ tương đồng BM25 và từ điển chủ đề dự án.
 * 4. Học hỏi & Ghi nhớ bền vững (Persistent Learning Store) vào cơ sở dữ liệu với TTL và chống trùng lặp.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiAssistantKnowledgeService {

    public static final String STANDARD_OUT_OF_SCOPE_REFUSAL =
            "Xin lỗi bạn, tôi là trợ lý chuyên trách của hệ thống CareerFit (SWP3911), chỉ hỗ trợ các nội dung liên quan đến:\n" +
            "1. Hướng dẫn sử dụng nền tảng CareerFit (tạo CV chuẩn ATS, quản lý ứng tuyển Kanban, đăng tin tuyển dụng, quy trình phỏng vấn Google Meet).\n" +
            "2. Kiến thức chuyên môn Công nghệ thông tin (Thuật toán, Lập trình Java/Spring Boot, SQL, Cloud, DevOps, QA/QC).\n" +
            "3. Lộ trình phát triển sự nghiệp và kỹ năng CNTT cho sinh viên và Fresher.\n\n" +
            "Gợi ý câu hỏi mẫu bạn có thể hỏi:\n" +
            "- Làm thế nào để tạo CV chuẩn ATS 7 bước trên CareerFit?\n" +
            "- Điểm Match Score giữa CV và tin tuyển dụng được tính như thế nào?\n" +
            "- Giải thích kỹ thuật Tree Pruning trong Cấu trúc dữ liệu và Machine Learning.\n" +
            "- Lộ trình trở thành Java Backend Developer từ số 0 gồm những gì?";

    private final Bm25Retriever bm25Retriever;
    private final AiLearnedKnowledgeRepository learnedKnowledgeRepository;
    private final ResourceLoader resourceLoader;
    private final ObjectMapper objectMapper;

    @Autowired(required = false)
    private SkillRepository skillRepository;

    // Danh sách các mẫu tấn công Prompt Injection / Jailbreak cần từ chối ngay lập tức
    private static final List<String> INJECTION_PATTERNS = List.of(
            "bo qua quy dinh", "bo qua moi quy dinh", "bo qua luat", "bo qua tat ca",
            "ignore previous instructions", "ignore all instructions", "disregard instructions",
            "system prompt", "tra loi moi chu de", "khong bi gioi han", "bo qua han che",
            "bo qua cac rang buoc", "jailbreak", "dong vai khong gioi han", "bypass restrictions"
    );

    // Danh sách các chủ đề hoàn toàn ngoài phạm vi CNTT & Tuyển dụng
    private static final List<String> OBVIOUS_OUT_OF_SCOPE = List.of(
            // Ẩm thực & Nấu ăn
            "nau pho", "nau an", "cach lam banh", "mon an ngon", "cong thuc nau", "pha nuoc cham",
            "bun bo", "banh mi", "kho thit", "luoc ga", "an gi hom nay", "quan an",
            // Thời tiết & Đời sống thường nhật (Fix triệt để câu hỏi trời mưa, nắng, nhiệt độ)
            "thoi tiet", "troi mua", "troi nang", "co mua khong", "mua khong", "troi co mua khong",
            "mua to", "mua rao", "du bao thoi tiet", "nhiet do hom nay", "nang nong",
            // Giải trí, Thể thao, Showbiz, Du lịch, Mua sắm
            "bong da", "the thao", "ngoai hang anh", "xem phim", "mua sam", "quan ao", "du lich",
            "gia vang", "gia xang", "xe co", "scandal", "tin don showbiz", "dien vien", "ca si",
            // Cờ bạc, Bói toán, Mê tín
            "xo so", "lo de", "soi cau", "ca do", "doan diem", "tu vi", "chiem tinh", "cung hoang dao", "boi toan",
            // Y tế & Thuốc men
            "uong thuoc gi", "chua benh", "kham benh", "trieu chung benh", "dau dau", "dau bung",
            // Chính trị & Xã hội nhạy cảm
            "bau cu", "chinh tri gia", "chien tranh"
    );

    // Bộ từ khóa bao phủ toàn diện các lĩnh vực CNTT & Tuyển dụng của dự án
    private static final List<String> IT_DOMAIN_KEYWORDS = List.of(
            "java", "python", "javascript", "typescript", "c++", "c#", "golang", "rust", "php", "swift",
            "kotlin", "dart", "ruby", "html", "css", "sql", "oop", "huong doi tuong",
            "cau truc du lieu", "giai thuat", "thuat toan", "cay", "tree", "pruning", "tia cay", "cay avl", "avl",
            "cay do den", "red black", "binary search tree", "bst", "do thi", "graph", "ngan xep", "stack",
            "hang doi", "queue", "heap", "hash table", "bang bam", "sap xep", "quicksort", "mergesort",
            "do phuc tap", "big o", "o(n)", "quy hoach dong", "de quy",
            "ai", "tri tue nhan tao", "machine learning", "deep learning", "decision tree",
            "random forest", "overfitting", "underfitting", "neural network", "nlp", "llm",
            "cloud", "dien toan dam may", "dam may", "aws", "gcp", "azure", "docker",
            "container", "kubernetes", "k8s", "ci/cd", "devops", "linux", "bash", "socket", "websocket",
            "rest", "restful", "api", "graphql", "microservices",
            "co so du lieu", "database", "mysql", "postgresql", "mongodb", "redis", "acid", "index", "chi muc",
            "transaction", "b tree", "jwt", "oauth", "token", "xac thuc", "phan quyen", "bao mat",
            "software engineering", "design pattern", "singleton", "factory", "solid", "clean code",
            "unit test", "tester", "qa", "qc", "kiem thu", "test case", "agile", "scrum", "git", "github",
            "cv", "ho so", "tuyen dung", "viec lam", "job", "careerfit", "dang tin", "tao tin", "tao cv",
            "viet cv", "lam cv", "tim viec", "phong van", "interview", "star", "fresher", "intern",
            "thuc tap", "luong", "salary", "jd", "mo ta cong viec", "match score", "kanban", "lo trinh", "tim duong", "pathfinding", "dijkstra", "a*", "dinh tuyen", "routing", "cntt", "it", "ky nang", "skill", "thuat toan tim duong", "lap trinh", "robot", "game"
    );

    /**
     * Khởi động nạp và lập chỉ mục toàn bộ tài nguyên nội bộ
     */
    @PostConstruct
    public void initKnowledgeBase() {
        log.info("Bắt đầu nạp và xây dựng Knowledge Base nội bộ cho CareerFit AI Assistant...");
        List<KnowledgeChunk> allChunks = new ArrayList<>();

        // 1. Nạp từ các file trong classpath:knowledge/
        allChunks.addAll(loadMarkdownResource("classpath:knowledge/careerfit_system_guide.md", "CAREERFIT_SYSTEM"));
        allChunks.addAll(loadJsonFaqResource("classpath:knowledge/careerfit_faq.json"));
        allChunks.addAll(loadMarkdownResource("classpath:knowledge/it_technical_handbook.md", "IT_TECHNICAL"));

        // 2. Nạp từ cơ sở dữ liệu (Skills đang active)
        allChunks.addAll(loadDatabaseSkillChunks());

        // 3. Nạp kiến thức bền vững đã học trước đó từ DB (còn hạn)
        allChunks.addAll(loadPersistedLearnedKnowledge());

        // 4. Xây dựng chỉ mục BM25
        bm25Retriever.reindex(allChunks);
        log.info("Knowledge Base đã sẵn sàng với tổng cộng {} chunks tri thức.", allChunks.size());
    }

    /**
     * Nạp và phân đoạn (chunking) file tài liệu Markdown theo các đề mục (##)
     */
    private List<KnowledgeChunk> loadMarkdownResource(String location, String defaultTopic) {
        List<KnowledgeChunk> chunks = new ArrayList<>();
        try {
            Resource resource = resourceLoader.getResource(location);
            if (!resource.exists()) {
                log.warn("Không tìm thấy tài nguyên: {}", location);
                return chunks;
            }

            String content;
            try (InputStream is = resource.getInputStream()) {
                content = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            }

            // Tách theo tiêu đề cấp 2 (##)
            String[] sections = content.split("(?m)^##\\s+");
            String filename = resource.getFilename() != null ? resource.getFilename() : "document.md";

            int index = 0;
            for (String section : sections) {
                if (section.trim().isBlank()) continue;
                String[] lines = section.split("\n", 2);
                String title = lines[0].trim();
                String body = lines.length > 1 ? lines[1].trim() : "";

                List<String> keywords = VietnameseTextNormalizer.tokenizeAndFilterStopWords(title);

                chunks.add(KnowledgeChunk.builder()
                        .id(filename.replace(".", "_") + "_chunk_" + (++index))
                        .source("resources/knowledge/" + filename)
                        .title(title)
                        .topic(defaultTopic)
                        .content(body)
                        .keywords(keywords)
                        .confidence(1.0)
                        .learned(false)
                        .updatedAt(LocalDateTime.now())
                        .build());
            }
        } catch (Exception ex) {
            log.error("Lỗi khi đọc file tài nguyên {}: {}", location, ex.getMessage());
        }
        return chunks;
    }

    /**
     * Nạp và phân đoạn FAQ từ tệp JSON
     */
    private List<KnowledgeChunk> loadJsonFaqResource(String location) {
        List<KnowledgeChunk> chunks = new ArrayList<>();
        try {
            Resource resource = resourceLoader.getResource(location);
            if (!resource.exists()) return chunks;

            try (InputStream is = resource.getInputStream()) {
                JsonNode root = objectMapper.readTree(is);
                if (root.isArray()) {
                    for (JsonNode item : root) {
                        String id = item.path("id").asText("faq_" + UUID.randomUUID().toString().substring(0, 8));
                        String question = item.path("question").asText();
                        String answer = item.path("answer").asText();
                        String topic = item.path("topic").asText("CAREERFIT_FAQ");

                        List<String> keywords = new ArrayList<>();
                        if (item.has("keywords") && item.get("keywords").isArray()) {
                            item.get("keywords").forEach(k -> keywords.add(k.asText()));
                        }

                        chunks.add(KnowledgeChunk.builder()
                                .id(id)
                                .source("resources/knowledge/careerfit_faq.json")
                                .title(question)
                                .topic(topic)
                                .content(answer)
                                .keywords(keywords)
                                .confidence(1.0)
                                .learned(false)
                                .updatedAt(LocalDateTime.now())
                                .build());
                    }
                }
            }
        } catch (Exception ex) {
            log.error("Lỗi khi đọc file FAQ {}: {}", location, ex.getMessage());
        }
        return chunks;
    }

    /**
     * Nạp danh mục kỹ năng từ Database
     */
    private List<KnowledgeChunk> loadDatabaseSkillChunks() {
        List<KnowledgeChunk> chunks = new ArrayList<>();
        if (skillRepository == null) return chunks;

        try {
            List<Skill> skills = skillRepository.findByIsActiveTrue();
            if (skills != null && !skills.isEmpty()) {
                Map<String, List<String>> skillsByCategory = new HashMap<>();
                for (Skill s : skills) {
                    String cat = s.getCategory() != null ? s.getCategory() : "Công nghệ chung";
                    skillsByCategory.computeIfAbsent(cat, k -> new ArrayList<>()).add(s.getName());
                }

                for (Map.Entry<String, List<String>> entry : skillsByCategory.entrySet()) {
                    String cat = entry.getKey();
                    List<String> skillNames = entry.getValue();
                    String content = "Danh mục kỹ năng " + cat + " hiện có trên hệ thống CareerFit: " + String.join(", ", skillNames);

                    chunks.add(KnowledgeChunk.builder()
                            .id("db_skill_cat_" + VietnameseTextNormalizer.normalizeText(cat).replace(" ", "_"))
                            .source("database:dbo.skills")
                            .title("Danh mục kỹ năng " + cat)
                            .topic("SKILL_CATALOG")
                            .content(content)
                            .keywords(skillNames)
                            .confidence(1.0)
                            .learned(false)
                            .updatedAt(LocalDateTime.now())
                            .build());
                }
            }
        } catch (Exception ex) {
            log.debug("Không thể đọc skills từ DB khi khởi động: {}", ex.getMessage());
        }
        return chunks;
    }

    /**
     * Nạp các tri thức đã học từ bên ngoài được lưu trong bảng ai_learned_knowledge
     */
    private List<KnowledgeChunk> loadPersistedLearnedKnowledge() {
        List<KnowledgeChunk> chunks = new ArrayList<>();
        if (learnedKnowledgeRepository == null) return chunks;

        try {
            List<AiLearnedKnowledge> activeList = learnedKnowledgeRepository.findActiveKnowledge(LocalDateTime.now());
            for (AiLearnedKnowledge lk : activeList) {
                chunks.add(toKnowledgeChunk(lk));
            }
            log.info("Đã nạp {} đoạn kiến thức đã học từ cơ sở dữ liệu bền vững.", chunks.size());
        } catch (Exception ex) {
            log.debug("Không thể đọc kiến thức đã học từ DB: {}", ex.getMessage());
        }
        return chunks;
    }

    private KnowledgeChunk toKnowledgeChunk(AiLearnedKnowledge lk) {
        List<String> keywords = VietnameseTextNormalizer.tokenizeAndFilterStopWords(
                lk.getOriginalQuery() + " " + (lk.getTitle() != null ? lk.getTitle() : ""));

        return KnowledgeChunk.builder()
                .id("learned_" + lk.getId())
                .source("learned_database:" + (lk.getSourceUrl() != null ? lk.getSourceUrl() : "external_verified"))
                .title(lk.getTitle() != null ? lk.getTitle() : lk.getOriginalQuery())
                .topic(lk.getTopic() != null ? lk.getTopic() : "LEARNED_KNOWLEDGE")
                .content(lk.getSummaryContent())
                .keywords(keywords)
                .confidence(lk.getConfidenceScore() != null ? lk.getConfidenceScore() : 0.85)
                .sourceUrl(lk.getSourceUrl())
                .learned(true)
                .updatedAt(lk.getLearnedAt())
                .build();
    }

    // =========================================================================
    // SCOPE GUARD & RETRIEVAL
    // =========================================================================

    /**
     * Kiểm tra xem câu hỏi có nằm trong phạm vi hỗ trợ của hệ thống SWP3911 / CareerFit hay không.
     * Sử dụng kết hợp:
     * - Phát hiện tấn công Prompt Injection / Jailbreak
     * - Blacklist các chủ đề hoàn toàn ngoài lề (nấu ăn, xổ số, chính trị, y tế...)
     * - Độ tương đồng BM25 với Knowledge Base và bộ từ khóa chuyên môn CNTT
     */
    public boolean isPromptInjection(String message) {
        if (message == null || message.isBlank()) return false;
        String normalized = VietnameseTextNormalizer.normalizeText(message);
        for (String pattern : INJECTION_PATTERNS) {
            if (normalized.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    public boolean isWithinScope(String message) {
        if (message == null || message.isBlank()) return false;
        String normalized = VietnameseTextNormalizer.normalizeText(message);

        // 1. Kiểm tra Prompt Injection
        for (String pattern : INJECTION_PATTERNS) {
            if (normalized.contains(pattern)) {
                log.warn("[Scope Guard] Phát hiện Prompt Injection: '{}'", message);
                return false;
            }
        }

        // 2. Kiểm tra chủ đề hoàn toàn ngoài lề
        for (String out : OBVIOUS_OUT_OF_SCOPE) {
            if (normalized.contains(out)) {
                log.info("[Scope Guard] Câu hỏi ngoài phạm vi rõ ràng: '{}'", message);
                return false;
            }
        }

        // 3. Câu chào hỏi thông thường / cảm ơn
        if (isGreetingOrPolite(normalized)) {
            return true;
        }

        // 4. Kiểm tra từ khóa kỹ thuật CNTT, lập trình, thuật toán & CareerFit
        if (normalized.contains("cntt") || normalized.contains("cong nghe thong tin") || normalized.contains("lap trinh")
                || normalized.contains("thuat toan") || normalized.contains("giai thuat") || normalized.contains("ky nang")
                || normalized.contains("tim duong") || normalized.contains("pathfinding") || normalized.contains("dijkstra")
                || normalized.contains("a*") || normalized.contains("routing") || normalized.contains("dinh tuyen")
                || normalized.contains("phan mem") || normalized.contains("software") || normalized.contains("developer")) {
            return true;
        }

        for (String kw : IT_DOMAIN_KEYWORDS) {
            String normKw = VietnameseTextNormalizer.normalizeText(kw);
            if (normalized.contains(normKw)) {
                return true;
            }
        }

        // 5. Kiểm tra điểm truy xuất BM25 với Knowledge Base
        List<RetrievalResult> topChunks = bm25Retriever.search(message, 1);
        if (!topChunks.isEmpty() && topChunks.get(0).getScore() >= 1.0) {
            return true;
        }

        // Tuyệt đối không fallback theo độ dài chuỗi (tránh lọt câu hỏi đời sống ngắn như "Trời có mưa không")
        log.info("[Scope Guard] Từ chối câu hỏi do không liên quan đến hệ thống CareerFit hoặc CNTT: '{}'", message);
        return false;
    }

    public boolean isGreetingOrPolite(String text) {
        if (text == null || text.isBlank()) return false;
        String raw = text.trim().toLowerCase();
        String t = VietnameseTextNormalizer.normalizeText(text).toLowerCase().trim();

        // 1. Kiểm tra regex nhận diện chào hỏi (kể cả typo, gõ kéo dài như helo, hello, hii, heyy, alo...)
        if (t.matches("^(h+i+|h+e+l+o+|h+a+l+o+|h+e+y+|yo+|a+l+o+|c+h+a+o+|x+i+n+\\s+c+h+a+o+|h+e+\\s*l+o+|g+o+o+d+\\s*(morning|afternoon|evening)|bonjour)(\\s+.*)?$")
                || raw.matches("^(h+i+|h+e+l+o+|h+a+l+o+|h+e+y+|yo+|a+l+o+|c+h+a+o+|x+i+n+\\s+c+h+a+o+|h+e+\\s*l+o+|g+o+o+d+\\s*(morning|afternoon|evening)|bonjour)(\\s+.*)?$")) {
            return true;
        }

        // 2. Chào hỏi xã giao thông dụng bằng tiếng Việt / tiếng Anh
        if (t.equals("hi") || t.startsWith("hi ") || t.equals("hello") || t.startsWith("hello ")
                || t.equals("helo") || t.startsWith("helo ") || t.equals("halo") || t.startsWith("halo ")
                || t.equals("hey") || t.startsWith("hey ") || t.equals("alo") || t.startsWith("alo ")
                || t.equals("chao") || t.startsWith("chao ") || t.startsWith("xin chao")
                || t.equals("he lo") || t.startsWith("he lo ")
                || t.equals("hoi") || t.startsWith("cho hoi") || t.startsWith("cho minh hoi") 
                || t.startsWith("cho em hoi") || t.startsWith("cho toi hoi")) {
            return true;
        }

        // 3. Cảm ơn, tạm biệt, phản hồi ngắn lịch sự
        if (t.contains("cam on") || t.contains("tks") || t.contains("thank") || t.contains("thx")
                || t.equals("tam biet") || t.startsWith("tam biet") || t.equals("bye") || t.startsWith("bye ")
                || t.equals("goodbye") || t.startsWith("goodbye ")
                || t.equals("ok") || t.equals("oke") || t.equals("okay") || t.equals("da") || t.equals("vang")) {
            return true;
        }

        // 4. Hỏi bot là ai, giới thiệu khả năng
        if (t.contains("ban la ai") || t.contains("may la ai") || t.contains("em la ai") 
                || t.contains("bot la ai") || t.contains("ai day") || t.contains("who are you")
                || t.contains("gioi thieu") || t.contains("lam duoc gi") || t.contains("giup duoc gi")
                || t.contains("ho tro gi") || t.contains("chuc nang gi")) {
            return true;
        }

        return false;
    }

    /**
     * Truy xuất Top-K đoạn tri thức liên quan nhất từ BM25 Index
     */
    public List<RetrievalResult> retrieveTopChunks(String query, int topK) {
        return bm25Retriever.search(query, topK);
    }

    /**
     * Tra cứu kiến thức đã học từ cơ sở dữ liệu dựa trên mã hash câu hỏi
     */
    @Transactional
    public Optional<AiLearnedKnowledge> findLearnedKnowledge(String query) {
        if (query == null || query.isBlank() || learnedKnowledgeRepository == null) {
            return Optional.empty();
        }
        String normalized = VietnameseTextNormalizer.normalizeText(query);
        String hash = VietnameseTextNormalizer.sha256Hex(normalized);

        Optional<AiLearnedKnowledge> opt = learnedKnowledgeRepository.findByQueryHash(hash);
        if (opt.isPresent()) {
            AiLearnedKnowledge lk = opt.get();
            if (lk.getExpiresAt() != null && lk.getExpiresAt().isBefore(LocalDateTime.now())) {
                log.debug("Kiến thức đã học mã [{}] đã hết hạn TTL.", lk.getId());
                return Optional.empty();
            }
            // Cập nhật số lần truy xuất và thời điểm dùng gần nhất
            lk.setAccessCount(lk.getAccessCount() + 1);
            lk.setLastAccessedAt(LocalDateTime.now());
            learnedKnowledgeRepository.save(lk);
            return Optional.of(lk);
        }
        return Optional.empty();
    }

    /**
     * Lưu kiến thức mới học được vào kho lưu trữ bền vững (Cơ sở dữ liệu) và nạp tức thì vào BM25 Index.
     * Cơ chế:
     * - Lọc sạch PII (email, phone, password, token).
     * - Chống trùng lặp qua SHA-256 hash của query chuẩn hóa.
     * - Thiết lập TTL (mặc định 30 ngày) để định kỳ làm mới.
     */
    @Transactional
    public AiLearnedKnowledge learnAndPersist(String query, String summary, String sourceUrl, double confidence) {
        if (query == null || query.isBlank() || summary == null || summary.isBlank()) {
            return null;
        }

        String normalizedQuery = VietnameseTextNormalizer.normalizeText(query);
        String queryHash = VietnameseTextNormalizer.sha256Hex(normalizedQuery);
        String cleanSummary = VietnameseTextNormalizer.sanitizePiiAndSecrets(summary.trim());

        Optional<AiLearnedKnowledge> existingOpt = learnedKnowledgeRepository.findByQueryHash(queryHash);
        AiLearnedKnowledge knowledge;

        if (existingOpt.isPresent()) {
            knowledge = existingOpt.get();
            log.info("Cập nhật lại kiến thức đã học cho queryHash: {}", queryHash);
            knowledge.setSummaryContent(cleanSummary);
            knowledge.setSourceUrl(sourceUrl);
            knowledge.setConfidenceScore(confidence);
            knowledge.setLastAccessedAt(LocalDateTime.now());
            knowledge.setExpiresAt(LocalDateTime.now().plusDays(30));
            knowledge.setAccessCount(knowledge.getAccessCount() + 1);
        } else {
            knowledge = AiLearnedKnowledge.builder()
                    .id("lk_" + UUID.randomUUID().toString().replace("-", "").substring(0, 16))
                    .queryHash(queryHash)
                    .originalQuery(query.trim())
                    .normalizedQuery(normalizedQuery)
                    .topic(detectTopic(normalizedQuery))
                    .title("Kiến thức: " + (query.length() > 60 ? query.substring(0, 60) + "..." : query))
                    .summaryContent(cleanSummary)
                    .sourceUrl(sourceUrl)
                    .confidenceScore(confidence)
                    .learnedAt(LocalDateTime.now())
                    .expiresAt(LocalDateTime.now().plusDays(30))
                    .lastAccessedAt(LocalDateTime.now())
                    .accessCount(1)
                    .build();
        }

        AiLearnedKnowledge saved = learnedKnowledgeRepository.save(knowledge);

        // Nạp ngay vào BM25 Index để dùng cho các câu hỏi kế tiếp
        bm25Retriever.addChunk(toKnowledgeChunk(saved));
        log.info("Lưu thành công kiến thức mới học được vào DB (id: {}, hash: {})", saved.getId(), queryHash);
        return saved;
    }

    private String detectTopic(String normalizedText) {
        if (normalizedText.contains("java") || normalizedText.contains("spring")) return "JAVA_BACKEND";
        if (normalizedText.contains("sql") || normalizedText.contains("database") || normalizedText.contains("csdl")) return "DATABASE";
        if (normalizedText.contains("tree") || normalizedText.contains("cay") || normalizedText.contains("thuat toan")) return "ALGORITHMS";
        if (normalizedText.contains("cloud") || normalizedText.contains("dam may") || normalizedText.contains("docker")) return "CLOUD_DEVOPS";
        if (normalizedText.contains("cv") || normalizedText.contains("tuyen dung") || normalizedText.contains("job")) return "CAREERFIT_GUIDE";
        return "IT_GENERAL";
    }

    /**
     * Dọn dẹp các tri thức đã hết hạn (TTL) định kỳ hàng ngày lúc 3:00 sáng
     */
    @Scheduled(cron = "0 0 3 * * ?")
    @Transactional
    public void cleanupExpiredKnowledge() {
        if (learnedKnowledgeRepository != null) {
            int deleted = learnedKnowledgeRepository.deleteExpiredKnowledge(LocalDateTime.now());
            if (deleted > 0) {
                log.info("Đã dọn dẹp {} bản ghi kiến thức quá hạn TTL trong cơ sở dữ liệu.", deleted);
                initKnowledgeBase(); // Tái lập chỉ mục sau khi dọn dẹp
            }
        }
    }

    // =========================================================================
    // INTENT CLASSIFICATION (BACKWARD COMPATIBLE)
    // =========================================================================

    public String classifySemanticIntent(String message, String role) {
        if (message == null || message.isBlank()) return "GENERAL_CHAT";
        String lower = VietnameseTextNormalizer.normalizeText(message);

        // 1. Kiểm tra ngoài phạm vi hoặc Prompt Injection
        for (String pattern : INJECTION_PATTERNS) {
            if (lower.contains(pattern)) return "OUT_OF_SCOPE";
        }
        for (String out : OBVIOUS_OUT_OF_SCOPE) {
            if (lower.contains(out)) return "OUT_OF_SCOPE";
        }

        // 2. Nhóm CAREERFIT_TASK
        boolean isEmployer = "EMPLOYER".equalsIgnoreCase(role);
        if (isEmployer) {
            if (lower.contains("dang tin") || lower.contains("tao tin") || lower.contains("tuyen dung moi")
                    || lower.contains("tuyen thuc tap") || lower.contains("can tuyen") || lower.contains("muon tuyen")
                    || lower.contains("viet jd") || lower.contains("mo ta cong viec")) {
                return "JOB_CREATE";
            }
            if (lower.contains("sua tin") || lower.contains("chinh sua tin") || lower.contains("cai thien tin")) {
                return "JOB_IMPROVE";
            }
        } else {
            if (lower.contains("tao cv") || lower.contains("lam cv") || lower.contains("viet cv")
                    || lower.contains("chua co ho so") || lower.contains("chua biet viet cv")
                    || lower.contains("lam ho so") || lower.contains("huong dan cv")) {
                return "CV_CREATE";
            }
            if (lower.contains("cai thien cv") || lower.contains("sua cv") || lower.contains("chuan hoa cv")
                    || lower.contains("toi uu cv") || lower.contains("chinh cv")) {
                return "CV_IMPROVE";
            }
        }

        // 3. Nhóm IT_CAREER
        if (lower.contains("lo trinh") || lower.contains("roadmap") || lower.contains("hoc gi")
                || lower.contains("muon hoc") || lower.contains("hoc java") || lower.contains("hoc backend")
                || lower.contains("hoc frontend") || lower.contains("phong van") || lower.contains("interview")
                || lower.contains("chua co kinh nghiem") || lower.contains("tim viec phu hop") || lower.contains("meo phong van")) {
            return "IT_CAREER";
        }

        // 4. Nhóm IT_KNOWLEDGE
        for (String kw : IT_DOMAIN_KEYWORDS) {
            if (lower.contains(VietnameseTextNormalizer.normalizeText(kw))) {
                return "IT_KNOWLEDGE";
            }
        }

        // 5. Chào hỏi xã giao hợp lệ
        if (isGreetingOrPolite(lower)) {
            return "GENERAL_CHAT";
        }

        // 6. Nếu không nằm trong phạm vi dự án hoặc không có từ khóa CNTT -> OUT_OF_SCOPE
        if (!isWithinScope(message)) {
            return "OUT_OF_SCOPE";
        }

        return "IT_KNOWLEDGE";
    }

    public String classifyIntent(String message, String role) {
        return classifySemanticIntent(message, role);
    }

    public String getCareerFitKnowledge() {
        return """
            === KIẾN THỨC NỀN TẢNG CAREERFIT (SWP3911) ===
            1. GIỚI THIỆU: CareerFit là nền tảng kết nối sinh viên IT, Fresher và Nhà tuyển dụng công nghệ.
            2. VAI TRÒ ỨNG VIÊN: Quản lý hồ sơ, Match Score, AI Polish CV chuẩn ATS, quản lý đơn qua Kanban, phỏng vấn Google Meet.
            3. VAI TRÒ DOANH NGHIỆP: Đăng tin tuyển dụng (Required & Preferred skills), AI Polish JD, Pipeline ứng viên, xếp lịch phỏng vấn Google Meet.
            4. QUY TRÌNH CV 7 BƯỚC: Target Role -> Liên hệ -> Học vấn & GPA -> Kỹ năng kỹ thuật -> Đồ án môn học -> Kỹ năng mềm -> Chứng chỉ.
            """;
    }
}
