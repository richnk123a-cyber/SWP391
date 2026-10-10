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

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
                            ? user.getUsername() : "FPT Software";
                    Company newComp = Company.builder()
                            .id(compId)
                            .ownerUserId(user.getId())
                            .companyName(compName)
                            .recruiterName(user.getUsername() != null ? user.getUsername() : "HR Manager")
                            .email(user.getEmail())
                            .logo("🏢")
                            .verificationStatus("Verified")
                            .build();
                    log.info("Auto-created company=[{}] linked to employer user=[{}]", compId, user.getId());
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
                    Company newComp = Company.builder()
                            .id(compId)
                            .ownerUserId(user.getId())
                            .companyName(request.getCompanyName() != null ? request.getCompanyName().trim() : "FPT Software")
                            .recruiterName(request.getRecruiterName() != null ? request.getRecruiterName().trim() : user.getUsername())
                            .email(user.getEmail())
                            .logo("🏢")
                            .verificationStatus("Verified")
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

        company = companyRepository.save(company);
        log.info("Company info updated for employer=[{}] companyId=[{}] logo_len=[{}]", 
                user.getEmail(), company.getId(), company.getLogo() != null ? company.getLogo().length() : 0);
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
        String fileName = "LOGO_" + UUID.randomUUID() + extension;

        try {
            Path uploadPath = Paths.get("uploads/");
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
            Files.write(uploadPath.resolve(fileName), file.getBytes());
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
                .build();
    }
}
