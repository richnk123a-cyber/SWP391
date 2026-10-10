package com.careerfit.service;

import com.careerfit.dto.*;
import com.careerfit.exception.BadRequestException;
import com.careerfit.exception.ConflictException;
import com.careerfit.model.CandidateProfile;
import com.careerfit.model.Company;
import com.careerfit.model.User;
import com.careerfit.repository.CandidateProfileRepository;
import com.careerfit.repository.CompanyRepository;
import com.careerfit.repository.UserRepository;
import com.careerfit.security.JwtUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.mock.web.MockMultipartFile;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CandidateProfileRepository candidateProfileRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private AuthenticationManager authenticationManager;

    @InjectMocks
    private AuthService authService;

    // ==================== TEST: LOGIN ====================

    @Test
    void testLogin_AdminEmailRestricted() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin@gmail.com");
        request.setPassword("password");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.login(request));
        assertTrue(exception.getMessage().contains("Tài khoản admin@gmail.com đã bị vô hiệu hóa"));
    }

    @Test
    void testLogin_TrongTienAdminRestricted() {
        LoginRequest request = new LoginRequest();
        request.setEmail("trongtien6571@gmail.com");
        request.setPassword("password");

        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.login(request));
        assertTrue(exception.getMessage().contains("Tài khoản Quản trị viên chỉ được phép đăng nhập thông qua Google OAuth"));
    }

    @Test
    void testLogin_AdminRole_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("admin_custom@gmail.com");
        request.setPassword("password");

        User user = new User();
        user.setId("admin-id");
        user.setEmail("admin_custom@gmail.com");
        user.setUsername("admin");
        user.setPasswordHash("hashed_pwd");
        user.setRole("ADMIN");
        user.setStatus("ACTIVE");

        when(userRepository.findAllByEmailOrUsernameOrId(anyString())).thenReturn(java.util.List.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtils.generateToken(any(), any(), any(), any())).thenReturn("mock-token");
        when(jwtUtils.generateToken(any(), any(), any(), any(), any(), any())).thenReturn("mock-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-token", response.getToken());
        assertEquals("ADMIN", response.getRole());
    }

    @Test
    void testLogin_CandidateRole_Success() {
        LoginRequest request = new LoginRequest();
        request.setEmail("candidate@gmail.com");
        request.setPassword("password");

        User user = new User();
        user.setId("cand-id");
        user.setEmail("candidate@gmail.com");
        user.setUsername("cand_user");
        user.setPasswordHash("hashed_pwd");
        user.setRole("CANDIDATE");
        user.setStatus("ACTIVE");

        when(userRepository.findAllByEmailOrUsernameOrId(anyString())).thenReturn(java.util.List.of(user));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtils.generateToken(any(), any(), any(), any())).thenReturn("mock-token");
        when(jwtUtils.generateToken(any(), any(), any(), any(), any(), any())).thenReturn("mock-token");

        AuthResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("mock-token", response.getToken());
        assertEquals("CANDIDATE", response.getRole());
    }

    // ==================== TEST: REGISTER CANDIDATE ====================

    @Test
    void testRegisterCandidate_InvalidEmail() {
        RegisterCandidateRequest request = new RegisterCandidateRequest();
        request.setEmail("ab@gmail.com"); // Too short before @
        
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.registerCandidate(request));
        assertTrue(exception.getMessage().contains("Email ứng viên phải có đuôi @gmail.com hoặc @outlook.com"));
    }

    @Test
    void testRegisterCandidate_InvalidPhone() {
        RegisterCandidateRequest request = new RegisterCandidateRequest();
        request.setEmail("valid@gmail.com");
        request.setPhone("0123456789"); // Invalid prefix
        
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.registerCandidate(request));
        assertTrue(exception.getMessage().contains("Số điện thoại không hợp lệ"));
    }

    @Test
    void testRegisterCandidate_EmailExists() {
        RegisterCandidateRequest request = new RegisterCandidateRequest();
        request.setEmail("valid@gmail.com");
        request.setPhone("0901234567");

        when(userRepository.existsByEmailAndAuthProvider(anyString(), eq("LOCAL"))).thenReturn(true);

        ConflictException exception = assertThrows(ConflictException.class, () -> authService.registerCandidate(request));
        assertTrue(exception.getMessage().contains("Email đã được sử dụng") || exception.getMessage().contains("Email"));
    }

    @Test
    void testRegisterCandidate_PasswordMismatch() {
        RegisterCandidateRequest request = new RegisterCandidateRequest();
        request.setEmail("valid@gmail.com");
        request.setPhone("0901234567");
        request.setPassword("password");
        request.setConfirmPassword("different");

        when(userRepository.existsByEmailAndAuthProvider(anyString(), eq("LOCAL"))).thenReturn(false);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.registerCandidate(request));
        assertTrue(exception.getMessage().contains("Mật khẩu xác nhận không khớp") || exception.getMessage().contains("khớp"));
    }

    @Test
    void testRegisterCandidate_Success() {
        RegisterCandidateRequest request = new RegisterCandidateRequest();
        request.setEmail("valid@gmail.com");
        request.setUsername("johndoe");
        request.setPhone("0901234567");
        request.setPassword("password");
        request.setConfirmPassword("password");
        request.setFullName("John Doe");
        request.setLocation("HCM");
        request.setTargetRole("Dev");
        request.setLevel("FRESHER");

        when(userRepository.existsByEmailAndAuthProvider(anyString(), eq("LOCAL"))).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-pwd");
        when(jwtUtils.generateToken(any(), any(), any(), any())).thenReturn("mock-token");
        when(jwtUtils.generateToken(any(), any(), any(), any(), any(), any())).thenReturn("mock-token");

        AuthResponse response = authService.registerCandidate(request);

        assertNotNull(response);
        assertEquals("mock-token", response.getToken());
        assertEquals("CANDIDATE", response.getRole());
        verify(userRepository, times(1)).save(any(User.class));
        verify(candidateProfileRepository, times(1)).save(any(CandidateProfile.class));
    }

    // ==================== TEST: REGISTER EMPLOYER ====================

    @Test
    void testRegisterEmployer_MissingLicenseFile() {
        RegisterEmployerRequest request = new RegisterEmployerRequest();
        
        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.registerEmployer(request, null));
        assertTrue(exception.getMessage().contains("Vui lòng tải lên Giấy phép kinh doanh"));
    }

    @Test
    void testRegisterEmployer_InvalidLicenseFile() {
        RegisterEmployerRequest request = new RegisterEmployerRequest();
        MockMultipartFile file = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());

        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.registerEmployer(request, file));
        assertTrue(exception.getMessage().contains("Giấy phép kinh doanh phải là file Ảnh hoặc PDF"));
    }

    @Test
    void testRegisterEmployer_InvalidPhone() {
        RegisterEmployerRequest request = new RegisterEmployerRequest();
        request.setPhone("0123456789");
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "content".getBytes());

        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.registerEmployer(request, file));
        assertTrue(exception.getMessage().contains("Số điện thoại không hợp lệ"));
    }

    @Test
    void testRegisterEmployer_Success() {
        RegisterEmployerRequest request = new RegisterEmployerRequest();
        request.setUsername("recruiter1");
        request.setPhone("0901234567");
        request.setEmail("hr@company.com");
        request.setPassword("password");
        request.setConfirmPassword("password");
        request.setRecruiterName("HR Name");
        request.setCompanyName("Company Name");

        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "content".getBytes());

        when(userRepository.existsByEmailAndAuthProvider(anyString(), eq("LOCAL"))).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hashed-pwd");

        assertDoesNotThrow(() -> authService.registerEmployer(request, file));

        verify(userRepository, times(1)).save(any(User.class));
        verify(companyRepository, times(1)).save(any(Company.class));
    }

    // ==================== TEST: OAUTH COMPLETE REGISTRATION ====================

    @Test
    void testOauthComplete_InvalidTempToken() {
        OAuthRegisterRequest request = new OAuthRegisterRequest();
        request.setTempToken("invalid-token");

        when(jwtUtils.validateToken(anyString())).thenReturn(false);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.oauthCompleteRegistration(request, null));
        assertTrue(exception.getMessage().contains("Token đăng ký không hợp lệ") || exception.getMessage().contains("Token"));
    }

    @Test
    void testOauthComplete_InvalidEmailForEmployer() {
        OAuthRegisterRequest request = new OAuthRegisterRequest();
        request.setTempToken("valid-token");
        request.setEmail("hr@gmail.com");
        request.setRole("EMPLOYER");
        request.setPhone("0901234567");

        when(jwtUtils.validateToken(anyString())).thenReturn(true);
        when(jwtUtils.extractClaim(anyString(), eq("type"))).thenReturn("TEMP_REGISTER");
        when(jwtUtils.extractSubject(anyString())).thenReturn("hr@gmail.com");
        when(jwtUtils.extractClaim(anyString(), eq("name"))).thenReturn("HR Name");
        when(jwtUtils.extractClaim(anyString(), eq("provider"))).thenReturn("GOOGLE");
        when(userRepository.existsByEmailAndAuthProvider(anyString(), anyString())).thenReturn(false);

        BadRequestException exception = assertThrows(BadRequestException.class, () -> authService.oauthCompleteRegistration(request, null));
        assertTrue(exception.getMessage().contains("Chỉ sử dụng email công ty"));
    }
}
