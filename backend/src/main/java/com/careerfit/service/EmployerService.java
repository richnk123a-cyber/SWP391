package com.careerfit.service;

import com.careerfit.dto.CompanyResponse;
import com.careerfit.dto.UpdateCompanyRequest;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.Company;
import com.careerfit.model.User;
import com.careerfit.repository.CompanyRepository;
import com.careerfit.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmployerService {

    private final CompanyRepository companyRepository;
    private final UserRepository userRepository;

    // ===== Lấy thông tin công ty của employer đang đăng nhập =====
    public CompanyResponse getMyCompany(String userIdOrEmail) {
        User user = userRepository.findById(userIdOrEmail)
                .or(() -> userRepository.findFirstByEmail(userIdOrEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Company company = companyRepository.findByOwnerUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin công ty."));

        return mapToResponse(company);
    }

    // ===== Cập nhật thông tin công ty =====
    @Transactional
    public CompanyResponse updateMyCompany(String userIdOrEmail, UpdateCompanyRequest request) {
        User user = userRepository.findById(userIdOrEmail)
                .or(() -> userRepository.findFirstByEmail(userIdOrEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Company company = companyRepository.findByOwnerUserId(user.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin công ty."));

        // Chỉ cho phép cập nhật nếu chưa bị rejected
        if ("Rejected".equals(company.getVerificationStatus())) {
            log.warn("Employer [{}] tried to update a rejected company profile.", user.getEmail());
        }

        if (request.getCompanyName() != null)   company.setCompanyName(request.getCompanyName().trim());
        if (request.getRecruiterName() != null) company.setRecruiterName(request.getRecruiterName().trim());
        if (request.getWebsite() != null)       company.setWebsite(request.getWebsite().trim());
        if (request.getIndustry() != null)      company.setIndustry(request.getIndustry().trim());
        if (request.getSize() != null)          company.setSize(request.getSize().trim());
        if (request.getLocation() != null)      company.setLocation(request.getLocation().trim());

        companyRepository.save(company);
        log.info("Company info updated for employer=[{}]", user.getEmail());
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
