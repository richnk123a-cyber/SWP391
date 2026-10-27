package com.careerfit.ai.assistant;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

/**
 * Công cụ tìm kiếm và xếp hạng ngữ nghĩa BM25 (Best Matching 25) không phụ thuộc thư viện ngoài.
 * Đạt chuẩn công nghiệp về độ chính xác và tốc độ cho truy xuất tài liệu cục bộ.
 */
@Slf4j
@Component
public class Bm25Retriever {

    private static final double K1 = 1.2;
    private static final double B = 0.75;

    private final List<KnowledgeChunk> corpus = new CopyOnWriteArrayList<>();
    private final Map<String, Integer> docFrequencies = new ConcurrentHashMap<>();
    private final Map<String, Double> idfCache = new ConcurrentHashMap<>();
    private volatile double avgDocLength = 0.0;

    /**
     * Nạp lại toàn bộ kho tri thức và xây dựng chỉ mục BM25
     */
    public synchronized void reindex(List<KnowledgeChunk> newChunks) {
        corpus.clear();
        docFrequencies.clear();
        idfCache.clear();

        if (newChunks == null || newChunks.isEmpty()) {
            avgDocLength = 0.0;
            return;
        }

        long totalTokens = 0;
        for (KnowledgeChunk chunk : newChunks) {
            List<String> tokens = VietnameseTextNormalizer.tokenizeAndFilterStopWords(chunk.getSearchableText());
            chunk.setIndexedTokens(tokens);
            corpus.add(chunk);
            totalTokens += tokens.size();

            // Tính Document Frequency
            Set<String> uniqueTokens = new HashSet<>(tokens);
            for (String t : uniqueTokens) {
                docFrequencies.merge(t, 1, Integer::sum);
            }
        }

        int N = corpus.size();
        avgDocLength = N > 0 ? (double) totalTokens / N : 0.0;

        // Tiền tính toán IDF cho tất cả terms
        for (Map.Entry<String, Integer> entry : docFrequencies.entrySet()) {
            String term = entry.getKey();
            int df = entry.getValue();
            double idf = Math.log(1.0 + (N - df + 0.5) / (df + 0.5));
            idfCache.put(term, Math.max(0.01, idf));
        }

        log.info("BM25 Reindex hoàn tất: {} chunks, avgDocLength = {:.2f}, unique terms = {}",
                N, avgDocLength, docFrequencies.size());
    }

    /**
     * Thêm một chunk mới vào chỉ mục (dùng khi học được kiến thức mới từ bên ngoài)
     */
    public synchronized void addChunk(KnowledgeChunk chunk) {
        if (chunk == null) return;
        List<String> tokens = VietnameseTextNormalizer.tokenizeAndFilterStopWords(chunk.getSearchableText());
        chunk.setIndexedTokens(tokens);
        corpus.add(chunk);

        Set<String> uniqueTokens = new HashSet<>(tokens);
        for (String t : uniqueTokens) {
            docFrequencies.merge(t, 1, Integer::sum);
        }

        int N = corpus.size();
        long totalTokens = corpus.stream()
                .mapToLong(c -> c.getIndexedTokens() != null ? c.getIndexedTokens().size() : 0)
                .sum();
        avgDocLength = (double) totalTokens / N;

        // Cập nhật lại IDF
        for (Map.Entry<String, Integer> entry : docFrequencies.entrySet()) {
            String term = entry.getKey();
            int df = entry.getValue();
            double idf = Math.log(1.0 + (N - df + 0.5) / (df + 0.5));
            idfCache.put(term, Math.max(0.01, idf));
        }
        log.debug("Đã nạp thêm chunk [{}] vào BM25 Index (Tổng: {} chunks)", chunk.getTitle(), N);
    }

    /**
     * Tìm kiếm Top-K đoạn tài liệu phù hợp nhất với truy vấn
     */
    public List<RetrievalResult> search(String query, int topK) {
        if (query == null || query.isBlank() || corpus.isEmpty()) {
            return Collections.emptyList();
        }

        List<String> rawTokens = VietnameseTextNormalizer.tokenizeAndFilterStopWords(query);
        List<String> queryTokens = VietnameseTextNormalizer.expandWithSynonyms(rawTokens);
        if (queryTokens.isEmpty()) {
            return Collections.emptyList();
        }

        List<RetrievalResult> scoredResults = new ArrayList<>();
        double avgDl = avgDocLength > 0 ? avgDocLength : 1.0;

        for (KnowledgeChunk chunk : corpus) {
            List<String> docTokens = chunk.getIndexedTokens();
            if (docTokens == null || docTokens.isEmpty()) continue;

            // Đếm term frequency trong văn bản
            Map<String, Integer> tfMap = new HashMap<>();
            for (String t : docTokens) {
                tfMap.merge(t, 1, Integer::sum);
            }

            double score = 0.0;
            List<String> matched = new ArrayList<>();

            for (String qTerm : queryTokens) {
                int tf = tfMap.getOrDefault(qTerm, 0);
                if (tf > 0) {
                    matched.add(qTerm);
                    double idf = idfCache.getOrDefault(qTerm, 0.5);
                    double numerator = tf * (K1 + 1.0);
                    double denominator = tf + K1 * (1.0 - B + B * ((double) docTokens.size() / avgDl));
                    double termScore = idf * (numerator / denominator);

                    // Title Boost: Nếu từ khóa xuất hiện trong tiêu đề -> nhân 1.5
                    String normalizedTitle = VietnameseTextNormalizer.normalizeText(chunk.getTitle());
                    if (normalizedTitle.contains(qTerm)) {
                        termScore *= 1.5;
                    }

                    // Keyword Boost: Nếu từ khóa xuất hiện trong keywords metadata -> nhân 1.3
                    if (chunk.getKeywords() != null) {
                        for (String kw : chunk.getKeywords()) {
                            if (VietnameseTextNormalizer.normalizeText(kw).contains(qTerm)) {
                                termScore *= 1.3;
                                break;
                            }
                        }
                    }

                    score += termScore;
                }
            }

            if (score > 0) {
                // Áp dụng hệ số tin cậy của chunk (chuẩn nội bộ = 1.0, learned = 0.85-0.95)
                score *= Math.max(0.5, chunk.getConfidence());
                scoredResults.add(RetrievalResult.builder()
                        .chunk(chunk)
                        .score(score)
                        .matchedTerms(matched)
                        .build());
            }
        }

        // Sắp xếp giảm dần theo điểm số BM25
        scoredResults.sort((a, b) -> Double.compare(b.getScore(), a.getScore()));

        return scoredResults.size() > topK ? scoredResults.subList(0, topK) : scoredResults;
    }

    public int getCorpusSize() {
        return corpus.size();
    }
}
