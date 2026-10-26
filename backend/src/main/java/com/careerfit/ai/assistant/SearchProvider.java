package com.careerfit.ai.assistant;

/**
 * Abstraction cho các nhà cung cấp tra cứu kiến thức CNTT & hướng nghiệp
 */
public interface SearchProvider {

    /**
     * Tra cứu thông tin dựa trên câu truy vấn ngữ nghĩa
     *
     * @param query      Nội dung câu hỏi hoặc từ khóa kỹ thuật
     * @param maxResults Số lượng kết quả tối đa
     * @return SearchResult chứa mức độ bằng chứng và trích dẫn
     */
    SearchResult search(String query, int maxResults);
}
