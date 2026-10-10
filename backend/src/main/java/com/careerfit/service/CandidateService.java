package com.careerfit.service;

import com.careerfit.dto.CandidateProfileResponse;
import com.careerfit.dto.UpdateCandidateProfileRequest;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.CandidateProfile;
import com.careerfit.model.Skill;
import com.careerfit.model.User;
import com.careerfit.repository.CandidateProfileRepository;
import com.careerfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;

    // ===== Lấy profile theo userId =====
    public CandidateProfileResponse getProfile(String userId) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findFirstByEmail(userId.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
        CandidateProfile profile = candidateProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    CandidateProfile newProfile = CandidateProfile.builder()
                            .id("cand-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                            .userId(user.getId())
                            .fullName(user.getUsername())
                            .desiredRole("Fresher Developer")
                            .build();
                    return candidateProfileRepository.save(newProfile);
                });
        return mapToResponse(profile, user);
    }

    // ===== Lấy profile theo email (dùng từ JWT) =====
    public CandidateProfileResponse getProfileByEmail(String email) {
        return getProfile(email);
    }

    // ===== Cập nhật profile theo email =====
    @Transactional
    public CandidateProfileResponse updateProfileByEmail(String email, UpdateCandidateProfileRequest request) {
        return updateProfile(email, request);
    }

    // ===== Cập nhật profile theo userId =====
    @Transactional
    public CandidateProfileResponse updateProfile(String userId, UpdateCandidateProfileRequest request) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findFirstByEmail(userId.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        CandidateProfile profile = candidateProfileRepository.findByUserId(user.getId())
                .orElseGet(() -> {
                    CandidateProfile newProfile = CandidateProfile.builder()
                            .id("cand-" + java.util.UUID.randomUUID().toString().substring(0, 8))
                            .userId(userId)
                            .build();
                    return candidateProfileRepository.save(newProfile);
                });

        if (request.getFullName() != null)       profile.setFullName(request.getFullName().trim());
        if (request.getPhone() != null)          profile.setPhone(request.getPhone().replaceAll("\\s+", ""));
        if (request.getLocation() != null)       profile.setLocation(request.getLocation().trim());
        if (request.getUniversity() != null)     profile.setUniversity(request.getUniversity().trim());
        if (request.getMajor() != null)          profile.setMajor(request.getMajor().trim());
        if (request.getGraduationYear() != null) profile.setGraduationYear(request.getGraduationYear().trim());
        if (request.getDesiredRole() != null)    profile.setDesiredRole(request.getDesiredRole().trim());
        if (request.getExpectedSalary() != null) profile.setExpectedSalary(request.getExpectedSalary().trim());

        // LƯU Ý: Phần cập nhật Skills tạm thời không gán String trực tiếp ở đây nữa. 
        // Sau này sẽ tạo hàm riêng gọi qua SkillService để xử lý quan hệ ManyToMany.

        candidateProfileRepository.save(profile);
        log.info("Candidate profile updated for userId=[{}]", userId);
        return mapToResponse(profile, user);
    }

    // ===== Helper: map Entity -> DTO =====
    private CandidateProfileResponse mapToResponse(CandidateProfile p, User u) {
        
        // Chuyển List<Skill> thành String "Skill1, Skill2" để Frontend dễ hiển thị
        String skillsStr = "";
        if (p.getSkills() != null && !p.getSkills().isEmpty()) {
            skillsStr = p.getSkills().stream().map(Skill::getName).collect(Collectors.joining(", "));
        }

        return CandidateProfileResponse.builder()
                .id(p.getId())
                .userId(p.getUserId())
                .fullName(p.getFullName())
                .email(u.getEmail()) // <-- Móc email từ User qua
                .phone(p.getPhone())
                .location(p.getLocation())
                .university(p.getUniversity())
                .major(p.getMajor())
                .graduationYear(p.getGraduationYear())
                .skills(skillsStr) 
                .hasCv(p.getCvFileName() != null) // <-- Check null file thay vì lưu True/False
                .cvFileName(p.getCvFileName())
                .cvUploadDate(null) // Cột này không còn cần thiết
                .desiredRole(p.getDesiredRole())
                .expectedSalary(p.getExpectedSalary())
                .build();
    }
}
