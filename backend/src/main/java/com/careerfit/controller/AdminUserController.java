package com.careerfit.controller;

import com.careerfit.exception.ApiResponse;
import com.careerfit.model.CandidateProfile;
import com.careerfit.model.Company;
import com.careerfit.model.User;
import com.careerfit.repository.CandidateProfileRepository;
import com.careerfit.repository.CompanyRepository;
import com.careerfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyRepository companyRepository;

    // GET /api/admin/users — Lấy toàn bộ danh sách người dùng trong CSDL
    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsers() {
        List<User> allUsers = userRepository.findAll();

        Map<String, String> candidateNames = new HashMap<>();
        try {
            for (CandidateProfile cp : candidateProfileRepository.findAll()) {
                if (cp.getUserId() != null && cp.getFullName() != null && !cp.getFullName().isBlank()) {
                    candidateNames.put(cp.getUserId(), cp.getFullName());
                }
            }
        } catch (Exception ignored) {}

        Map<String, String> companyNames = new HashMap<>();
        try {
            for (Company c : companyRepository.findAll()) {
                if (c.getOwnerUserId() != null && c.getCompanyName() != null && !c.getCompanyName().isBlank()) {
                    companyNames.put(c.getOwnerUserId(), c.getCompanyName());
                }
            }
        } catch (Exception ignored) {}

        List<Map<String, Object>> result = new ArrayList<>();
        for (User u : allUsers) {
            Map<String, Object> map = new LinkedHashMap<>();
            String id = u.getId() != null ? u.getId() : "";
            String email = u.getEmail() != null ? u.getEmail() : "";
            String username = u.getUsername() != null ? u.getUsername() : "";
            String role = u.getRole() != null ? u.getRole() : "CANDIDATE";
            String status = u.getStatus() != null ? u.getStatus() : "ACTIVE";
            String createdAt = u.getCreatedAt() != null ? u.getCreatedAt().toLocalDate().toString() : "2026-09-01";
            String authProvider = u.getAuthProvider() != null ? u.getAuthProvider() : "local";

            String fullName;
            if ("ADMIN".equalsIgnoreCase(role)) {
                fullName = (username != null && !username.isBlank()) ? username : "Quản trị viên";
            } else if ("EMPLOYER".equalsIgnoreCase(role)) {
                fullName = companyNames.getOrDefault(id, username != null && !username.isBlank() ? username : (email.contains("@") ? email.split("@")[0] : "Nhà tuyển dụng"));
            } else {
                fullName = candidateNames.getOrDefault(id, username != null && !username.isBlank() ? username : (email.contains("@") ? email.split("@")[0] : "Ứng viên"));
            }

            map.put("id", id);
            map.put("email", email);
            map.put("username", username);
            map.put("fullName", fullName);
            map.put("role", role);
            map.put("status", status);
            map.put("createdAt", createdAt);
            map.put("authProvider", authProvider);

            result.add(map);
        }

        return ResponseEntity.ok(ApiResponse.success("Lấy danh sách người dùng thành công.", result));
    }

    // PUT /api/admin/users/{userId}/lock — Khóa tài khoản
    @PutMapping("/{userId}/lock")
    public ResponseEntity<ApiResponse<Map<String, Object>>> lockUser(
            @PathVariable String userId,
            @RequestBody(required = false) Map<String, String> body) {
        return userRepository.findById(userId).map(user -> {
            user.setStatus("LOCKED");
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success("Đã khóa tài khoản thành công.",
                    Map.<String, Object>of("id", user.getId(), "status", "LOCKED")));
        }).orElseGet(() ->
            ResponseEntity.ok(ApiResponse.<Map<String, Object>>error("Không tìm thấy người dùng."))
        );
    }

    // PUT /api/admin/users/{userId}/unlock — Mở khóa tài khoản
    @PutMapping("/{userId}/unlock")
    public ResponseEntity<ApiResponse<Map<String, Object>>> unlockUser(@PathVariable String userId) {
        return userRepository.findById(userId).map(user -> {
            user.setStatus("ACTIVE");
            userRepository.save(user);
            return ResponseEntity.ok(ApiResponse.success("Đã mở khóa tài khoản thành công.",
                    Map.<String, Object>of("id", user.getId(), "status", "ACTIVE")));
        }).orElseGet(() ->
            ResponseEntity.ok(ApiResponse.<Map<String, Object>>error("Không tìm thấy người dùng."))
        );
    }
}
