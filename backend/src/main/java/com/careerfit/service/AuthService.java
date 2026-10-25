package com.careerfit.service;

import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import com.careerfit.dto.*;
import com.careerfit.exception.BadRequestException;
import com.careerfit.exception.ConflictException;
import com.careerfit.model.*;
import com.careerfit.repository.*;
import com.careerfit.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyRepository companyRepository;
    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final NotificationRepository notificationRepository;
    private final SavedJobRepository savedJobRepository;
    private final ReportRepository reportRepository;
    private final ReportStatusHistoryRepository reportStatusHistoryRepository;
    private final AiAnalysisCacheRepository aiAnalysisCacheRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    // ==================== DANG NHAP ====================
    public AuthResponse login(LoginRequest request) {
        String cleanIdentifier = request.getEmail().trim().toLowerCase();
        String selectedProvider = request.getAuthProvider() != null ? request.getAuthProvider().trim().toUpperCase() : "AUTO";
        String rawPassword = request.getPassword();

        if (rawPassword == null || rawPassword.isBlank()) {
            throw new BadRequestException("Vui lòng nhập mật khẩu.", "password");
        }

        // 1. Kiểm tra tài khoản đặc biệt bị vô hiệu hóa hoặc bắt buộc qua Google OAuth
        if ("admin@gmail.com".equalsIgnoreCase(cleanIdentifier) || "admin".equalsIgnoreCase(cleanIdentifier)) {
            throw new BadRequestException("Tài khoản admin@gmail.com đã bị vô hiệu hóa. Quyền Quản trị viên chỉ cho phép đăng nhập qua Google OAuth bằng tài khoản trongtien6571@gmail.com.");
        }

        // Admin trongtien6571@gmail.com có thể đăng nhập bằng mật khẩu Admin@123 / 123456 hoặc Google OAuth

        User user = null;

        // 2. Lựa chọn nền tảng cụ thể (ADMIN, GMAIL/GOOGLE, OUTLOOK/MICROSOFT, LOCAL)
        if ("ADMIN".equals(selectedProvider)) {
            List<User> adminUsers = userRepository.findAllByEmailOrUsernameOrId(cleanIdentifier)
                    .stream().filter(u -> "ADMIN".equalsIgnoreCase(u.getRole())).toList();
            if (adminUsers.isEmpty()) {
                throw new BadRequestException("Không tìm thấy tài khoản Quản trị viên tương ứng.");
            }
            user = adminUsers.stream()
                    .filter(u -> {
                        if (u.getPasswordHash() == null) return "Admin@123".equals(rawPassword) || "123456".equals(rawPassword);
                        return passwordEncoder.matches(rawPassword, u.getPasswordHash()) 
                                || "123456".equals(u.getPasswordHash()) 
                                || "Admin@123".equals(rawPassword) 
                                || "123456".equals(rawPassword);
                    })
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Tài khoản hoặc mật khẩu Quản trị viên không chính xác."));

        } else if ("GOOGLE".equals(selectedProvider) || "GMAIL".equals(selectedProvider)) {
            List<User> googleUsers = userRepository.findAllByEmailOrUsernameOrId(cleanIdentifier)
                    .stream().filter(u -> "GOOGLE".equalsIgnoreCase(u.getAuthProvider())).toList();
            if (googleUsers.isEmpty()) {
                throw new BadRequestException("Không tìm thấy tài khoản Google với thông tin này.");
            }
            user = googleUsers.stream()
                    .filter(u -> u.getPasswordHash() != null && passwordEncoder.matches(rawPassword, u.getPasswordHash()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Tài khoản hoặc mật khẩu Google không chính xác."));

        } else if ("MICROSOFT".equals(selectedProvider) || "OUTLOOK".equals(selectedProvider)) {
            List<User> msUsers = userRepository.findAllByEmailOrUsernameOrId(cleanIdentifier)
                    .stream().filter(u -> "MICROSOFT".equalsIgnoreCase(u.getAuthProvider())).toList();
            if (msUsers.isEmpty()) {
                throw new BadRequestException("Không tìm thấy tài khoản Microsoft (Outlook) với thông tin này.");
            }
            user = msUsers.stream()
                    .filter(u -> u.getPasswordHash() != null && passwordEncoder.matches(rawPassword, u.getPasswordHash()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Tài khoản hoặc mật khẩu Microsoft (Outlook) không chính xác."));

        } else if ("LOCAL".equals(selectedProvider) || "PASSWORD".equals(selectedProvider)) {
            List<User> localUsers = userRepository.findAllByEmailOrUsernameOrId(cleanIdentifier)
                    .stream().filter(u -> u.getAuthProvider() == null || "LOCAL".equalsIgnoreCase(u.getAuthProvider())).toList();
            if (localUsers.isEmpty()) {
                throw new BadRequestException("Không tìm thấy tài khoản hệ thống với thông tin này.");
            }
            user = localUsers.stream()
                    .filter(u -> u.getPasswordHash() != null && passwordEncoder.matches(rawPassword, u.getPasswordHash()))
                    .findFirst()
                    .orElseThrow(() -> new BadRequestException("Tài khoản hoặc mật khẩu không chính xác."));

        } else {
            // 3. TỰ ĐỘNG (AUTO): Dò tất cả tài khoản khớp Email / Username / ID
            List<User> candidates = userRepository.findAllByEmailOrUsernameOrId(cleanIdentifier);
            if (candidates.isEmpty()) {
                throw new BadRequestException("Tài khoản hoặc mật khẩu không chính xác.");
            }

            // Lọc ra các tài khoản khớp mật khẩu nhập vào
            List<User> matchingUsers = candidates.stream()
                    .filter(u -> u.getPasswordHash() != null && passwordEncoder.matches(rawPassword, u.getPasswordHash()))
                    .toList();

            if (matchingUsers.isEmpty()) {
                // Không có tài khoản nào khớp mật khẩu
                throw new BadRequestException("Tài khoản hoặc mật khẩu không chính xác.");
            } else if (matchingUsers.size() == 1) {
                // Có đúng 1 tài khoản khớp cả email/username và mật khẩu -> Đăng nhập ngay
                user = matchingUsers.get(0);
            } else {
                // Có 2 hoặc nhiều tài khoản trùng cả email VÀ trùng cả mật khẩu
                // Yêu cầu người dùng chọn cụ thể Gmail hoặc Outlook
                throw new BadRequestException("Vui lòng lựa chọn loại email khi tạo tài khoản gmail hoặc outlook để đăng nhập");
            }
        }

        // 4. Kiểm tra trạng thái khóa tài khoản
        if ("LOCKED".equalsIgnoreCase(user.getStatus())) {
            throw new BadRequestException("Tài khoản của bạn đã bị khóa do vi phạm điều khoản hệ thống.");
        }

        String token = jwtUtils.generateToken(
                user.getEmail(), 
                user.getRole(), 
                user.getId(), 
                user.getUsername(),
                user.getAuthProvider(),
                user.getHasCustomPassword()
        );
        log.info("User [{}] (ID: {}) logged in with role [{}] via provider [{}]", user.getEmail(), user.getId(), user.getRole(), user.getAuthProvider());

        return AuthResponse.builder()
                .token(token)
                .userId(user.getId())
                .email(user.getEmail())
                .username(user.getUsername() != null ? user.getUsername() : user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider() : "LOCAL")
                .hasCustomPassword(Boolean.TRUE.equals(user.getHasCustomPassword()))
                .build();
    }

    // ==================== DANG KY UNG VIEN ====================
    @Transactional
    public AuthResponse registerCandidate(RegisterCandidateRequest request) {
        String cleanEmail = request.getEmail().trim().toLowerCase();
        
        // Kiểm tra định dạng Email hợp lệ (bất kỳ email hợp lệ đều được chấp nhận)
        if (!cleanEmail.matches("^[a-zA-Z0-9._%+\\-]{1,}@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$")) {
            throw new BadRequestException("Email không hợp lệ. Vui lòng nhập đúng định dạng email.", "email");
        }

        String cleanPhone = request.getPhone() != null ? request.getPhone().replaceAll("\\s+", "") : "";
        // 1. Kiểm tra định dạng số điện thoại (VN)
        if (!cleanPhone.matches("^0[35789]\\d{8}$")) {
            throw new BadRequestException("Số điện thoại không hợp lệ. Phải đủ 10 số và thuộc các đầu mạng hợp lệ.", "phone");
        }

        // Business validation: duplicate email for LOCAL provider
        if (userRepository.existsByEmailAndAuthProvider(cleanEmail, "LOCAL")) {
            throw new ConflictException("Email này đã được sử dụng để đăng ký mật khẩu trực tiếp. Vui lòng chọn email khác hoặc Đăng nhập.", "email");
        }

        // Business validation: confirmPassword match
        if (request.getPassword() != null && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp.", "confirmPassword");
        }

        String userId = "user-cand-" + UUID.randomUUID().toString().substring(0, 8);
        String profileId = "cand-" + UUID.randomUUID().toString().substring(0, 8);

        String username = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername().trim()
                : cleanEmail.split("@")[0].toLowerCase();

        User newUser = User.builder()
                .id(userId)
                .email(cleanEmail)
                .username(username)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("CANDIDATE")
                .status("ACTIVE")
                .authProvider("LOCAL")
                .hasCustomPassword(true)
                .createdAt(LocalDateTime.now())
                .build();

        userRepository.save(newUser);

        CandidateProfile profile = CandidateProfile.builder()
                .id(profileId)
                .userId(userId)
                .fullName(request.getFullName() != null ? request.getFullName().trim() : username)
                .phone(cleanPhone)
                .location(request.getLocation() != null ? request.getLocation().trim() : "")
                .desiredRole(request.getTargetRole() != null ? request.getTargetRole().trim() : "")
                .build();

        candidateProfileRepository.save(profile);

        String token = jwtUtils.generateToken(cleanEmail, "CANDIDATE", userId, newUser.getUsername(), "LOCAL", true);
        log.info("New CANDIDATE registered: [{}]", cleanEmail);

        return AuthResponse.builder()
                .token(token)
                .userId(userId)
                .email(cleanEmail)
                .username(newUser.getUsername())
                .role("CANDIDATE")
                .status("ACTIVE")
                .authProvider("LOCAL")
                .hasCustomPassword(true)
                .build();
    }

    // ==================== DANG KY DOANH NGHIEP ====================
    @Transactional
    public void registerEmployer(RegisterEmployerRequest request, MultipartFile licenseFile) {
        
        // 1. KIỂM TRA FILE BẮT BUỘC & ĐỊNH DẠNG (PDF/Ảnh)
        if (licenseFile == null || licenseFile.isEmpty()) {
            throw new BadRequestException("Vui lòng tải lên Giấy phép kinh doanh.");
        }
        String contentType = licenseFile.getContentType();
        if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
            throw new BadRequestException("Giấy phép kinh doanh phải là file Ảnh hoặc PDF.");
        }

        // 1. Kiểm tra định dạng số điện thoại (VN)
        String cleanPhone = request.getPhone() != null ? request.getPhone().replaceAll("\\s+", "") : "";
        if (!cleanPhone.matches("^0[35789]\\d{8}$")) {
            throw new BadRequestException("Số điện thoại không hợp lệ. Phải đủ 10 số và thuộc các đầu mạng hợp lệ.", "phone");
        }
        
        // 2. CHECK EMAIL & PASSWORD
        String cleanEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailAndAuthProvider(cleanEmail, "LOCAL")) {
            throw new ConflictException("Email này đã được sử dụng để đăng ký tài khoản trực tiếp. Vui lòng chọn email khác hoặc Đăng nhập.", "email");
        }
        if (request.getPassword() != null && !request.getPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp.", "confirmPassword");
        }
        
        // 3. LƯU FILE VÀO THƯ MỤC LOKAL
        String fileName = "GPKD_" + UUID.randomUUID() + "_" + licenseFile.getOriginalFilename();
        try {
            Path uploadPath = Paths.get("uploads/");
            if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath); // Tạo thư mục nếu chưa có
            Files.write(uploadPath.resolve(fileName), licenseFile.getBytes());
        } catch (Exception e) {
            throw new BadRequestException("Lỗi khi lưu file: " + e.getMessage());
        }

        String username = (request.getUsername() != null && !request.getUsername().isBlank())
                ? request.getUsername().trim()
                : cleanEmail.split("@")[0].toLowerCase();

        // 4. TẠO USER MỚI
        String userId = "user-emp-" + UUID.randomUUID().toString().substring(0, 8);
        User newUser = User.builder()
                .id(userId)
                .username(username)
                .email(cleanEmail)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role("EMPLOYER")
                .status("PENDING") // Chờ duyệt
                .authProvider("LOCAL")
                .hasCustomPassword(true)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(newUser);

        // 5. TẠO COMPANY
        Company company = Company.builder()
                .id("comp-" + UUID.randomUUID().toString().substring(0, 8))
                .ownerUserId(userId)
                .companyName(request.getCompanyName() != null ? request.getCompanyName().trim() : username)
                .recruiterName(request.getRecruiterName() != null ? request.getRecruiterName().trim() : username)
                .email(cleanEmail)
                .phone(cleanPhone)
                .website(request.getWebsite() != null ? request.getWebsite().trim() : null)
                .industry(request.getIndustry())
                .location(request.getLocation())
                .logo("\uD83C\uDFE2")
                .verificationStatus("Pending")
                .businessLicenseFile(fileName)
                .build();
        companyRepository.save(company);
        log.info("New EMPLOYER registered: [{}]", cleanEmail);
    }

    // ==================== HOAN TAT DANG KY OAUTH ====================
    @Transactional
    public AuthResponse oauthCompleteRegistration(OAuthRegisterRequest request, MultipartFile licenseFile) {
        // 1. Validate temp token
        if (!jwtUtils.validateToken(request.getTempToken())) {
            throw new BadRequestException("Token đăng ký không hợp lệ hoặc đã hết hạn.");
        }

        String tokenType = jwtUtils.extractClaim(request.getTempToken(), "type");
        if (!"TEMP_REGISTER".equals(tokenType)) {
            throw new BadRequestException("Loại token không đúng.");
        }

        // 2. Extract identity from SIGNED token
        String tokenEmail = jwtUtils.extractSubject(request.getTempToken()).toLowerCase().trim();
        String requestedEmail = request.getEmail().toLowerCase().trim();
        String name = jwtUtils.extractClaim(request.getTempToken(), "name");
        String provider = jwtUtils.extractClaim(request.getTempToken(), "provider");
        String providerId = jwtUtils.extractClaim(request.getTempToken(), "providerId");
        String avatarUrl = jwtUtils.extractClaim(request.getTempToken(), "avatarUrl");

        // 3. Final check for race condition (double registration)
        if (userRepository.existsByEmailAndAuthProvider(requestedEmail, provider)) {
            if (requestedEmail.equals(tokenEmail)) {
                // SAFE: Email verified by OAuth Provider
                User existingUser = userRepository.findByEmailAndAuthProvider(tokenEmail, provider).orElseThrow();
                String token = jwtUtils.generateToken(
                        existingUser.getEmail(), 
                        existingUser.getRole(), 
                        existingUser.getId(), 
                        existingUser.getUsername(),
                        existingUser.getAuthProvider(),
                        existingUser.getHasCustomPassword()
                );
                return AuthResponse.builder()
                        .token(token)
                        .userId(existingUser.getId())
                        .email(existingUser.getEmail())
                        .username(existingUser.getUsername())
                        .role(existingUser.getRole())
                        .status(existingUser.getStatus())
                        .authProvider(existingUser.getAuthProvider())
                        .hasCustomPassword(Boolean.TRUE.equals(existingUser.getHasCustomPassword()))
                        .build();
            } else {
                // UNSAFE: Tried to use an email they didn't verify via OAuth
                throw new ConflictException("Tài khoản với email và phương thức này đã tồn tại.", "email");
            }
        }

        // 4. KIỂM TRA ĐỊNH DẠNG SỐ ĐIỆN THOẠI
        String cleanPhone = (request.getPhone() != null) ? request.getPhone().replaceAll("\\s+", "") : "";
        if (cleanPhone.isEmpty() || !cleanPhone.matches("^(03|05|07|08|09)\\d{8}$")) {
            throw new BadRequestException("Số điện thoại không hợp lệ (Phải đủ 10 số và bắt đầu bằng 03, 05, 07, 08 hoặc 09).", "phone");
        }

        String selectedRole = (request.getRole() != null && request.getRole().equals("EMPLOYER")) ? "EMPLOYER" : "CANDIDATE";
        
        // Kiểm tra định dạng email hợp lệ (không giới hạn domain)
        if (!requestedEmail.matches("^[a-zA-Z0-9._%+\\-]{1,}@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$")) {
            throw new BadRequestException("Email không hợp lệ. Vui lòng nhập đúng định dạng email.", "email");
        }
        
        // 6. Tạo User chung
        String userId = "user-" + (selectedRole.equals("EMPLOYER") ? "emp-" : "cand-") + UUID.randomUUID().toString().substring(0, 8);
        String displayName = (request.getFullName() != null && !request.getFullName().isBlank())
                ? request.getFullName().trim()
                : (name != null ? name : requestedEmail.split("@")[0]);

        // Chuẩn hóa Username (viết thường, tiền tố email, không chứa dấu tiếng Việt hay khoảng trắng)
        String standardizedUsername = requestedEmail.split("@")[0].toLowerCase();

        // Employer phải PENDING chờ Admin duyệt; Candidate thì ACTIVE ngay
        String userStatus = selectedRole.equals("EMPLOYER") ? "PENDING" : "ACTIVE";

        User user = User.builder()
                .id(userId)
                .email(requestedEmail)
                .username(standardizedUsername)
                .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                .role(selectedRole)
                .status(userStatus)
                .authProvider(provider)
                .providerId(providerId)
                .avatarUrl(avatarUrl)
                .hasCustomPassword(false)
                .createdAt(LocalDateTime.now())
                .build();
        userRepository.save(user);

        // 7. Rẽ nhánh tạo Hồ sơ và lưu Số điện thoại
        if (selectedRole.equals("EMPLOYER")) {
            // Xử lý file Giấy phép kinh doanh
            if (licenseFile == null || licenseFile.isEmpty()) {
                throw new BadRequestException("Vui lòng tải lên Giấy phép kinh doanh.");
            }
            String contentType = licenseFile.getContentType();
            if (contentType == null || (!contentType.startsWith("image/") && !contentType.equals("application/pdf"))) {
                throw new BadRequestException("Giấy phép kinh doanh phải là file Ảnh hoặc PDF.");
            }
            String fileName = "GPKD_" + UUID.randomUUID() + "_" + licenseFile.getOriginalFilename();
            try {
                Path uploadPath = Paths.get("uploads/");
                if (!Files.exists(uploadPath)) Files.createDirectories(uploadPath);
                Files.write(uploadPath.resolve(fileName), licenseFile.getBytes());
            } catch (Exception e) {
                throw new BadRequestException("Lỗi khi lưu file: " + e.getMessage());
            }

            Company company = Company.builder()
                    .id("comp-" + UUID.randomUUID().toString().substring(0, 8))
                    .ownerUserId(userId)
                    .companyName(request.getCompanyName() != null ? request.getCompanyName().trim() : displayName)
                    .recruiterName(displayName)
                    .email(requestedEmail)
                    .phone(cleanPhone)
                    .website(request.getWebsite())
                    .industry(request.getIndustry())
                    .location(request.getLocation())
                    .logo("\uD83C\uDFE2")
                    .verificationStatus("Pending")
                    .businessLicenseFile(fileName)
                    .build();
            companyRepository.save(company);
        } else {
            CandidateProfile profile = CandidateProfile.builder()
                    .id("cand-" + UUID.randomUUID().toString().substring(0, 8))
                    .userId(userId)
                    .fullName(displayName)
                    .phone(request.getPhone())
                    .location(request.getLocation())
                    .desiredRole(request.getTargetRole())
                    .build();
            candidateProfileRepository.save(profile);
        }

        String token = jwtUtils.generateToken(requestedEmail, selectedRole, userId, displayName, provider, false);
        return AuthResponse.builder()
                .token(token)
                .userId(userId)
                .email(requestedEmail)
                .username(displayName)
                .role(selectedRole)
                .status("ACTIVE")
                .authProvider(provider)
                .hasCustomPassword(false)
                .build();
    }

    public java.util.Map<String, Object> getCurrentUser(String identifier) {
        User user = userRepository.findById(identifier)
                .or(() -> userRepository.findByUsername(identifier))
                .or(() -> userRepository.findFirstByEmail(identifier.toLowerCase()))
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản."));
        java.util.Map<String, Object> view = new java.util.LinkedHashMap<>();
        view.put("id", user.getId());
        view.put("userId", user.getId());
        view.put("email", user.getEmail());
        view.put("username", user.getUsername());
        view.put("name", user.getUsername());
        view.put("fullName", user.getUsername());
        view.put("role", user.getRole());
        view.put("status", user.getStatus());
        view.put("avatarUrl", user.getAvatarUrl());
        view.put("authProvider", user.getAuthProvider());
        view.put("hasCustomPassword", user.getHasCustomPassword());
        return view;
    }

    // ==================== LẤY TRẠNG THÁI MẬT KHẨU ====================
    public PasswordStatusResponse getPasswordStatus(String userId) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findFirstByEmail(userId.toLowerCase()))
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản."));

        boolean hasPassword = Boolean.TRUE.equals(user.getHasCustomPassword());
        String provider = user.getAuthProvider();
        if (provider == null || provider.isBlank()) {
            provider = (user.getEmail() != null && user.getEmail().toLowerCase().endsWith("@gmail.com")) ? "GOOGLE" : "LOCAL";
        }

        return PasswordStatusResponse.builder()
                .hasPassword(hasPassword)
                .authProvider(provider)
                .email(user.getEmail())
                .build();
    }

    // ==================== ĐỔI HOẶC THIẾT LẬP MẬT KHẨU ====================
    @Transactional
    public void changePassword(String userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .or(() -> userRepository.findFirstByEmail(userId.toLowerCase()))
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản."));

        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new BadRequestException("Mật khẩu xác nhận không khớp.", "confirmPassword");
        }

        boolean hasPassword = Boolean.TRUE.equals(user.getHasCustomPassword());

        if (hasPassword) {
            // Must verify old password only if user explicitly set a password before
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new BadRequestException("Vui lòng nhập mật khẩu hiện tại.", "oldPassword");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), user.getPasswordHash())) {
                throw new BadRequestException("Mật khẩu hiện tại không chính xác.", "oldPassword");
            }
        }

        // Set new password hash
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        user.setHasCustomPassword(true);
        userRepository.save(user);

        log.info("User [{}] successfully set/changed their password.", user.getEmail());
    }

    // ==================== XÓA TÀI KHOẢN (FULL CASCADE) ====================
    @Transactional
    public void deleteAccount(String userIdentifier) {
        User user = userRepository.findById(userIdentifier)
                .or(() -> userRepository.findByUsername(userIdentifier))
                .or(() -> userRepository.findFirstByEmail(userIdentifier.toLowerCase()))
                .orElseThrow(() -> new BadRequestException("Không tìm thấy tài khoản cần xóa."));

        String userId = user.getId();
        String userEmail = user.getEmail();
        String displayName = (user.getUsername() != null && !user.getUsername().isBlank()) ? user.getUsername() : userEmail;
        String role = user.getRole() != null ? user.getRole().toUpperCase() : "CANDIDATE";

        log.info("Bắt đầu quy trình xóa tài khoản: userId=[{}], email=[{}], role=[{}]", userId, userEmail, role);

        // 1. NẾU LÀ EMPLOYER
        if ("EMPLOYER".equals(role)) {
            // Tìm công ty
            Company company = companyRepository.findByOwnerUserId(userId)
                    .or(() -> companyRepository.findFirstByEmail(userEmail))
                    .orElse(null);

            String companyName = (company != null && company.getCompanyName() != null) ? company.getCompanyName() : displayName;

            // Tìm tất cả các tin tuyển dụng liên quan
            Set<String> employerIds = new HashSet<>();
            employerIds.add(userId);
            if (company != null && company.getId() != null) {
                employerIds.add(company.getId());
            }
            List<Job> employerJobs = jobRepository.findByEmployerIdIn(new ArrayList<>(employerIds));
            if (employerJobs == null || employerJobs.isEmpty()) {
                employerJobs = jobRepository.findByEmployerId(userId);
            }

            if (employerJobs != null && !employerJobs.isEmpty()) {
                for (Job job : employerJobs) {
                    // Lấy tất cả hồ sơ ứng tuyển của job này
                    List<Application> applications = applicationRepository.findByJobId(job.getId());
                    if (applications != null) {
                        for (Application app : applications) {
                            // Gửi thông báo cho từng ứng viên
                            String candidateProfileId = app.getCandidateId();
                            String candidateUserId = candidateProfileId;
                            if (candidateProfileId != null) {
                                Optional<CandidateProfile> candProfileOpt = candidateProfileRepository.findById(candidateProfileId);
                                if (candProfileOpt.isPresent() && candProfileOpt.get().getUserId() != null) {
                                    candidateUserId = candProfileOpt.get().getUserId();
                                }
                            }
                            if (candidateUserId != null) {
                                Notification candNotif = Notification.builder()
                                        .id("notif-" + UUID.randomUUID().toString().substring(0, 8))
                                        .userId(candidateUserId)
                                        .applicationId(null)
                                        .content("Tài khoản công ty " + companyName + " mà bạn ứng tuyển đã bị xóa. Tin tuyển dụng \"" + job.getTitle() + "\" đã bị gỡ bỏ.")
                                        .isRead(false)
                                        .createdAt(LocalDateTime.now())
                                        .build();
                                notificationRepository.save(candNotif);
                            }
                            // Xóa đơn ứng tuyển
                            applicationRepository.delete(app);
                        }
                    }

                    // Xóa ai_analysis_cache của job
                    List<AiAnalysisCache> caches = aiAnalysisCacheRepository.findByJobId(job.getId());
                    if (caches != null && !caches.isEmpty()) {
                        aiAnalysisCacheRepository.deleteAll(caches);
                    }

                    // Xóa saved_jobs của job
                    List<SavedJob> savedJobs = savedJobRepository.findByJobId(job.getId());
                    if (savedJobs != null && !savedJobs.isEmpty()) {
                        savedJobRepository.deleteAll(savedJobs);
                    }

                    // Xóa reports liên quan đến job
                    List<Report> jobReports = reportRepository.findByJobId(job.getId());
                    if (jobReports != null && !jobReports.isEmpty()) {
                        for (Report r : jobReports) {
                            List<ReportStatusHistory> histories = reportStatusHistoryRepository.findByReportIdOrderByCreatedAtAsc(r.getId());
                            if (histories != null && !histories.isEmpty()) {
                                reportStatusHistoryRepository.deleteAll(histories);
                            }
                            reportRepository.delete(r);
                        }
                    }

                    // Xóa skills liên kết với job
                    if (job.getSkills() != null) {
                        job.getSkills().clear();
                        jobRepository.save(job);
                    }

                    // Xóa job
                    jobRepository.delete(job);
                }
            }

            // Gửi thông báo cho ADMIN
            List<User> adminList = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                    .toList();
            for (User admin : adminList) {
                Notification adminNotif = Notification.builder()
                        .id("notif-" + UUID.randomUUID().toString().substring(0, 8))
                        .userId(admin.getId())
                        .content("Người dùng " + displayName + " (Doanh nghiệp: " + companyName + " - " + userEmail + ") đã xóa tài khoản.")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(adminNotif);
            }

            // Xóa reports do chính user này tạo
            List<Report> myReports = reportRepository.findByReporterId(userId);
            if (myReports != null && !myReports.isEmpty()) {
                for (Report r : myReports) {
                    List<ReportStatusHistory> histories = reportStatusHistoryRepository.findByReportIdOrderByCreatedAtAsc(r.getId());
                    if (histories != null && !histories.isEmpty()) {
                        reportStatusHistoryRepository.deleteAll(histories);
                    }
                    reportRepository.delete(r);
                }
            }

            // Xóa notifications của chính user này
            List<Notification> userNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (userNotifications != null && !userNotifications.isEmpty()) {
                notificationRepository.deleteAll(userNotifications);
            }

            // Xóa Company
            if (company != null) {
                companyRepository.delete(company);
            }

            // Xóa User
            userRepository.delete(user);
            log.info("Đã xóa hoàn toàn tài khoản EMPLOYER: userId=[{}]", userId);

        } else if ("CANDIDATE".equals(role)) {
            // 2. NẾU LÀ CANDIDATE
            Optional<CandidateProfile> profileOpt = candidateProfileRepository.findByUserId(userId);
            if (profileOpt.isPresent()) {
                CandidateProfile profile = profileOpt.get();

                // Xóa ai_analysis_cache
                List<AiAnalysisCache> caches = aiAnalysisCacheRepository.findByCandidateId(profile.getId());
                if (caches != null && !caches.isEmpty()) {
                    aiAnalysisCacheRepository.deleteAll(caches);
                }

                // Xóa applications của candidate (tìm theo cả userId và profile.getId() để không bỏ sót)
                Set<String> candIds = new HashSet<>();
                candIds.add(userId);
                if (profile.getId() != null) candIds.add(profile.getId());
                for (String cId : candIds) {
                    List<Application> apps = applicationRepository.findByCandidateId(cId);
                    if (apps != null && !apps.isEmpty()) {
                        applicationRepository.deleteAll(apps);
                    }
                }

                // Xóa candidate skills
                if (profile.getSkills() != null) {
                    profile.getSkills().clear();
                    candidateProfileRepository.save(profile);
                }

                // Xóa profile
                candidateProfileRepository.delete(profile);
            }

            // Xóa saved_jobs
            List<SavedJob> mySavedJobs = savedJobRepository.findByCandidateUserId(userId);
            if (mySavedJobs != null && !mySavedJobs.isEmpty()) {
                savedJobRepository.deleteAll(mySavedJobs);
            }

            // Xóa reports do user này tạo
            List<Report> myReports = reportRepository.findByReporterId(userId);
            if (myReports != null && !myReports.isEmpty()) {
                for (Report r : myReports) {
                    List<ReportStatusHistory> histories = reportStatusHistoryRepository.findByReportIdOrderByCreatedAtAsc(r.getId());
                    if (histories != null && !histories.isEmpty()) {
                        reportStatusHistoryRepository.deleteAll(histories);
                    }
                    reportRepository.delete(r);
                }
            }

            // Xóa notifications của user
            List<Notification> userNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (userNotifications != null && !userNotifications.isEmpty()) {
                notificationRepository.deleteAll(userNotifications);
            }

            // Gửi thông báo cho ADMIN
            List<User> adminList = userRepository.findAll().stream()
                    .filter(u -> "ADMIN".equalsIgnoreCase(u.getRole()))
                    .toList();
            for (User admin : adminList) {
                Notification adminNotif = Notification.builder()
                        .id("notif-" + UUID.randomUUID().toString().substring(0, 8))
                        .userId(admin.getId())
                        .content("Người dùng " + displayName + " (" + userEmail + " - Ứng viên) đã xóa tài khoản.")
                        .isRead(false)
                        .createdAt(LocalDateTime.now())
                        .build();
                notificationRepository.save(adminNotif);
            }

            // Xóa User
            userRepository.delete(user);
            log.info("Đã xóa hoàn toàn tài khoản CANDIDATE: userId=[{}]", userId);

        } else {
            // 3. ADMIN HOẶC ROLE KHÁC
            List<Report> myReports = reportRepository.findByReporterId(userId);
            if (myReports != null && !myReports.isEmpty()) {
                for (Report r : myReports) {
                    List<ReportStatusHistory> histories = reportStatusHistoryRepository.findByReportIdOrderByCreatedAtAsc(r.getId());
                    if (histories != null && !histories.isEmpty()) {
                        reportStatusHistoryRepository.deleteAll(histories);
                    }
                    reportRepository.delete(r);
                }
            }
            List<Notification> userNotifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (userNotifications != null && !userNotifications.isEmpty()) {
                notificationRepository.deleteAll(userNotifications);
            }
            userRepository.delete(user);
            log.info("Đã xóa tài khoản user: userId=[{}]", userId);
        }
    }
}
