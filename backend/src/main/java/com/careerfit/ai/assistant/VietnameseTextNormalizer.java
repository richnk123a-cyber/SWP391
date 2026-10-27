package com.careerfit.ai.assistant;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.text.Normalizer;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Tiện ích chuẩn hóa tiếng Việt, xử lý từ đồng nghĩa, từ viết tắt CNTT,
 * lọc stop words và làm sạch dữ liệu nhạy cảm (PII).
 */
public final class VietnameseTextNormalizer {

    private VietnameseTextNormalizer() {}

    private static final Pattern DIACRITICS_PATTERN = Pattern.compile("\\p{InCombiningDiacriticalMarks}+");
    private static final Pattern PUNCTUATION_PATTERN = Pattern.compile("[^a-zA-Z0-9\\s]");
    private static final Pattern MULTI_SPACE_PATTERN = Pattern.compile("\\s+");

    // Biểu thức chính quy loại bỏ toàn bộ Emoji, Icon, Pictograph Unicode
    private static final Pattern EMOJI_PATTERN = Pattern.compile(
            "[\uD83C-\uDBFF\uDC00-\uDFFF]" + // Surrogate pairs (Emoji Unicode U+10000 - U+10FFFF)
            "|[\u2600-\u27BF]" +             // Miscellaneous Symbols & Dingbats
            "|[\uFE00-\uFE0F]" +             // Variation Selectors
            "|[\u200D]" +                    // Zero-width joiner
            "|[\u2B50\u2B55\u231A\u231B\u23E9-\u23EC\u23F0\u23F3]"
    );

    /**
     * Loại bỏ sạch sẽ mọi icon, emoji, biểu tượng cảm xúc khỏi văn bản phản hồi
     */
    public static String stripEmojis(String text) {
        if (text == null || text.isBlank()) return "";
        String cleaned = EMOJI_PATTERN.matcher(text).replaceAll("");
        // Xóa khoảng trắng thừa trước các dấu câu do emoji bị loại bỏ ở sát dấu câu
        cleaned = cleaned.replaceAll("\\s+([,.;!?])", "$1");
        return cleaned.replaceAll(" {2,}", " ").trim();
    }

    // Danh sách Stop Words tiếng Việt thông dụng (đã loại bỏ 'it' vì 'it' là Information Technology)
    private static final Set<String> VIETNAMESE_STOP_WORDS = Set.of(
            "la", "cua", "cac", "nhung", "va", "o", "trong", "cho", "voi", "thi", "ma",
            "bi", "duoc", "rang", "de", "nhu", "vao", "ve", "den", "khi", "luc", "do",
            "nay", "kia", "tai", "ra", "len", "xuong", "theo", "boi", "vi", "neu", "mot",
            "nhieu", "hay", "hoac", "co", "khong", "chua", "roi", "rat", "qua", "lam"
    );

    // Bảng tra từ viết tắt và từ đồng nghĩa kỹ thuật CNTT (đã chuẩn hóa không dấu)
    private static final Map<String, List<String>> TECHNICAL_SYNONYMS = new HashMap<>();

    static {
        TECHNICAL_SYNONYMS.put("cntt", List.of("it", "cong nghe thong tin", "technology"));
        TECHNICAL_SYNONYMS.put("it", List.of("cntt", "cong nghe thong tin"));
        TECHNICAL_SYNONYMS.put("csdl", List.of("database", "co so du lieu", "sql"));
        TECHNICAL_SYNONYMS.put("database", List.of("csdl", "co so du lieu", "sql"));
        TECHNICAL_SYNONYMS.put("dsa", List.of("cau truc du lieu giai thuat", "thuat toan", "data structures"));
        TECHNICAL_SYNONYMS.put("thuat toan", List.of("dsa", "giai thuat", "algorithm"));
        TECHNICAL_SYNONYMS.put("cv", List.of("ho so", "curriculum vitae", "resume"));
        TECHNICAL_SYNONYMS.put("jd", List.of("mo ta cong viec", "job description", "tuyen dung"));
        TECHNICAL_SYNONYMS.put("ml", List.of("machine learning", "hoc may", "ai"));
        TECHNICAL_SYNONYMS.put("ai", List.of("tri tue nhan tao", "artificial intelligence", "ml"));
        TECHNICAL_SYNONYMS.put("qa", List.of("tester", "kiem thu", "chat luong phan mem"));
        TECHNICAL_SYNONYMS.put("tester", List.of("qa", "qc", "kiem thu"));
        TECHNICAL_SYNONYMS.put("backend", List.of("may chu", "server side", "api"));
        TECHNICAL_SYNONYMS.put("frontend", List.of("giao dien", "client side", "ui"));
        TECHNICAL_SYNONYMS.put("cloud", List.of("dien toan dam may", "dam may", "aws", "gcp", "azure"));
        TECHNICAL_SYNONYMS.put("dam may", List.of("cloud", "dien toan dam may"));
        TECHNICAL_SYNONYMS.put("tia cay", List.of("tree pruning", "pruning", "cat tia cay"));
        TECHNICAL_SYNONYMS.put("cay do den", List.of("red black tree", "rbtree"));
        TECHNICAL_SYNONYMS.put("cay avl", List.of("avl tree", "cay can bang"));
        TECHNICAL_SYNONYMS.put("luong", List.of("thread", "da luong", "multithreading", "concurrency"));
        TECHNICAL_SYNONYMS.put("con tro", List.of("pointer", "dia chi o nho"));
    }

    /**
     * Chuyển chuỗi tiếng Việt có dấu thành không dấu (chuẩn Unicode NFD, xử lý đ/Đ)
     */
    public static String removeAccents(String input) {
        if (input == null) return "";
        String normalized = Normalizer.normalize(input, Normalizer.Form.NFD);
        String withoutDiacritics = DIACRITICS_PATTERN.matcher(normalized).replaceAll("");
        return withoutDiacritics.replace('đ', 'd').replace('Đ', 'D');
    }

    /**
     * Chuẩn hóa văn bản: Chuyển chữ thường, bỏ dấu, loại ký tự đặc biệt, thu gọn khoảng trắng
     */
    public static String normalizeText(String input) {
        if (input == null || input.isBlank()) return "";
        String noAccents = removeAccents(input.toLowerCase(Locale.ROOT));
        String cleaned = PUNCTUATION_PATTERN.matcher(noAccents).replaceAll(" ");
        return MULTI_SPACE_PATTERN.matcher(cleaned).replaceAll(" ").trim();
    }

    /**
     * Tách văn bản thành danh sách token đã lọc Stop Words
     */
    public static List<String> tokenizeAndFilterStopWords(String input) {
        String normalized = normalizeText(input);
        if (normalized.isBlank()) return Collections.emptyList();

        String[] rawTokens = normalized.split("\\s+");
        List<String> tokens = new ArrayList<>();
        for (String t : rawTokens) {
            if (t.length() >= 2 && !VIETNAMESE_STOP_WORDS.contains(t)) {
                tokens.add(t);
            }
        }
        return tokens;
    }

    /**
     * Mở rộng danh sách tokens bằng các từ đồng nghĩa và viết tắt kỹ thuật
     */
    public static List<String> expandWithSynonyms(List<String> tokens) {
        if (tokens == null || tokens.isEmpty()) return Collections.emptyList();
        Set<String> expanded = new LinkedHashSet<>(tokens);

        for (String token : tokens) {
            List<String> synonyms = TECHNICAL_SYNONYMS.get(token);
            if (synonyms != null) {
                for (String syn : synonyms) {
                    for (String synToken : syn.split("\\s+")) {
                        if (synToken.length() >= 2 && !VIETNAMESE_STOP_WORDS.contains(synToken)) {
                            expanded.add(synToken);
                        }
                    }
                }
            }
        }
        return new ArrayList<>(expanded);
    }

    /**
     * Tạo mã SHA-256 từ chuỗi đã chuẩn hóa (dùng cho chống trùng lặp kiến thức)
     */
    public static String sha256Hex(String input) {
        if (input == null) return "";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(hash.length * 2);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (Exception e) {
            return String.valueOf(input.hashCode());
        }
    }

    /**
     * Lọc sạch thông tin nhạy cảm (PII, Password, Token, Bearer, Phone, Email)
     */
    public static String sanitizePiiAndSecrets(String text) {
        if (text == null) return "";
        return text
                // Lọc Email
                .replaceAll("(?i)\\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Z|a-z]{2,}\\b", "[EMAIL_PROTECTED]")
                // Lọc Số điện thoại VN
                .replaceAll("(?i)(?:\\+84|0)(?:3[2-9]|5[6|8|9]|7[0|6-9]|8[1-9]|9[0-9])[0-9]{7}\\b", "[PHONE_PROTECTED]")
                // Lọc Bearer token / JWT
                .replaceAll("(?i)bearer\\s+[a-zA-Z0-9\\-_.]+", "[TOKEN_PROTECTED]")
                .replaceAll("ey[A-Za-z0-9_-]{10,}\\.ey[A-Za-z0-9_-]{10,}\\.[A-Za-z0-9_-]{10,}", "[JWT_PROTECTED]")
                // Lọc Password / Secret key
                .replaceAll("(?i)(password|secret|apikey|api_key|token)\\s*[:=]\\s*['\"][^'\"]+['\"]", "$1: [MASKED]");
    }
}
