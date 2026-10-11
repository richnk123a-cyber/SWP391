package com.careerfit.controller;

import com.careerfit.dto.RoadmapDto;
import com.careerfit.dto.RoadmapTopicDto;
import com.careerfit.dto.SkillDto;
import com.careerfit.exception.ApiResponse;
import com.careerfit.service.AdminCatalogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@Tag(name = "Admin Catalog API", description = "Quản lý danh mục kỹ năng và lộ trình học chuẩn hóa (SCRUM-57, 58, 85, 86, 88, 89)")
public class AdminCatalogController {

    private final AdminCatalogService catalogService;

    // =========================================================================
    // PUBLIC / GENERAL CATALOG ENDPOINTS
    // =========================================================================

    @GetMapping("/api/skills")
    @Operation(summary = "Lấy danh mục kỹ năng khả dụng cho ứng viên và nhà tuyển dụng")
    public ResponseEntity<ApiResponse<List<SkillDto>>> getPublicSkills() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh mục kỹ năng thành công", catalogService.getActiveSkills()));
    }

    @GetMapping("/api/roadmaps")
    @Operation(summary = "Lấy danh sách các lộ trình học tập")
    public ResponseEntity<ApiResponse<List<RoadmapDto>>> getPublicRoadmaps() {
        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách lộ trình học thành công", catalogService.getAllRoadmaps()));
    }

    @GetMapping("/api/roadmaps/{id}")
    @Operation(summary = "Chi tiết lộ trình học tập theo ID")
    public ResponseEntity<ApiResponse<RoadmapDto>> getRoadmapById(@PathVariable String id) {
        return ResponseEntity.ok(ApiResponse.success("Chi tiết lộ trình học", catalogService.getRoadmapById(id)));
    }

    @GetMapping("/api/roadmaps/skill/{skillName}")
    @Operation(summary = "Lộ trình học theo tên kỹ năng")
    public ResponseEntity<ApiResponse<RoadmapDto>> getRoadmapBySkill(@PathVariable String skillName) {
        return ResponseEntity.ok(ApiResponse.success("Lộ trình học theo kỹ năng", catalogService.getRoadmapBySkill(skillName)));
    }

    // =========================================================================
    // ADMIN SKILLS CRUD (SCRUM-57, SCRUM-86, SCRUM-85)
    // =========================================================================

    @GetMapping("/api/admin/skills")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin - Lấy toàn bộ kỹ năng trong danh mục")
    public ResponseEntity<ApiResponse<List<SkillDto>>> getAllSkillsAdmin() {
        return ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ kỹ năng thành công", catalogService.getAllSkills()));
    }

    @PostMapping("/api/admin/skills")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-57: Thêm kỹ năng mới vào danh mục")
    public ResponseEntity<ApiResponse<SkillDto>> createSkill(@RequestBody SkillDto dto) {
        SkillDto created = catalogService.createSkill(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm kỹ năng thành công!", created));
    }

    @PutMapping("/api/admin/skills/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-86: Sửa kỹ năng trong danh mục")
    public ResponseEntity<ApiResponse<SkillDto>> updateSkill(
            @PathVariable String id,
            @RequestBody SkillDto dto) {
        SkillDto updated = catalogService.updateSkill(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật kỹ năng thành công!", updated));
    }

    @DeleteMapping("/api/admin/skills/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-85: Xóa kỹ năng khỏi danh mục")
    public ResponseEntity<ApiResponse<Void>> deleteSkill(@PathVariable String id) {
        catalogService.deleteSkill(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa kỹ năng khỏi danh mục."));
    }

    // =========================================================================
    // ADMIN ROADMAPS CRUD (SCRUM-58, SCRUM-89, SCRUM-88)
    // =========================================================================

    @GetMapping("/api/admin/roadmaps")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Admin - Lấy toàn bộ lộ trình học kèm các chủ đề")
    public ResponseEntity<ApiResponse<List<RoadmapDto>>> getAllRoadmapsAdmin() {
        return ResponseEntity.ok(ApiResponse.success("Lấy toàn bộ lộ trình thành công", catalogService.getAllRoadmaps()));
    }

    @PostMapping("/api/admin/roadmaps")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-58: Thêm lộ trình học cho một kỹ năng")
    public ResponseEntity<ApiResponse<RoadmapDto>> createRoadmap(@RequestBody RoadmapDto dto) {
        RoadmapDto created = catalogService.createRoadmap(dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tạo lộ trình học mới thành công!", created));
    }

    @PutMapping("/api/admin/roadmaps/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-89: Sửa thông tin lộ trình học")
    public ResponseEntity<ApiResponse<RoadmapDto>> updateRoadmap(
            @PathVariable String id,
            @RequestBody RoadmapDto dto) {
        RoadmapDto updated = catalogService.updateRoadmap(id, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật lộ trình học thành công!", updated));
    }

    @DeleteMapping("/api/admin/roadmaps/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-88: Xóa lộ trình học cho một kỹ năng")
    public ResponseEntity<ApiResponse<Void>> deleteRoadmap(@PathVariable String id) {
        catalogService.deleteRoadmap(id);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa lộ trình học khỏi hệ thống."));
    }

    // =========================================================================
    // ADMIN ROADMAP TOPICS SUB-OPERATIONS (SCRUM-58, SCRUM-89)
    // =========================================================================

    @PostMapping("/api/admin/roadmaps/{roadmapId}/topics")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-58, SCRUM-89: Thêm bước học vào lộ trình")
    public ResponseEntity<ApiResponse<RoadmapTopicDto>> addTopic(
            @PathVariable String roadmapId,
            @RequestBody RoadmapTopicDto dto) {
        RoadmapTopicDto created = catalogService.addTopic(roadmapId, dto);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Thêm chủ đề học tập thành công!", created));
    }

    @PutMapping("/api/admin/roadmaps/{roadmapId}/topics/{topicId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-89: Cập nhật bước học trong lộ trình")
    public ResponseEntity<ApiResponse<RoadmapTopicDto>> updateTopic(
            @PathVariable String roadmapId,
            @PathVariable String topicId,
            @RequestBody RoadmapTopicDto dto) {
        RoadmapTopicDto updated = catalogService.updateTopic(roadmapId, topicId, dto);
        return ResponseEntity.ok(ApiResponse.success("Cập nhật chủ đề thành công!", updated));
    }

    @DeleteMapping("/api/admin/roadmaps/{roadmapId}/topics/{topicId}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-89: Xóa bước học khỏi lộ trình")
    public ResponseEntity<ApiResponse<Void>> deleteTopic(
            @PathVariable String roadmapId,
            @PathVariable String topicId) {
        catalogService.deleteTopic(roadmapId, topicId);
        return ResponseEntity.ok(ApiResponse.success("Đã xóa chủ đề khỏi lộ trình."));
    }

    @PutMapping("/api/admin/roadmaps/{roadmapId}/topics/reorder")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "SCRUM-89: Sắp xếp lại thứ tự các bước học trong lộ trình")
    public ResponseEntity<ApiResponse<List<RoadmapTopicDto>>> reorderTopics(
            @PathVariable String roadmapId,
            @RequestBody List<String> topicIds) {
        List<RoadmapTopicDto> updated = catalogService.reorderTopics(roadmapId, topicIds);
        return ResponseEntity.ok(ApiResponse.success("Đã cập nhật thứ tự các bước học!", updated));
    }
}
