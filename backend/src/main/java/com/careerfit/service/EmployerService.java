package com.careerfit.service;

import com.careerfit.dto.CompanyResponse;
import com.careerfit.dto.UpdateCompanyRequest;
import com.careerfit.exception.BadRequestException;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.Company;
import com.careerfit.model.User;
import com.careerfit.repository.CompanyRepository;
import com.careerfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployerService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    // ===== Lấy thông tin công ty của employer đang đăng nhập =====
    @Transactional
    public CompanyResponse getMyCompany(String userIdOrEmail) {
        User user = userRepository.findById(userIdOrEmail)
                .or(() -> userRepository.findFirstByEmail(userIdOrEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Company company = companyRepository.findByOwnerUserId(user.getId())
                .or(() -> companyRepository.findFirstByEmail(user.getEmail().toLowerCase()))
                .orElseGet(() -> {
                    String compId = "comp-" + UUID.randomUUID().toString().substring(0, 8);
                    String compName = (user.getUsername() != null && !user.getUsername().isBlank())
                            ? user.getUsername()
                            : (user.getEmail() != null ? user.getEmail().split("@")[0] : "Doanh nghiệp mới");
                    Company newComp = Company.builder()
                            .id(compId)
                            .ownerUserId(user.getId())
                            .companyName(compName)
                            .recruiterName(user.getUsername() != null ? user.getUsername() : "")
                            .email(user.getEmail())
                            .logo("🏢")
                            .verificationStatus(null)
                            .build();
                    log.info("Auto-created company=[{}] linked to employer user=[{}] with status null (not yet submitted)", compId, user.getId());
                    return companyRepository.save(newComp);
                });

        // Đảm bảo ownerUserId luôn được liên kết chính xác với User ID
        if (company.getOwnerUserId() == null || !company.getOwnerUserId().equals(user.getId())) {
            company.setOwnerUserId(user.getId());
            company = companyRepository.save(company);
        }

        return mapToResponse(company);
    }

    // ===== Cập nhật thông tin công ty =====
    @Transactional
    public CompanyResponse updateMyCompany(String userIdOrEmail, UpdateCompanyRequest request) {
        User user = userRepository.findById(userIdOrEmail)
                .or(() -> userRepository.findFirstByEmail(userIdOrEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Company company = companyRepository.findByOwnerUserId(user.getId())
                .or(() -> companyRepository.findFirstByEmail(user.getEmail().toLowerCase()))
                .orElseGet(() -> {
                    String compId = "comp-" + UUID.randomUUID().toString().substring(0, 8);
                    String fallbackName = (request.getCompanyName() != null && !request.getCompanyName().isBlank())
                            ? request.getCompanyName().trim()
                            : (user.getUsername() != null ? user.getUsername() : user.getEmail().split("@")[0]);
                    Company newComp = Company.builder()
                            .id(compId)
                            .ownerUserId(user.getId())
                            .companyName(fallbackName)
                            .recruiterName(request.getRecruiterName() != null ? request.getRecruiterName().trim() : user.getUsername())
                            .email(user.getEmail())
                            .logo("🏢")
                            .verificationStatus(null)
                            .build();
                    log.info("Auto-created company=[{}] on update for employer user=[{}]", compId, user.getId());
                    return newComp;
                });

        // Luôn liên kết chuẩn xác ownerUserId với User ID
        company.setOwnerUserId(user.getId());

        // Chỉ cho phép cập nhật nếu chưa bị rejected
        if ("Rejected".equals(company.getVerificationStatus())) {
            log.warn("Employer [{}] tried to update a rejected company profile.", user.getEmail());
        }

        if (request.getCompanyName() != null)   company.setCompanyName(request.getCompanyName().trim());
        if (request.getRecruiterName() != null) company.setRecruiterName(request.getRecruiterName().trim());
        if (request.getPhone() != null)         company.setPhone(request.getPhone().trim());
        if (request.getWebsite() != null)       company.setWebsite(request.getWebsite().trim());
        if (request.getIndustry() != null)      company.setIndustry(request.getIndustry().trim());
        if (request.getSize() != null)          company.setSize(request.getSize().trim());
        if (request.getLocation() != null)      company.setLocation(request.getLocation().trim());
        if (request.getLogo() != null)          company.setLogo(request.getLogo().trim());
        if (request.getTaxId() != null)         company.setTaxId(request.getTaxId().trim());

        company = companyRepository.save(company);
        log.info("Company info updated for employer=[{}] companyId=[{}] logo_len=[{}]",
                user.getEmail(), company.getId(), company.getLogo() != null ? company.getLogo().length() : 0);
        return mapToResponse(company);
    }

    // ===== Nộp hồ sơ xác minh doanh nghiệp (cho employer đã có tài khoản) =====
    @Transactional
    public CompanyResponse submitVerification(String userIdOrEmail, String recruiterName, String companyName,
                                              String phone, String taxId, String location, String industry,
                                              String website, String companySize, MultipartFile licenseFile) {
        User user = userRepository.findById(userIdOrEmail)
                .or(() -> userRepository.findFirstByEmail(userIdOrEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Company company = companyRepository.findByOwnerUserId(user.getId())
                .or(() -> companyRepository.findFirstByEmail(user.getEmail().toLowerCase()))
                .orElseGet(() -> {
                    String compId = "comp-" + UUID.randomUUID().toString().substring(0, 8);
                    Company newComp = Company.builder()
                            .id(compId)
                            .ownerUserId(user.getId())
                            .email(user.getEmail())
                            .logo("🏢")
                            .build();
                    log.info("Auto-created company=[{}] for submit-verification of user=[{}]", compId, user.getId());
                    return newComp;
                });

        // Cập nhật ownerUserId và email
        company.setOwnerUserId(user.getId());
        company.setEmail(user.getEmail());

        // Cập nhật các trường thông tin
        if (recruiterName != null && !recruiterName.isBlank()) company.setRecruiterName(recruiterName.trim());
        if (companyName   != null && !companyName.isBlank())   company.setCompanyName(companyName.trim());
        if (phone         != null && !phone.isBlank())         company.setPhone(phone.trim());
        if (taxId         != null && !taxId.isBlank())         company.setTaxId(taxId.trim());
        if (location      != null && !location.isBlank())      company.setLocation(location.trim());
        if (industry      != null && !industry.isBlank())      company.setIndustry(industry.trim());
        if (website       != null && !website.isBlank())       company.setWebsite(website.trim());
        if (companySize   != null && !companySize.isBlank())   company.setSize(companySize.trim());

        // Lưu file GPKD vào thư mục uploads/
        if (licenseFile != null && !licenseFile.isEmpty()) {
            String originalFilename = licenseFile.getOriginalFilename();
            String extension = ".pdf";
            if (originalFilename != null && originalFilename.contains(".")) {
                extension = originalFilename.substring(originalFilename.lastIndexOf("."));
            }
            String fileName = "GPKD_" + UUID.randomUUID() + extension;
            try {
                Path uploadPath = Paths.get("uploads/");
                if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
                Files.write(uploadPath.resolve(fileName), licenseFile.getBytes());
            } catch (Exception e) {
                throw new BadRequestException("Lỗi khi lưu file giấy phép kinh doanh: " + e.getMessage());
            }
            company.setBusinessLicenseFile(fileName);
            log.info("Saved business license file=[{}] for employer=[{}]", fileName, user.getEmail());
        }

        // Đặt trạng thái chờ kiểm duyệt
        company.setVerificationStatus("Pending");
        company.setRejectionReason(null);

        company = companyRepository.save(company);
        log.info("Employer=[{}] submitted verification for companyId=[{}]", user.getEmail(), company.getId());

        // Dọn dẹp bất kỳ bản ghi công ty trùng lặp cùng email để tránh xung đột trạng thái
        List<Company> duplicates = companyRepository.findAllByEmail(user.getEmail().toLowerCase());
        for (Company dup : duplicates) {
            if (!dup.getId().equals(company.getId())) {
                companyRepository.delete(dup);
                log.info("Deleted orphan duplicate company=[{}] for email=[{}]", dup.getId(), user.getEmail());
            }
        }

        return mapToResponse(company);
    }

    // ===== Tải lên logo công ty =====
    @Transactional
    public CompanyResponse uploadLogo(String userIdOrEmail, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("Vui lòng chọn file ảnh logo.");
        }
        String contentType = file.getContentType();
        if (contentType == null || !contentType.startsWith("image/")) {
            throw new BadRequestException("Logo phải là file định dạng ảnh (PNG, JPG, JPEG, WEBP, SVG).");
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            throw new BadRequestException("Dung lượng file logo không được vượt quá 5MB.");
        }

        User user = userRepository.findById(userIdOrEmail)
                .or(() -> userRepository.findFirstByEmail(userIdOrEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Company company = companyRepository.findByOwnerUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin công ty."));

        String originalFilename = file.getOriginalFilename();
        String extension = ".png";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf("."));
        }
        String fileName = "LOGO_" + company.getId() + "_" + System.currentTimeMillis() + extension;

        try {
            Path uploadPath = Paths.get("uploads/");
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
            Files.write(uploadPath.resolve(fileName), file.getBytes());

            // Dọn dẹp phiên bản Logo cũ: Giữ lại bản mới nhất (#1) và bản liền trước đó (#2), xóa bản thứ 3 (#3) trở đi
            cleanupOldLogoVersions(uploadPath, company.getId(), company.getLogo());
        } catch (Exception e) {
            throw new BadRequestException("Lỗi khi lưu file logo: " + e.getMessage());
        }

        String logoUrl = "/uploads/" + fileName;
        company.setLogo(logoUrl);
        companyRepository.save(company);
        log.info("Company logo updated for employer=[{}] path=[{}]", user.getEmail(), logoUrl);

        return mapToResponse(company);
    }

    // ===== Helper: map Entity -> DTO =====
    public CompanyResponse mapToResponse(Company c) {
        return CompanyResponse.builder()
                .id(c.getId())
                .ownerUserId(c.getOwnerUserId())
                .companyName(c.getCompanyName())
                .recruiterName(c.getRecruiterName())
                .email(c.getEmail())
                .phone(c.getPhone())
                .website(c.getWebsite())
                .industry(c.getIndustry())
                .size(c.getSize())
                .location(c.getLocation())
                .logo(c.getLogo())
                .verificationStatus(c.getVerificationStatus())
                .rejectionReason(c.getRejectionReason())
                .taxId(c.getTaxId())
                .businessLicenseFile(c.getBusinessLicenseFile())
                .build();
    }

    /**
     * Dọn dẹp các phiên bản Logo cũ của công ty:
     * - Bản mới nhất (#1): Giữ lại.
     * - Bản liền kề trước đó (#2): Giữ lại.
     * - Bản thứ 3 kể từ bản mới nhất (#3) và các bản cũ hơn: Xóa khỏi ổ đĩa để tránh nở rộng dữ liệu.
     */
    private void cleanupOldLogoVersions(Path uploadDir, String companyId, String previousLogoUrl) {
        try {
            if (!Files.exists(uploadDir)) return;

            List<Path> logoFiles = new ArrayList<>();
            try (var stream = Files.list(uploadDir)) {
                stream.filter(Files::isRegularFile)
                        .filter(p -> {
                            String name = p.getFileName().toString();
                            return name.startsWith("LOGO_" + companyId + "_");
                        })
                        .forEach(logoFiles::add);
            }

            // Hỗ trợ cả file logo cũ nếu được lưu theo format legacy UUID
            if (previousLogoUrl != null && previousLogoUrl.startsWith("/uploads/")) {
                String prevFileName = previousLogoUrl.substring("/uploads/".length());
                Path prevPath = uploadDir.resolve(prevFileName);
                if (Files.exists(prevPath) && !logoFiles.contains(prevPath)) {
                    logoFiles.add(prevPath);
                }
            }

            // Sắp xếp giảm dần theo thời gian sửa đổi (Mới nhất ở index 0, cũ dần về sau)
            logoFiles.sort((p1, p2) -> {
                try {
                    return Files.getLastModifiedTime(p2).compareTo(Files.getLastModifiedTime(p1));
                } catch (IOException e) {
                    return 0;
                }
            });

            // Nếu có từ 3 bản trở lên: xóa từ bản thứ 3 trở đi (index >= 2)
            if (logoFiles.size() > 2) {
                for (int i = 2; i < logoFiles.size(); i++) {
                    Path oldLogo = logoFiles.get(i);
                    try {
                        Files.deleteIfExists(oldLogo);
                        log.info("Đã xóa bản Logo cũ thứ {} [{}] của công ty [{}] để tránh nở rộng dữ liệu.",
                                i + 1, oldLogo.getFileName(), companyId);
                    } catch (IOException ex) {
                        log.warn("Không thể xóa bản Logo cũ [{}]: {}", oldLogo, ex.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Lỗi khi dọn dẹp các phiên bản Logo cũ của công ty [{}]: {}", companyId, e.getMessage());
        }
    }

}
