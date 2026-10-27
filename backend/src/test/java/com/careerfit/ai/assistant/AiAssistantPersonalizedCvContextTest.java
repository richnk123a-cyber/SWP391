package com.careerfit.ai.assistant;

import com.careerfit.ai.CareerAiClient;
import com.careerfit.dto.CandidateProfileResponse;
import com.careerfit.dto.JobResponse;
import com.careerfit.service.CandidateService;
import com.careerfit.service.JobService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mockito;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiAssistantPersonalizedCvContextTest {

    private CareerAiClient mockAiClient;
    private CandidateService mockCandidateService;
    private JobService mockJobService;
    private AiAssistantKnowledgeService mockKnowledgeService;
    private SearchProvider mockSearchProvider;
    private DocumentParserService mockDocParser;
    private ObjectMapper mapper;

    private AiAssistantService assistantService;

    @BeforeEach
    void setUp() {
        mockAiClient = Mockito.mock(CareerAiClient.class);
        mockCandidateService = Mockito.mock(CandidateService.class);
        mockJobService = Mockito.mock(JobService.class);
        mockKnowledgeService = Mockito.mock(AiAssistantKnowledgeService.class);
        mockSearchProvider = Mockito.mock(SearchProvider.class);
        mockDocParser = Mockito.mock(DocumentParserService.class);
        mapper = new ObjectMapper();

        assistantService = new AiAssistantService(
                mockAiClient,
                mockCandidateService,
                mockJobService,
                mockKnowledgeService,
                mockSearchProvider,
                mockDocParser,
                mapper
        );
    }

    @Test
    @DisplayName("AI Assistant: Phải nạp đầy đủ nội dung CV đã trích xuất vào ngữ cảnh và System Prompt khi ứng viên hỏi tìm việc")
    void testPersonalizedCvContextInjectedIntoSystemPrompt() throws Exception {
        String username = "trongtien6570@gmail.com";
        String extractedCv = "NGUYỄN TRỌNG TIẾN - FRONTEND DEVELOPER. Kỹ năng: React, JavaScript, HTML5, CSS3, Tailwind CSS. Đồ án: Website E-commerce React, Chatbot AI.";

        CandidateProfileResponse profile = CandidateProfileResponse.builder()
                .fullName("Nguyễn Trọng Tiến")
                .desiredRole("FontEnd Developer")
                .university("Đại học FPT Đà Nẵng")
                .major("Kỹ thuật phần mềm")
                .skills("React, JavaScript, HTML, CSS, Tailwind CSS")
                .hasCv(true)
                .cvFileName("03_06_2026___23f8db44ba7778d1d49b2246a24d2a25..pdf")
                .extractedCvText(extractedCv)
                .build();

        when(mockCandidateService.getProfile(username)).thenReturn(profile);
        when(mockKnowledgeService.classifySemanticIntent(anyString(), anyString())).thenReturn("IT_CAREER");
        when(mockKnowledgeService.isWithinScope(anyString())).thenReturn(true);
        when(mockSearchProvider.search(anyString(), anyInt())).thenReturn(
                SearchResult.builder()
                        .query("test")
                        .level(KnowledgeLevel.LEVEL_1_VERIFIED_KB)
                        .source("KB")
                        .snippet("Snippet")
                        .references(Collections.emptyList())
                        .build()
        );
        when(mockKnowledgeService.retrieveTopChunks(anyString(), anyInt())).thenReturn(Collections.emptyList());

        JobResponse frontendJob = JobResponse.builder()
                .id("job-fe-01")
                .title("Frontend React Developer")
                .companyName("FPT Software")
                .location("Đà Nẵng")
                .salary("15 - 20 triệu")
                .requiredSkills("React, JavaScript")
                .build();
        when(mockJobService.searchJobs(any(), any(), any())).thenReturn(List.of(frontendJob));

        when(mockAiClient.chatLadder(anyList(), anyInt(), anyBoolean()))
                .thenReturn(new CareerAiClient.LadderChatResult(
                        "Chào bạn Nguyễn Trọng Tiến, dựa trên CV của bạn với kỹ năng React và JS, mình thấy bạn rất phù hợp với vị trí Frontend React Developer tại FPT Software Đà Nẵng.",
                        "Groq LLaMA 3.3 70B",
                        1
                ));

        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("Tìm việc làm phù hợp");

        AssistantChatResponse response = assistantService.chat(username, "CANDIDATE", request);

        assertNotNull(response);
        assertNotNull(response.getReply());
        assertTrue(response.getReply().contains("Nguyễn Trọng Tiến"));

        // Xác minh System Prompt gửi lên CareerAiClient có chứa họ tên, chức danh và nội dung CV thực tế
        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Map<String, String>>> messagesCaptor = ArgumentCaptor.forClass(List.class);
        verify(mockAiClient).chatLadder(messagesCaptor.capture(), anyInt(), anyBoolean());

        List<Map<String, String>> sentMessages = messagesCaptor.getValue();
        String systemPrompt = sentMessages.get(0).get("content");

        assertTrue(systemPrompt.contains("Nguyễn Trọng Tiến"), "System Prompt phải chứa họ tên ứng viên");
        assertTrue(systemPrompt.contains("FontEnd Developer"), "System Prompt phải chứa chức danh mong muốn");
        assertTrue(systemPrompt.contains("Frontend React Developer tại FPT Software"), "System Prompt phải chứa tin tuyển dụng thực tế phù hợp");
        assertTrue(systemPrompt.contains("Website E-commerce React"), "System Prompt phải chứa nội dung văn bản trích xuất từ CV của ứng viên");
        assertTrue(systemPrompt.contains("TUYỆT ĐỐI KHÔNG hướng dẫn người dùng các bước lý thuyết"), "Phải có chỉ thị cấm hướng dẫn sáo rỗng");
    }

    @Test
    @DisplayName("Quick Actions: Ứng viên đã có CV phải nhận được gợi ý phân tích CV và việc làm phù hợp thay vì tạo CV 7 bước")
    void testContextualQuickActionsForCandidateWithCv() throws Exception {
        String username = "trongtien6570@gmail.com";
        CandidateProfileResponse profile = CandidateProfileResponse.builder()
                .fullName("Nguyễn Trọng Tiến")
                .hasCv(true)
                .cvFileName("my_cv.pdf")
                .extractedCvText("Kỹ năng Frontend...")
                .build();

        when(mockCandidateService.getProfile(username)).thenReturn(profile);
        when(mockKnowledgeService.classifySemanticIntent(anyString(), anyString())).thenReturn("IT_CAREER");
        when(mockKnowledgeService.isWithinScope(anyString())).thenReturn(true);
        when(mockAiClient.chatLadder(anyList(), anyInt(), anyBoolean()))
                .thenReturn(new CareerAiClient.LadderChatResult("Phản hồi", "Groq", 1));

        AssistantChatRequest request = new AssistantChatRequest();
        request.setMessage("Việc làm nào hợp với tôi");

        AssistantChatResponse response = assistantService.chat(username, "CANDIDATE", request);

        assertNotNull(response.getQuickActions());
        assertFalse(response.getQuickActions().isEmpty());
        assertTrue(response.getQuickActions().stream().anyMatch(q -> q.getLabel().contains("Phân tích CV")));
        assertTrue(response.getQuickActions().stream().anyMatch(q -> q.getLabel().contains("Gợi ý việc làm")));
        assertFalse(response.getQuickActions().stream().anyMatch(q -> q.getLabel().contains("Tạo CV chuẩn 7 bước")));
    }
}
