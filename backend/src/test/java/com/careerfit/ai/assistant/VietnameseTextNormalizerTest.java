package com.careerfit.ai.assistant;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class VietnameseTextNormalizerTest {

    @Test
    @DisplayName("Chuẩn hóa tiếng Việt: Bỏ dấu, chữ thường và khoảng trắng thừa")
    void testRemoveAccentsAndNormalize() {
        String input = "  Cây Đỏ-Đen và Thuật toán Tỉa Cây (Tree Pruning) tại Đà Nẵng!  ";
        String normalized = VietnameseTextNormalizer.normalizeText(input);

        assertNotNull(normalized);
        assertEquals("cay do den va thuat toan tia cay tree pruning tai da nang", normalized);
    }

    @Test
    @DisplayName("Tách Token và lọc Stop Words tiếng Việt")
    void testTokenizeAndFilterStopWords() {
        String input = "Lộ trình để trở thành lập trình viên Java trong năm 2026 của tôi là gì";
        List<String> tokens = VietnameseTextNormalizer.tokenizeAndFilterStopWords(input);

        // Các từ 'de', 'trong', 'cua', 'la' phải bị lọc
        assertFalse(tokens.contains("de"));
        assertFalse(tokens.contains("trong"));
        assertFalse(tokens.contains("cua"));
        assertFalse(tokens.contains("la"));

        assertTrue(tokens.contains("lo"));
        assertTrue(tokens.contains("trinh"));
        assertTrue(tokens.contains("java"));
    }

    @Test
    @DisplayName("Mở rộng từ đồng nghĩa và viết tắt CNTT")
    void testExpandWithSynonyms() {
        List<String> tokens = List.of("cntt", "csdl");
        List<String> expanded = VietnameseTextNormalizer.expandWithSynonyms(tokens);

        assertTrue(expanded.contains("cntt"));
        assertTrue(expanded.contains("it"));
        assertTrue(expanded.contains("database"));
        assertTrue(expanded.contains("sql"));
    }

    @Test
    @DisplayName("Bảo vệ dữ liệu nhạy cảm: Lọc email, phone, token và secret key")
    void testSanitizePiiAndSecrets() {
        String sensitive = "Liên hệ ứng viên qua email: nguyenvana@gmail.com hoặc SĐT: 0987654321, token: Bearer eyJhbGciOiJIUzI1NiJ9.test, password: 'MySecretPassword123'";
        String sanitized = VietnameseTextNormalizer.sanitizePiiAndSecrets(sensitive);

        assertFalse(sanitized.contains("nguyenvana@gmail.com"));
        assertFalse(sanitized.contains("0987654321"));
        assertFalse(sanitized.contains("MySecretPassword123"));
        assertTrue(sanitized.contains("[EMAIL_PROTECTED]"));
        assertTrue(sanitized.contains("[PHONE_PROTECTED]"));
    }

    @Test
    @DisplayName("Tạo mã SHA-256 cho chống trùng lặp câu hỏi")
    void testSha256Hex() {
        String hash1 = VietnameseTextNormalizer.sha256Hex("java backend roadmap");
        String hash2 = VietnameseTextNormalizer.sha256Hex("java backend roadmap");
        String hash3 = VietnameseTextNormalizer.sha256Hex("frontend react roadmap");

        assertEquals(64, hash1.length());
        assertEquals(hash1, hash2);
        assertNotEquals(hash1, hash3);
    }

    @Test
    @DisplayName("Loại bỏ icon và emoji để phản hồi tự nhiên, chuyên nghiệp không bị máy móc")
    void testStripEmojis() {
        String textWithEmojis = "Chào bạn! 👋 Mình có thể hỗ trợ tạo CV 🚀 với kỹ năng Java 💻 và Spring Boot ✨ chuẩn ATS 100% 🎯.";
        String stripped = VietnameseTextNormalizer.stripEmojis(textWithEmojis);

        assertEquals("Chào bạn! Mình có thể hỗ trợ tạo CV với kỹ năng Java và Spring Boot chuẩn ATS 100%.", stripped);
        assertFalse(stripped.contains("👋"));
        assertFalse(stripped.contains("🚀"));
        assertFalse(stripped.contains("💻"));
        assertFalse(stripped.contains("✨"));
        assertFalse(stripped.contains("🎯"));
    }
}
