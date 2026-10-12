package com.careerfit.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Model đại diện cho một AI provider/model trong hệ thống.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModelDescriptor {

    /**
     * Tên hiển thị của AI (VD: "Google: Gemma 4 31B (free)", "OpenAI: gpt-oss-20b (free)", "NVIDIA: Nemotron 3 Super (free)")
     */
    private String displayName;

    /**
     * Model ID chính trên OpenRouter
     */
    private String primaryModelId;

    /**
     * Danh sách model ID dự phòng (fallbacks) nếu model ID chính bị quá tải hoặc thay đổi tên trên OpenRouter
     */
    private List<String> fallbackModelIds;

    /**
     * Provider (Google, OpenAI, NVIDIA, ...)
     */
    private String provider;

    /**
     * Đánh dấu AI có sẵn sàng hoạt động hay không
     */
    @Builder.Default
    private boolean enabled = true;
}
