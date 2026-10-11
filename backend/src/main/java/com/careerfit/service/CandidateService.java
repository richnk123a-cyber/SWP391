package com.careerfit.service;

import com.careerfit.dto.CandidateProfileResponse;
import com.careerfit.dto.UpdateCandidateProfileRequest;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.CandidateProfile;
import com.careerfit.model.Skill;
import com.careerfit.model.User;
import com.careerfit.repository.CandidateProfileRepository;
import com.careerfit.repository.UserRepository;
import com.careerfit.util.CvParserUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;
    private final CvParserUtil cvParserUtil;

    private static final String UPLOAD_DIR = "uploads/cvs";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

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

    // ============================================================
    // UC04 (SCRUM-69, SCRUM-35) - TẢI LÊN / CẬP NHẬT CV (PDF/DOCX)
    // ============================================================
    @Transactional
    public CandidateProfileResponse uploadOrUpdateCv(String userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn tệp CV cần tải lên.");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("Dung lượng tệp CV không được vượt quá 5MB.");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new IllegalArgumentException("Tên tệp CV không hợp lệ.");
        }

        String cleanFilename = originalFilename.trim();
        String lowerName = cleanFilename.toLowerCase();
        String extension;
        if (lowerName.endsWith(".pdf")) {
            extension = "pdf";
        } else if (lowerName.endsWith(".docx")) {
            extension = "docx";
        } else {
            throw new IllegalArgumentException("Hệ thống chỉ hỗ trợ định dạng tệp .pdf hoặc .docx.");
        }

        // 1. Trích xuất văn bản từ CV bằng Apache PDFBox / Apache POI (UC04)
        String extractedText = cvParserUtil.extractTextFromCv(file);

        // 2. Lấy thông tin Candidate Profile
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

        // 3. Lưu trữ tệp vật lý an toàn vào uploads/cvs/
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            // Dọn dẹp tệp cũ của ứng viên nếu đã từng upload
            Files.deleteIfExists(uploadPath.resolve(user.getId() + "_cv.pdf"));
            Files.deleteIfExists(uploadPath.resolve(user.getId() + "_cv.docx"));

            // Lưu tệp mới theo quy ước: {userId}_cv.{extension}
            Path targetLocation = uploadPath.resolve(user.getId() + "_cv." + extension);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Đã lưu tệp CV vật lý thành công tại [{}]", targetLocation);
        } catch (IOException e) {
            log.error("Lỗi khi ghi tệp CV vật lý: {}", e.getMessage(), e);
            throw new RuntimeException("Lưu tệp CV thất bại: " + e.getMessage(), e);
        }

        // 4. Cập nhật vào Cơ sở dữ liệu SQL Server
        profile.setCvFileName(cleanFilename);
        profile.setExtractedCvText(extractedText);
        candidateProfileRepository.save(profile);

        log.info("Candidate [{}] đã cập nhật CV thành công. Tên file=[{}], độ dài trích xuất=[{}] ký tự.",
                user.getId(), cleanFilename, extractedText.length());

        return mapToResponse(profile, user);
    }

    // ============================================================
    // UC05 (SCRUM-36) - XÓA CV
    // ============================================================
    @Transactional
    public CandidateProfileResponse deleteCv(String userId) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findFirstByEmail(userId.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        CandidateProfile profile = candidateProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Chưa tìm thấy hồ sơ ứng viên."));

        // 1. Xóa tệp vật lý trên ổ đĩa
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            Files.deleteIfExists(uploadPath.resolve(user.getId() + "_cv.pdf"));
            Files.deleteIfExists(uploadPath.resolve(user.getId() + "_cv.docx"));
            log.info("Đã dọn dẹp tệp CV vật lý của ứng viên [{}]", user.getId());
        } catch (IOException e) {
            log.warn("Không thể xóa tệp CV vật lý của [{}]: {}", user.getId(), e.getMessage());
        }

        // 2. Xóa thông tin CV trong CSDL
        profile.setCvFileName(null);
        profile.setExtractedCvText(null);
        candidateProfileRepository.save(profile);

        log.info("Đã xóa CV của ứng viên [{}] thành công.", user.getId());
        return mapToResponse(profile, user);
    }

    // ============================================================
    // TẢI / XEM TỆP CV VẬT LÝ
    // ============================================================
    public Resource getCvFileResource(String userId) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findFirstByEmail(userId.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        CandidateProfile profile = candidateProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Chưa tìm thấy hồ sơ ứng viên."));

        if (profile.getCvFileName() == null || profile.getCvFileName().isBlank()) {
            throw new ResourceNotFoundException("Ứng viên chưa tải lên CV nào.");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
        Path pdfPath = uploadPath.resolve(user.getId() + "_cv.pdf");
        Path docxPath = uploadPath.resolve(user.getId() + "_cv.docx");

        Path targetPath = Files.exists(pdfPath) ? pdfPath : (Files.exists(docxPath) ? docxPath : null);
        if (targetPath == null) {
            throw new ResourceNotFoundException("Không tìm thấy tệp CV vật lý trên hệ thống lưu trữ.");
        }

        try {
            Resource resource = new UrlResource(targetPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Không thể đọc tệp CV.");
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Đường dẫn tệp không hợp lệ: " + e.getMessage());
        }
    }

    public String getCvFileName(String userId) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findFirstByEmail(userId.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        CandidateProfile profile = candidateProfileRepository.findByUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Chưa tìm thấy hồ sơ ứng viên."));

        return profile.getCvFileName() != null ? profile.getCvFileName() : "CV.pdf";
    }

    // ============================================================
    // SCRUM-52: XEM HỒ SƠ & TẢI CV ỨNG VIÊN (DÀNH CHO EMPLOYER / ADMIN)
    // ============================================================
    public CandidateProfileResponse getProfileByCandidateId(String candidateId) {
        CandidateProfile profile = candidateProfileRepository.findById(candidateId)
                .or(() -> candidateProfileRepository.findByUserId(candidateId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ ứng viên với ID: " + candidateId));

        User user = userRepository.findById(profile.getUserId()).orElse(null);
        return mapToResponse(profile, user);
    }

    public Resource getCvFileResourceByCandidateId(String candidateId) {
        CandidateProfile profile = candidateProfileRepository.findById(candidateId)
                .or(() -> candidateProfileRepository.findByUserId(candidateId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ ứng viên với ID: " + candidateId));

        if (profile.getCvFileName() == null || profile.getCvFileName().isBlank()) {
            throw new ResourceNotFoundException("Ứng viên này chưa tải lên CV nào.");
        }

        Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
        Path pdfPath = uploadPath.resolve(profile.getUserId() + "_cv.pdf");
        Path docxPath = uploadPath.resolve(profile.getUserId() + "_cv.docx");

        Path targetPath = Files.exists(pdfPath) ? pdfPath : (Files.exists(docxPath) ? docxPath : null);

        // Fallback kiểm tra theo tên file hoặc candidateId nếu file chưa đổi theo userId
        if (targetPath == null) {
            Path directNamePath = uploadPath.resolve(profile.getCvFileName());
            if (Files.exists(directNamePath)) {
                targetPath = directNamePath;
            } else {
                Path candIdPath = uploadPath.resolve(profile.getId() + "_cv.pdf");
                if (Files.exists(candIdPath)) {
                    targetPath = candIdPath;
                }
            }
        }

        if (targetPath == null) {
            throw new ResourceNotFoundException("Không tìm thấy tệp CV vật lý trên hệ thống lưu trữ.");
        }

        try {
            Resource resource = new UrlResource(targetPath.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            } else {
                throw new ResourceNotFoundException("Không thể đọc tệp CV.");
            }
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Đường dẫn tệp không hợp lệ: " + e.getMessage());
        }
    }

    public String getCvFileNameByCandidateId(String candidateId) {
        CandidateProfile profile = candidateProfileRepository.findById(candidateId)
                .or(() -> candidateProfileRepository.findByUserId(candidateId))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ ứng viên với ID: " + candidateId));

        return profile.getCvFileName() != null ? profile.getCvFileName() : "CV.pdf";
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
                .email(u != null ? u.getEmail() : "")
                .phone(p.getPhone())
                .location(p.getLocation())
                .university(p.getUniversity())
                .major(p.getMajor())
                .graduationYear(p.getGraduationYear())
                .skills(skillsStr) 
                .hasCv(p.getCvFileName() != null && !p.getCvFileName().isBlank())
                .cvFileName(p.getCvFileName())
                .cvUploadDate(null)
                .extractedCvText(p.getExtractedCvText())
                .desiredRole(p.getDesiredRole())
                .expectedSalary(p.getExpectedSalary())
                .build();
    }
}
