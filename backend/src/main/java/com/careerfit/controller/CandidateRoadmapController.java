package com.careerfit.controller;

import com.careerfit.dto.PersonalRoadmapDto;
import com.careerfit.dto.ToggleTopicProgressRequest;
import com.careerfit.exception.ApiResponse;
import com.careerfit.model.CandidateTopicProgress;
import com.careerfit.service.CandidateRoadmapService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/candidate/roadmaps")
@RequiredArgsConstructor
@Tag(name = "Candidate Learning Roadmap API", description = "Quản lý lộ trình học tập cá nhân & tiến độ bài học của ứng viên lưu vĩnh viễn trong CSDL")
public class CandidateRoadmapController {

    private final CandidateRoadmapService roadmapService;

    @GetMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Lấy danh sách lộ trình cá nhân đã lưu trong CSDL của ứng viên")
    public ResponseEntity<ApiResponse<List<PersonalRoadmapDto>>> getMyPersonalRoadmaps(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<PersonalRoadmapDto> list = roadmapService.getPersonalRoadmaps(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy lộ trình học cá nhân thành công.", list));
    }

    @PostMapping
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Lưu hoặc cập nhật lộ trình cá nhân hóa do AI sinh ra vào CSDL")
    public ResponseEntity<ApiResponse<PersonalRoadmapDto>> savePersonalRoadmap(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody PersonalRoadmapDto dto) {
        PersonalRoadmapDto saved = roadmapService.savePersonalRoadmap(userDetails.getUsername(), dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Đã lưu lộ trình học cá nhân vào cơ sở dữ liệu thành công!", saved));
    }

    @PutMapping("/topics/toggle")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Cập nhật trạng thái hoàn thành bài học (checkbox) lưu vào CSDL")
    public ResponseEntity<ApiResponse<CandidateTopicProgress>> toggleTopicProgress(
            @AuthenticationPrincipal UserDetails userDetails,
            @RequestBody ToggleTopicProgressRequest req) {
        CandidateTopicProgress updated = roadmapService.toggleTopic(userDetails.getUsername(), req);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật tiến độ bài học thành công!", updated));
    }

    @GetMapping("/topics/progress")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Lấy toàn bộ tiến độ các bài học đã hoàn thành của ứng viên từ CSDL")
    public ResponseEntity<ApiResponse<List<CandidateTopicProgress>>> getMyTopicProgress(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<CandidateTopicProgress> list = roadmapService.getTopicProgress(userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("Lấy tiến độ bài học thành công.", list));
    }

    @DeleteMapping("/{roadmapId}")
    @PreAuthorize("hasRole('CANDIDATE')")
    @Operation(summary = "Xóa một lộ trình cá nhân khỏi CSDL")
    public ResponseEntity<ApiResponse<Void>> deletePersonalRoadmap(
            @AuthenticationPrincipal UserDetails userDetails,
            @PathVariable String roadmapId) {
        roadmapService.deletePersonalRoadmap(userDetails.getUsername(), roadmapId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa lộ trình học khỏi hệ thống."));
    }
}
