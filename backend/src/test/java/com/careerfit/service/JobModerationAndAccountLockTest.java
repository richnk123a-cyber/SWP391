package com.careerfit.service;

import com.careerfit.dto.ApplicationResponse;
import com.careerfit.dto.JobResponse;
import com.careerfit.dto.PostJobRequest;
import com.careerfit.exception.BadRequestException;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.Application;
import com.careerfit.model.Company;
import com.careerfit.model.Job;
import com.careerfit.model.User;
import com.careerfit.repository.ApplicationRepository;
import com.careerfit.repository.CompanyRepository;
import com.careerfit.repository.JobRepository;
import com.careerfit.repository.SavedJobRepository;
import com.careerfit.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class JobModerationAndAccountLockTest {

    @Mock
    private JobRepository jobRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private SavedJobRepository savedJobRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private com.careerfit.repository.CandidateProfileRepository candidateProfileRepository;

    @InjectMocks
    private JobService jobService;

    private User activeCandidate;
    private User lockedCandidate;
    private User activeEmployer;
    private User lockedEmployer;
    private Job approvedJob;
    private Job pendingJob;
    private Job hiddenJob;

    @BeforeEach
    void setUp() {
        activeCandidate = User.builder()
                .id("cand-1")
                .email("candidate@gmail.com")
                .role("CANDIDATE")
                .status("ACTIVE")
                .build();

        lockedCandidate = User.builder()
                .id("cand-locked")
                .email("locked@gmail.com")
                .role("CANDIDATE")
                .status("LOCKED")
                .build();

        activeEmployer = User.builder()
                .id("emp-1")
                .email("employer@fpt.com")
                .role("EMPLOYER")
                .status("ACTIVE")
                .build();

        lockedEmployer = User.builder()
                .id("emp-locked")
                .email("locked-emp@fpt.com")
                .role("EMPLOYER")
                .status("LOCKED")
                .build();

        approvedJob = Job.builder()
                .id("job-approved")
                .employerId("emp-1")
                .title("Java Developer")
                .verificationStatus("Verified")
                .isVisible(true)
                .postedDate(LocalDateTime.now())
                .build();

        pendingJob = Job.builder()
                .id("job-pending")
                .employerId("emp-1")
                .title("Pending Python Job")
                .verificationStatus("Pending")
                .isVisible(true)
                .postedDate(LocalDateTime.now())
                .build();

        hiddenJob = Job.builder()
                .id("job-hidden")
                .employerId("emp-1")
                .title("Hidden Frontend Job")
                .verificationStatus("Verified")
                .isVisible(false)
                .postedDate(LocalDateTime.now())
                .build();
    }

    @Test
    @DisplayName("1. Khóa tài khoản: Ứng viên bị LOCKED không thể ứng tuyển vào công việc")
    void testApplyJob_LockedCandidate_ThrowsBadRequest() {
        when(userRepository.findById("locked@gmail.com")).thenReturn(Optional.of(lockedCandidate));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                jobService.applyJob("locked@gmail.com", "job-approved")
        );
        assertTrue(ex.getMessage().contains("bị khóa"));
    }

    @Test
    @DisplayName("2. Kiểm duyệt tin: Không thể ứng tuyển vào tin tuyển dụng chưa được duyệt (Pending)")
    void testApplyJob_PendingJob_ThrowsBadRequest() {
        when(userRepository.findById("candidate@gmail.com")).thenReturn(Optional.of(activeCandidate));
        when(jobRepository.findById("job-pending")).thenReturn(Optional.of(pendingJob));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                jobService.applyJob("candidate@gmail.com", "job-pending")
        );
        assertTrue(ex.getMessage().contains("chưa được Quản trị viên phê duyệt") || ex.getMessage().contains("bị ẩn"));
    }

    @Test
    @DisplayName("3. Kiểm duyệt tin: Không thể ứng tuyển vào tin tuyển dụng đang bị ẩn (isVisible = false)")
    void testApplyJob_HiddenJob_ThrowsBadRequest() {
        when(userRepository.findById("candidate@gmail.com")).thenReturn(Optional.of(activeCandidate));
        when(jobRepository.findById("job-hidden")).thenReturn(Optional.of(hiddenJob));

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                jobService.applyJob("candidate@gmail.com", "job-hidden")
        );
        assertTrue(ex.getMessage().contains("bị ẩn") || ex.getMessage().contains("chưa được Quản trị viên phê duyệt"));
    }

    @Test
    @DisplayName("4. Hợp lệ: Ứng viên ACTIVE ứng tuyển thành công vào tin đã Verified và isVisible = true")
    void testApplyJob_Valid_Success() {
        when(userRepository.findById("candidate@gmail.com")).thenReturn(Optional.of(activeCandidate));
        when(jobRepository.findById("job-approved")).thenReturn(Optional.of(approvedJob));
        when(applicationRepository.existsByJobIdAndCandidateId("job-approved", "cand-1")).thenReturn(false);
        when(applicationRepository.save(any(Application.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ApplicationResponse res = jobService.applyJob("candidate@gmail.com", "job-approved");
        assertNotNull(res);
        assertEquals("job-approved", res.getJobId());
        assertEquals("Đã nộp", res.getStatus());
    }

    @Test
    @DisplayName("5. Bảo mật chi tiết: Khách / Người lạ không thể xem chi tiết tin chưa duyệt")
    void testGetJobById_PendingJob_AnonymousOrOtherUser_ThrowsNotFound() {
        when(jobRepository.findById("job-pending")).thenReturn(Optional.of(pendingJob));
        when(userRepository.findById("stranger@gmail.com")).thenReturn(Optional.of(activeCandidate));

        assertThrows(ResourceNotFoundException.class, () ->
                jobService.getJobById("job-pending", "stranger@gmail.com")
        );
    }

    @Test
    @DisplayName("6. Quyền riêng tư: Chủ tin (Employer) hoặc Admin có thể xem tin Pending của mình")
    void testGetJobById_PendingJob_OwnerEmployer_CanView() {
        when(jobRepository.findById("job-pending")).thenReturn(Optional.of(pendingJob));
        when(userRepository.findById("employer@fpt.com")).thenReturn(Optional.of(activeEmployer));

        JobResponse res = jobService.getJobById("job-pending", "employer@fpt.com");
        assertNotNull(res);
        assertEquals("job-pending", res.getId());
    }

    @Test
    @DisplayName("7. Khóa tài khoản: Nhà tuyển dụng bị LOCKED không thể đăng tin tuyển dụng mới")
    void testPostJob_LockedEmployer_ThrowsBadRequest() {
        when(userRepository.findById("locked-emp@fpt.com")).thenReturn(Optional.of(lockedEmployer));

        PostJobRequest req = new PostJobRequest();
        req.setTitle("New Job");

        BadRequestException ex = assertThrows(BadRequestException.class, () ->
                jobService.postJob("locked-emp@fpt.com", req)
        );
        assertTrue(ex.getMessage().contains("bị khóa"));
    }
}
