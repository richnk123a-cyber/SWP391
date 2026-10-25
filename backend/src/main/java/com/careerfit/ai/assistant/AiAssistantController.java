package com.careerfit.ai.assistant;

import com.careerfit.exception.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/ai/assistant")
@RequiredArgsConstructor
public class AiAssistantController {

    private final AiAssistantService assistantService;

    /**
     * Endpoint Chat thông minh theo vai trò kết nối Groq API thật
     */
    @PostMapping("/chat")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<AssistantChatResponse>> chat(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication,
            @Valid @RequestBody AssistantChatRequest request
    ) {
        String role = resolveRole(authentication);
        String username = userDetails != null ? userDetails.getUsername() : (authentication != null ? authentication.getName() : "user");

        AssistantChatResponse response = assistantService.chat(username, role, request);
        return ResponseEntity.ok(ApiResponse.success("Phản hồi thành công từ CareerFit AI.", response));
    }

    /**
     * Endpoint Chuẩn hóa & Cải thiện CV (chỉ dành cho Ứng viên)
     */
    @PostMapping("/polish-cv")
    @PreAuthorize("hasRole('CANDIDATE')")
    public ResponseEntity<ApiResponse<PolishCvResponse>> polishCv(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication,
            @RequestBody PolishCvRequest request
    ) {
        String username = userDetails != null ? userDetails.getUsername() : (authentication != null ? authentication.getName() : "user");
        PolishCvResponse response = assistantService.polishCv(username, request);
        return ResponseEntity.ok(ApiResponse.success("Chuẩn hóa bản nháp CV thành công.", response));
    }

    /**
     * Endpoint Chuẩn hóa & Cải thiện JD (chỉ dành cho Doanh nghiệp)
     */
    @PostMapping("/polish-job")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<ApiResponse<PolishJobResponse>> polishJob(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication,
            @RequestBody PolishJobRequest request
    ) {
        String username = userDetails != null ? userDetails.getUsername() : (authentication != null ? authentication.getName() : "user");
        PolishJobResponse response = assistantService.polishJob(username, request);
        return ResponseEntity.ok(ApiResponse.success("Chuẩn hóa mô tả công việc thành công.", response));
    }

    /**
     * Endpoint Trích xuất thông tin thực thể tuyển dụng (chỉ dành cho Doanh nghiệp)
     */
    @PostMapping("/extract-job-entities")
    @PreAuthorize("hasAnyRole('EMPLOYER', 'ADMIN')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> extractJobEntities(
            @RequestBody Map<String, String> body
    ) {
        String text = body.getOrDefault("text", "");
        Map<String, Object> entities = assistantService.extractJobEntities(text);
        return ResponseEntity.ok(ApiResponse.success("Trích xuất thông tin thành công.", entities));
    }

    /**
     * Endpoint Tải lên & Phân tích tệp tài liệu (PDF, DOCX, XLSX/XLS) cho Chatbot.
     * Tự động trích xuất nội dung và dùng 3 AI theo mô hình bậc thang để chuẩn hóa thông tin CV hoặc JD.
     */
    @PostMapping(value = "/upload-document", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DocumentUploadResponse>> uploadDocument(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication,
            @RequestParam("file") org.springframework.web.multipart.MultipartFile file,
            @RequestParam(value = "targetType", required = false, defaultValue = "AUTO") String targetType
    ) {
        String role = resolveRole(authentication);
        String username = userDetails != null ? userDetails.getUsername() : (authentication != null ? authentication.getName() : "user");

        DocumentUploadResponse response = assistantService.processUploadedDocument(username, role, file, targetType);
        return ResponseEntity.ok(ApiResponse.success("Phân tích tệp thành công.", response));
    }

    /**
     * Lấy ngữ cảnh an toàn của người dùng hiện tại (hồ sơ CV hoặc danh sách tin đăng)
     */
    @GetMapping("/context")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getContext(
            @AuthenticationPrincipal UserDetails userDetails,
            Authentication authentication
    ) {
        String role = resolveRole(authentication);
        String username = userDetails != null ? userDetails.getUsername() : (authentication != null ? authentication.getName() : "user");
        Map<String, Object> context = assistantService.getUserContext(username, role);
        return ResponseEntity.ok(ApiResponse.success("Lấy ngữ cảnh thành công.", context));
    }

    private String resolveRole(Authentication authentication) {
        if (authentication == null || authentication.getAuthorities() == null) {
            return "CANDIDATE";
        }
        for (GrantedAuthority ga : authentication.getAuthorities()) {
            String auth = ga.getAuthority();
            if ("ROLE_EMPLOYER".equalsIgnoreCase(auth) || "EMPLOYER".equalsIgnoreCase(auth)) {
                return "EMPLOYER";
            }
            if ("ROLE_ADMIN".equalsIgnoreCase(auth) || "ADMIN".equalsIgnoreCase(auth)) {
                return "ADMIN";
            }
        }
        return "CANDIDATE";
    }
}
