package com.careerfit.service;

import com.careerfit.dto.CandidateProfileResponse;
import com.careerfit.dto.UpdateCandidateProfileRequest;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.CandidateProfile;
import com.careerfit.model.Skill;
import com.careerfit.model.User;
import com.careerfit.repository.CandidateProfileRepository;
import com.careerfit.repository.SkillRepository;
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
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CandidateService {

    private final CandidateProfileRepository candidateProfileRepository;
    private final UserRepository userRepository;
    private final SkillRepository skillRepository;
    private final CvParserUtil cvParserUtil;

    private static final String UPLOAD_DIR = "uploads/cvs";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

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
        if (request.getBio() != null)            profile.setBio(request.getBio().trim());
        if (request.getGithubUrl() != null)      profile.setGithubUrl(request.getGithubUrl().trim());
        if (request.getPortfolioUrl() != null)   profile.setPortfolioUrl(request.getPortfolioUrl().trim());

        // Cập nhật Skills vào DB (quan hệ ManyToMany qua bảng candidate_skill)
        List<String> incomingSkills = new ArrayList<>();
        if (request.getSkillList() != null && !request.getSkillList().isEmpty()) {
            incomingSkills.addAll(request.getSkillList());
        } else if (request.getSkills() != null && !request.getSkills().isBlank()) {
            incomingSkills.addAll(Arrays.stream(request.getSkills().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .collect(Collectors.toList()));
        }

        if (request.getSkillList() != null || request.getSkills() != null) {
            List<Skill> matchedSkills = new ArrayList<>();
            for (String sName : incomingSkills) {
                if (sName.isBlank()) continue;
                Skill skill = skillRepository.findByNameIgnoreCase(sName.trim())
                        .orElseGet(() -> {
                            Skill newSkill = Skill.builder()
                                    .id("skill-" + UUID.randomUUID().toString().substring(0, 8))
                                    .name(sName.trim())
                                    .category("Khác")
                                    .isActive(true)
                                    .build();
                            return skillRepository.save(newSkill);
                        });
                if (!matchedSkills.contains(skill)) {
                    matchedSkills.add(skill);
                }
            }
            profile.setSkills(matchedSkills);
        }

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
            throw new IllegalArgumentException("Dung lượng tệp CV không được vượt quá 10MB.");
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

        // 3. Lưu trữ tệp vật lý an toàn vào uploads/cvs/ (Giữ tối đa 2 bản gần nhất, xóa từ bản thứ 3 trở đi)
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            Files.createDirectories(uploadPath);

            // Lưu tệp mới theo quy ước: {userId}_cv_{timestamp}.{extension}
            String newFileName = user.getId() + "_cv_" + System.currentTimeMillis() + "." + extension;
            Path targetLocation = uploadPath.resolve(newFileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);
            log.info("Đã lưu tệp CV vật lý mới nhất thành công tại [{}]", targetLocation);

            // Dọn dẹp phiên bản: Giữ lại bản mới nhất (#1) và bản liền trước đó (#2), xóa bản thứ 3 (#3) trở đi
            cleanupOldCvVersions(uploadPath, user.getId(), profile.getId());
        } catch (IOException e) {
            log.error("Lỗi khi ghi tệp CV vật lý: {}", e.getMessage(), e);
            throw new RuntimeException("Lưu tệp CV thất bại: " + e.getMessage(), e);
        }

        // 4. Nếu text trích xuất từ tệp PDF quá ngắn (< 80 ký tự, thường do file PDF scan hoặc in dạng ảnh):
        // Tự động tổng hợp thông tin CV từ hồ sơ ứng viên để AI Deep Matching luôn hoạt động chính xác
        if (extractedText == null || extractedText.trim().length() < 80) {
            StringBuilder fallback = new StringBuilder();
            fallback.append("HỒ SƠ ỨNG VIÊN CÔNG NGHỆ THÔNG TIN (Trích xuất từ tệp CV: ").append(cleanFilename).append(")\n");

            String candidateName = (profile.getFullName() != null && !profile.getFullName().isBlank())
                    ? profile.getFullName() : user.getUsername();
            if (candidateName != null && !candidateName.isBlank()) {
                fallback.append("Họ và tên: ").append(candidateName).append("\n");
            }
            if (user.getEmail() != null) fallback.append("Email: ").append(user.getEmail()).append("\n");
            if (profile.getPhone() != null && !profile.getPhone().isBlank()) {
                fallback.append("Điện thoại: ").append(profile.getPhone()).append("\n");
            }
            String desiredRole = profile.getDesiredRole();
            if (desiredRole != null && !desiredRole.isBlank()) {
                fallback.append("Vị trí mục tiêu: ").append(desiredRole).append("\n");
            }
            if (profile.getUniversity() != null && !profile.getUniversity().isBlank()) {
                fallback.append("Học vấn / Trường: ").append(profile.getUniversity()).append("\n");
            }
            if (profile.getMajor() != null && !profile.getMajor().isBlank()) {
                fallback.append("Chuyên ngành đào tạo: ").append(profile.getMajor()).append("\n");
            }
            if (profile.getBio() != null && !profile.getBio().isBlank()) {
                fallback.append("Mục tiêu nghề nghiệp: ").append(profile.getBio()).append("\n");
            }

            // Kỹ năng đã chọn trên hồ sơ web
            java.util.List<String> profileSkillNames = new java.util.ArrayList<>();
            if (profile.getSkills() != null && !profile.getSkills().isEmpty()) {
                profile.getSkills().stream()
                        .filter(cs -> cs != null && cs.getName() != null && !cs.getName().isBlank())
                        .forEach(cs -> profileSkillNames.add(cs.getName()));
            }

            // Suy luận kỹ năng bổ sung từ vai trò mong muốn (khi CV là ảnh scan không đọc được)
            // LƯU Ý: KHÔNG tự ý suy luận các công cụ/kỹ thuật chuyên biệt (Git, Docker, CI/CD, SQL, Machine Learning...)
            // để tránh false-positive matching. Chỉ giữ lại ngôn ngữ/khung làm việc chính nếu người dùng chưa điền profile.
            java.util.List<String> inferredSkills = new java.util.ArrayList<>(profileSkillNames);
            if (desiredRole != null) {
                String roleLower = desiredRole.toLowerCase();
                if (roleLower.contains("frontend") || roleLower.contains("front-end") || roleLower.contains("react") || roleLower.contains("ui")) {
                    for (String s : java.util.List.of("HTML/CSS", "JavaScript", "ReactJS", "CSS")) {
                        if (inferredSkills.stream().noneMatch(k -> k.equalsIgnoreCase(s))) inferredSkills.add(s);
                    }
                }
                if (roleLower.contains("backend") || roleLower.contains("back-end") || roleLower.contains("java") || roleLower.contains("spring")) {
                    for (String s : java.util.List.of("Java", "Spring Boot", "REST API")) {
                        if (inferredSkills.stream().noneMatch(k -> k.equalsIgnoreCase(s))) inferredSkills.add(s);
                    }
                }
                if (roleLower.contains("fullstack") || roleLower.contains("full-stack") || roleLower.contains("full stack")) {
                    for (String s : java.util.List.of("JavaScript", "React", "Node.js")) {
                        if (inferredSkills.stream().noneMatch(k -> k.equalsIgnoreCase(s))) inferredSkills.add(s);
                    }
                }
                if (roleLower.contains("mobile") || roleLower.contains("flutter")) {
                    for (String s : java.util.List.of("Flutter", "Dart")) {
                        if (inferredSkills.stream().noneMatch(k -> k.equalsIgnoreCase(s))) inferredSkills.add(s);
                    }
                }
                if (roleLower.contains("python") || roleLower.contains("data")) {
                    for (String s : java.util.List.of("Python")) {
                        if (inferredSkills.stream().noneMatch(k -> k.equalsIgnoreCase(s))) inferredSkills.add(s);
                    }
                }
            }

            if (!inferredSkills.isEmpty()) {
                fallback.append("KỸ NĂNG: ").append(String.join(", ", inferredSkills)).append("\n");
                fallback.append("KỸ NĂNG KHÁC:\n");
                fallback.append("- Giao tiếp & Làm việc nhóm\n");
                fallback.append("- Tư duy phản biện\n");
                fallback.append("- Quản lý thời gian\n");
                fallback.append("- Giải quyết vấn đề\n");
            }

            if (extractedText != null && !extractedText.isBlank()) {
                fallback.append("\nThông tin bổ sung từ tài liệu:\n").append(extractedText);
            }
            if (desiredRole != null && !desiredRole.isBlank()) {
                fallback.append("\nGhi chú: Đây là hồ sơ ứng viên ngành CNTT với kinh nghiệm trong vai trò ").append(desiredRole).append(".\n");
            }

            extractedText = fallback.toString();
            log.info("CV tệp [{}] là ảnh scan, đã tổng hợp {} kỹ năng từ hồ sơ & vai trò (độ dài: {} ký tự).",
                    cleanFilename, inferredSkills.size(), extractedText.length());
        }


        // Cập nhật vào Cơ sở dữ liệu SQL Server (chỉ lưu tệp & văn bản trích xuất cho AI Matching)
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

        // 1. Xóa toàn bộ các tệp CV vật lý của ứng viên trên ổ đĩa
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR).toAbsolutePath().normalize();
            if (Files.exists(uploadPath)) {
                try (var stream = Files.list(uploadPath)) {
                    stream.filter(Files::isRegularFile)
                            .filter(p -> {
                                String name = p.getFileName().toString();
                                return (name.startsWith(user.getId() + "_cv")
                                        || name.startsWith(profile.getId() + "_cv"));
                            })
                            .forEach(p -> {
                                try {
                                    Files.deleteIfExists(p);
                                    log.info("Đã xóa tệp CV: {}", p.getFileName());
                                } catch (IOException ignored) {}
                            });
                }
            }
            log.info("Đã dọn dẹp toàn bộ tệp CV vật lý của ứng viên [{}]", user.getId());
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
        Path targetPath = findLatestCvFile(uploadPath, user.getId(), profile.getId(), profile.getCvFileName());
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
        Path targetPath = findLatestCvFile(uploadPath, profile.getUserId(), profile.getId(), profile.getCvFileName());
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
        List<String> skillNames = (p.getSkills() != null)
                ? p.getSkills().stream().map(Skill::getName).collect(Collectors.toList())
                : Collections.emptyList();
        String skillsStr = String.join(", ", skillNames);

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
                .skillList(skillNames)
                .bio(p.getBio())
                .githubUrl(p.getGithubUrl())
                .portfolioUrl(p.getPortfolioUrl())
                .hasCv(p.getCvFileName() != null && !p.getCvFileName().isBlank())
                .cvFileName(p.getCvFileName())
                .cvUploadDate(null)
                .extractedCvText(p.getExtractedCvText())
                .desiredRole(p.getDesiredRole())
                .expectedSalary(p.getExpectedSalary())
                .build();
    }

    /**
     * Dọn dẹp các phiên bản CV cũ của ứng viên:
     * - Bản mới nhất (#1): Giữ lại.
     * - Bản liền kề trước đó (#2): Giữ lại.
     * - Bản thứ 3 kể từ bản mới nhất (#3) và các bản cũ hơn: Xóa khỏi ổ đĩa để tránh nở rộng dữ liệu.
     */
    private void cleanupOldCvVersions(Path uploadDir, String userId, String profileId) {
        try {
            if (!Files.exists(uploadDir)) return;

            List<Path> userCvFiles = new ArrayList<>();
            try (var stream = Files.list(uploadDir)) {
                stream.filter(Files::isRegularFile)
                        .filter(p -> {
                            String name = p.getFileName().toString();
                            return (userId != null && name.startsWith(userId + "_cv"))
                                    || (profileId != null && name.startsWith(profileId + "_cv"));
                        })
                        .forEach(userCvFiles::add);
            }

            // Sắp xếp giảm dần theo thời gian sửa đổi (Mới nhất ở index 0, cũ dần về sau)
            userCvFiles.sort((p1, p2) -> {
                try {
                    return Files.getLastModifiedTime(p2).compareTo(Files.getLastModifiedTime(p1));
                } catch (IOException e) {
                    return 0;
                }
            });

            // Nếu có từ 3 bản trở lên: xóa từ bản thứ 3 trở đi (index >= 2)
            if (userCvFiles.size() > 2) {
                for (int i = 2; i < userCvFiles.size(); i++) {
                    Path oldCv = userCvFiles.get(i);
                    try {
                        Files.deleteIfExists(oldCv);
                        log.info("Đã xóa bản CV cũ thứ {} [{}] của ứng viên [{}] để tránh nở rộng dữ liệu.",
                                i + 1, oldCv.getFileName(), userId);
                    } catch (IOException ex) {
                        log.warn("Không thể xóa bản CV cũ [{}]: {}", oldCv, ex.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi dọn dẹp các phiên bản CV cũ của ứng viên [{}]: {}", userId, e.getMessage());
        }
    }

    /**
     * Tìm tệp CV mới nhất còn tồn tại của ứng viên (hỗ trợ cả chuẩn timestamp mới và file legacy).
     */
    private Path findLatestCvFile(Path uploadDir, String userId, String profileId, String originalFileName) {
        if (!Files.exists(uploadDir)) return null;

        List<Path> userCvFiles = new ArrayList<>();
        try (var stream = Files.list(uploadDir)) {
            stream.filter(Files::isRegularFile)
                    .filter(p -> {
                        String name = p.getFileName().toString();
                        return (userId != null && name.startsWith(userId + "_cv"))
                                || (profileId != null && name.startsWith(profileId + "_cv"));
                    })
                    .forEach(userCvFiles::add);
        } catch (IOException e) {
            log.warn("Lỗi đọc thư mục CV: {}", e.getMessage());
        }

        if (!userCvFiles.isEmpty()) {
            userCvFiles.sort((p1, p2) -> {
                try {
                    return Files.getLastModifiedTime(p2).compareTo(Files.getLastModifiedTime(p1));
                } catch (IOException e) {
                    return 0;
                }
            });
            return userCvFiles.get(0); // Bản mới nhất
        }

        // Fallback kiểm tra file tên trực tiếp hoặc legacy
        if (originalFileName != null && !originalFileName.isBlank()) {
            Path directNamePath = uploadDir.resolve(originalFileName);
            if (Files.exists(directNamePath)) return directNamePath;
        }

        return null;
    }

}
