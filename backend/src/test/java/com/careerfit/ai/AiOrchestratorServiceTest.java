package com.careerfit.ai;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AiOrchestratorServiceTest {

    @Mock
    private OpenRouterAiClient aiClient;

    @Mock
    private AiDataIntegrationService integrationService;

    @InjectMocks
    private AiOrchestratorService orchestratorService;

    private AiModelDescriptor createMockModel(String name, String id) {
        return AiModelDescriptor.builder()
                .displayName(name)
                .primaryModelId(id)
                .provider("TestProvider")
                .enabled(true)
                .build();
    }

    @Test
    @DisplayName("Luồng 1: Đáp án có sẵn trong CSDL - AI1 xử lý thành công ngay vòng 1")
    void testFlow1_SuccessOnFirstTry() throws Exception {
        AiModelDescriptor ai1 = createMockModel("Google: Gemma 4 31B (free)", "google/gemma-4-31b-it:free");
        AiModelDescriptor ai2 = createMockModel("OpenAI: gpt-oss-20b (free)", "openai/gpt-oss-20b:free");
        when(aiClient.getModelByIndex(0)).thenReturn(ai1);
        when(aiClient.getModelByIndex(1)).thenReturn(ai2);

        when(integrationService.buildUserMessageForAi(any(), any())).thenReturn("User message");
        when(aiClient.callAiAsync(eq(ai1), any(), any(), anyInt()))
                .thenReturn(CompletableFuture.completedFuture("{\"answer\":\"Ket qua tim thay trong DB\",\"confidence\":95}"));
        when(aiClient.callAiAsync(eq(ai2), any(), any(), anyInt()))
                .thenReturn(new CompletableFuture<>());

        Map<String, Object> parsed = new HashMap<>();
        parsed.put("answer", "Ket qua tim thay trong DB");
        parsed.put("reasoning", "Tim thay trong DB");
        parsed.put("confidence", 95.0);
        when(integrationService.parseAiStructuredResponse(anyString())).thenReturn(parsed);

        AiExecutionRequest request = AiExecutionRequest.builder()
                .featureCode("CV_MATCH")
                .featureName("Phù hợp công việc")
                .prompt("Prompt test")
                .answerInDatabase(true)
                .build();

        AiExecutionResponse response = orchestratorService.execute(request);

        assertTrue(response.isSuccess());
        assertEquals(1, response.getFlowType());
        assertEquals("Ket qua tim thay trong DB", response.getFinalAnswer());
        assertEquals("Google: Gemma 4 31B (free)", response.getDecisiveAiName());
        verify(aiClient, times(1)).callAiAsync(eq(ai1), any(), any(), anyInt());
    }

    @Test
    @DisplayName("Luồng 1: AI1 lỗi -> Chuyển sang AI2 thành công (Failover)")
    void testFlow1_FailoverToAi2() throws Exception {
        AiModelDescriptor ai1 = createMockModel("Google: Gemma 4 31B (free)", "google/gemma-4-31b-it:free");
        AiModelDescriptor ai2 = createMockModel("OpenAI: gpt-oss-20b (free)", "openai/gpt-oss-20b:free");

        when(aiClient.getModelByIndex(0)).thenReturn(ai1);
        when(aiClient.getModelByIndex(1)).thenReturn(ai2);

        when(integrationService.buildUserMessageForAi(any(), any())).thenReturn("User message");
        CompletableFuture<String> failedF1 = new CompletableFuture<>();
        failedF1.completeExceptionally(new RuntimeException("OpenRouter 429 Rate limit"));
        when(aiClient.callAiAsync(eq(ai1), any(), any(), anyInt())).thenReturn(failedF1);
        when(aiClient.callAiAsync(eq(ai2), any(), any(), anyInt()))
                .thenReturn(CompletableFuture.completedFuture("{\"answer\":\"Ket qua tu AI2\",\"confidence\":92}"));

        Map<String, Object> parsed = new HashMap<>();
        parsed.put("answer", "Ket qua tu AI2");
        parsed.put("confidence", 92.0);
        when(integrationService.parseAiStructuredResponse(anyString())).thenReturn(parsed);

        AiExecutionRequest request = AiExecutionRequest.builder()
                .featureCode("CV_MATCH")
                .answerInDatabase(true)
                .build();

        AiExecutionResponse response = orchestratorService.execute(request);

        assertTrue(response.isSuccess());
        assertEquals(1, response.getFlowType());
        assertEquals("Ket qua tu AI2", response.getFinalAnswer());
        assertEquals("OpenAI: gpt-oss-20b (free)", response.getDecisiveAiName());
    }

    @Test
    @DisplayName("Luồng 2: CSDL thiếu dữ liệu -> AI1 tạo kết quả -> AI2 thẩm định đồng thuận")
    void testFlow2_Ai2AgreesWithAi1() throws Exception {
        AiModelDescriptor ai1 = createMockModel("Google: Gemma 4 31B (free)", "google/gemma-4-31b-it:free");
        AiModelDescriptor ai2 = createMockModel("OpenAI: gpt-oss-20b (free)", "openai/gpt-oss-20b:free");
        AiModelDescriptor ai3 = createMockModel("NVIDIA: Nemotron 3 Super (free)", "nvidia/nemotron-3-super:free");

        when(aiClient.getModelCount()).thenReturn(3);
        when(aiClient.getModelByIndex(0)).thenReturn(ai1);
        when(aiClient.getModelByIndex(1)).thenReturn(ai2);
        when(aiClient.getModelByIndex(2)).thenReturn(ai3);

        when(integrationService.buildUserMessageForAi(any(), any())).thenReturn("User msg search");

        // AI1 call
        when(aiClient.callAi(eq(ai1), any(), any(), anyInt())).thenReturn("raw1");
        Map<String, Object> parsed1 = new HashMap<>();
        parsed1.put("answer", "Tra loi AI1 sau khi tra cuu web");
        parsed1.put("reasoning", "Ly luan AI1");
        parsed1.put("confidence", 88.0);

        // AI2 call (đồng thuận)
        when(aiClient.callAi(eq(ai2), any(), any(), anyInt())).thenReturn("raw2");
        Map<String, Object> parsed2 = new HashMap<>();
        parsed2.put("answer", "Tra loi AI1 sau khi tra cuu web");
        parsed2.put("reasoning", "AI2 dong y voi AI1");
        parsed2.put("confidence", 94.0);
        parsed2.put("isAgreement", true);

        when(integrationService.parseAiStructuredResponse("raw1")).thenReturn(parsed1);
        when(integrationService.parseAiStructuredResponse("raw2")).thenReturn(parsed2);

        AiExecutionRequest request = AiExecutionRequest.builder()
                .featureCode("MARKET_INSIGHT")
                .answerInDatabase(false)
                .build();

        AiExecutionResponse response = orchestratorService.execute(request);

        assertTrue(response.isSuccess());
        assertEquals(2, response.getFlowType());
        assertEquals("Tra loi AI1 sau khi tra cuu web", response.getFinalAnswer());
        assertTrue(response.getDecisiveAiName().contains("Đồng thuận"));
    }
}
