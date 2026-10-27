package com.careerfit.ai.assistant;

import com.careerfit.model.AiLearnedKnowledge;
import com.careerfit.repository.AiLearnedKnowledgeRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.core.io.ResourceLoader;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

class AiAssistantLearningAndPersistenceTest {

    private AiAssistantKnowledgeService knowledgeService;
    private AiLearnedKnowledgeRepository mockRepo;
    private Bm25Retriever bm25Retriever;

    @BeforeEach
    void setUp() {
        bm25Retriever = new Bm25Retriever();
        mockRepo = mock(AiLearnedKnowledgeRepository.class);
        ResourceLoader mockLoader = mock(ResourceLoader.class);
        ObjectMapper mapper = new ObjectMapper();

        knowledgeService = new AiAssistantKnowledgeService(
                bm25Retriever, mockRepo, mockLoader, mapper
        );
    }

    @Test
    @DisplayName("Học & Lưu bền vững: Lưu tri thức mới vào DB với mã hash chống trùng và lọc PII")
    void testLearnAndPersistNewKnowledge() {
        when(mockRepo.findByQueryHash(any())).thenReturn(Optional.empty());
        when(mockRepo.save(any(AiLearnedKnowledge.class))).thenAnswer(invocation -> invocation.getArgument(0));

        String query = "Cơ chế Virtual Thread trong Java 21 là gì?";
        String summary = "Virtual Thread là luồng nhẹ do JVM quản lý thay vì OS thread. Người dùng liên hệ admin@gmail.com để xem thêm.";
        String url = "https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html";

        AiLearnedKnowledge saved = knowledgeService.learnAndPersist(query, summary, url, 0.85);

        assertNotNull(saved);
        assertEquals(query, saved.getOriginalQuery());
        assertNotNull(saved.getQueryHash());
        assertEquals(64, saved.getQueryHash().length());
        assertFalse(saved.getSummaryContent().contains("admin@gmail.com")); // Đã lọc PII
        assertTrue(saved.getSummaryContent().contains("[EMAIL_PROTECTED]"));
        assertNotNull(saved.getExpiresAt());
        assertTrue(saved.getExpiresAt().isAfter(LocalDateTime.now()));

        verify(mockRepo, times(1)).save(any(AiLearnedKnowledge.class));
    }

    @Test
    @DisplayName("Chống trùng lặp: Cùng câu hỏi được cập nhật bản ghi cũ, không sinh bản ghi mới")
    void testDeduplicationOnLearn() {
        String query = "Thuật toán sắp xếp QuickSort";
        String normalized = VietnameseTextNormalizer.normalizeText(query);
        String hash = VietnameseTextNormalizer.sha256Hex(normalized);

        AiLearnedKnowledge existing = AiLearnedKnowledge.builder()
                .id("lk_existing_01")
                .queryHash(hash)
                .originalQuery(query)
                .normalizedQuery(normalized)
                .summaryContent("QuickSort sử dụng phương pháp chia để trị với độ phức tạp trung bình O(n log n).")
                .accessCount(1)
                .learnedAt(LocalDateTime.now().minusDays(5))
                .expiresAt(LocalDateTime.now().plusDays(25))
                .build();

        when(mockRepo.findByQueryHash(hash)).thenReturn(Optional.of(existing));
        when(mockRepo.save(any(AiLearnedKnowledge.class))).thenAnswer(invocation -> invocation.getArgument(0));

        knowledgeService.learnAndPersist(query, "Nội dung cập nhật mới hơn", "https://geeksforgeeks.org/quicksort", 0.9);

        ArgumentCaptor<AiLearnedKnowledge> captor = ArgumentCaptor.forClass(AiLearnedKnowledge.class);
        verify(mockRepo).save(captor.capture());

        AiLearnedKnowledge captured = captor.getValue();
        assertEquals("lk_existing_01", captured.getId()); // Giữ nguyên ID, không tạo mới
        assertEquals(2, captured.getAccessCount());      // Tăng số lần truy xuất
        assertEquals("Nội dung cập nhật mới hơn", captured.getSummaryContent());
    }

    @Test
    @DisplayName("Đọc lại kiến thức đã học: Bỏ qua các tri thức đã hết hạn TTL")
    void testFindLearnedKnowledgeIgnoresExpired() {
        String query = "Kiến thức công nghệ cũ đã hết hạn";
        String normalized = VietnameseTextNormalizer.normalizeText(query);
        String hash = VietnameseTextNormalizer.sha256Hex(normalized);

        AiLearnedKnowledge expired = AiLearnedKnowledge.builder()
                .id("lk_expired")
                .queryHash(hash)
                .originalQuery(query)
                .summaryContent("Kiến thức này đã quá hạn")
                .expiresAt(LocalDateTime.now().minusDays(1)) // Đã quá hạn hôm qua
                .build();

        when(mockRepo.findByQueryHash(hash)).thenReturn(Optional.of(expired));

        Optional<AiLearnedKnowledge> result = knowledgeService.findLearnedKnowledge(query);

        assertTrue(result.isEmpty(), "Kiến thức quá hạn không được trả về");
    }
}
