package com.careerfit.ai.assistant;

/**
 * Cấp độ bằng chứng và nguồn gốc kiến thức của CareerFit AI Assistant
 */
public enum KnowledgeLevel {
    /**
     * Mức 1: Kiến thức đã được xác minh trong Knowledge Base nội bộ và Từ điển CNTT chuẩn hóa.
     */
    LEVEL_1_VERIFIED_KB,

    /**
     * Mức 2: Kiến thức tra cứu từ nguồn tài liệu bên ngoài có kiểm chứng (SearchProvider).
     */
    LEVEL_2_EXTERNAL_SEARCH,

    /**
     * Mức 3: Chưa đủ bằng chứng xác minh / Khái niệm cần người dùng cung cấp thêm ngữ cảnh.
     */
    LEVEL_3_INSUFFICIENT
}
