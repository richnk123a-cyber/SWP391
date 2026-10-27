package com.careerfit.ai.assistant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class Bm25RetrieverTest {

    private Bm25Retriever retriever;

    @BeforeEach
    void setUp() {
        retriever = new Bm25Retriever();

        KnowledgeChunk chunk1 = KnowledgeChunk.builder()
                .id("chunk_1")
                .source("resources/knowledge/careerfit_system_guide.md")
                .title("Thuật toán Match Score trên CareerFit")
                .topic("CAREERFIT_SYSTEM")
                .content("Hệ thống tự động so khớp kỹ năng giữa CV ứng viên và yêu cầu tin tuyển dụng. Kỹ năng bắt buộc chiếm 70% tổng điểm.")
                .keywords(List.of("match score", "so khop", "cv", "ung vien"))
                .confidence(1.0)
                .build();

        KnowledgeChunk chunk2 = KnowledgeChunk.builder()
                .id("chunk_2")
                .source("resources/knowledge/it_technical_handbook.md")
                .title("Cây Đỏ Đen (Red-Black Tree)")
                .topic("IT_ALGORITHMS")
                .content("Cây Đỏ-Đen là cây nhị phân tìm kiếm tự cân bằng mềm dẻo, sử dụng thuộc tính màu và được ứng dụng trong Java TreeMap và HashMap.")
                .keywords(List.of("cay do den", "red black tree", "treemap", "hashmap"))
                .confidence(1.0)
                .build();

        KnowledgeChunk chunk3 = KnowledgeChunk.builder()
                .id("chunk_3")
                .source("resources/knowledge/it_technical_handbook.md")
                .title("Kỹ thuật Tỉa cây (Tree Pruning)")
                .topic("IT_ALGORITHMS")
                .content("Tỉa cây trong học máy (Machine Learning) và Decision Tree giúp hạn chế hiện tượng overfitting và tối ưu hóa thời gian tìm kiếm.")
                .keywords(List.of("tia cay", "tree pruning", "decision tree", "overfitting"))
                .confidence(1.0)
                .build();

        retriever.reindex(List.of(chunk1, chunk2, chunk3));
    }

    @Test
    @DisplayName("Truy xuất BM25: Tìm đúng tài liệu về Match Score")
    void testSearchMatchScore() {
        List<RetrievalResult> results = retriever.search("Tính điểm match score trong CareerFit thế nào", 2);

        assertFalse(results.isEmpty());
        assertEquals("Thuật toán Match Score trên CareerFit", results.get(0).getChunk().getTitle());
        assertTrue(results.get(0).getScore() > 0);
    }

    @Test
    @DisplayName("Truy xuất BM25: Tìm đúng kỹ thuật tỉa cây trong Decision Tree")
    void testSearchTreePruning() {
        List<RetrievalResult> results = retriever.search("Kỹ thuật pruning trong decision tree để chống overfitting", 2);

        assertFalse(results.isEmpty());
        assertEquals("Kỹ thuật Tỉa cây (Tree Pruning)", results.get(0).getChunk().getTitle());
    }

    @Test
    @DisplayName("Thêm động Chunk kiến thức đã học và truy xuất tức thì")
    void testDynamicLearnedChunkAddition() {
        KnowledgeChunk learnedChunk = KnowledgeChunk.builder()
                .id("learned_01")
                .source("learned_database:baeldung.com")
                .title("Cơ chế Garbage Collection G1 trong Java 17")
                .topic("JAVA_CORE")
                .content("G1 GC chia Heap thành các vùng nhớ Region có kích thước bằng nhau từ 1MB đến 32MB, thu gom rác theo cơ chế song song và dự đoán thời gian dừng.")
                .keywords(List.of("garbage collection", "g1 gc", "java 17", "heap region"))
                .confidence(0.9)
                .learned(true)
                .updatedAt(LocalDateTime.now())
                .build();

        retriever.addChunk(learnedChunk);

        List<RetrievalResult> results = retriever.search("G1 Garbage Collection trong Java 17 hoạt động ra sao", 2);

        assertFalse(results.isEmpty());
        assertEquals("learned_01", results.get(0).getChunk().getId());
        assertTrue(results.get(0).getChunk().isLearned());
    }
}
