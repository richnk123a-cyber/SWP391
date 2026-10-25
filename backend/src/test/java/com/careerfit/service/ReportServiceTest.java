package com.careerfit.service;

import com.careerfit.dto.CreateReportRequest;
import com.careerfit.dto.ReportResponse;
import com.careerfit.dto.UpdateReportStatusRequest;
import com.careerfit.exception.BadRequestException;
import com.careerfit.exception.ConflictException;
import com.careerfit.model.Job;
import com.careerfit.model.Report;
import com.careerfit.model.User;
import com.careerfit.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {
    @Mock private ReportRepository reportRepository;
    @Mock private ReportStatusHistoryRepository historyRepository;
    @Mock private UserRepository userRepository;
    @Mock private JobRepository jobRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private CandidateProfileRepository candidateProfileRepository;

    private ReportService service;
    private User candidate;
    private User admin;
    private Job job;

    @BeforeEach
    void setUp() {
        service = new ReportService(reportRepository, historyRepository, userRepository,
                jobRepository, companyRepository, candidateProfileRepository);
        candidate = User.builder().id("candidate-1").email("candidate@example.com")
                .username("candidate").role("CANDIDATE").build();
        admin = User.builder().id("admin-1").email("admin@example.com")
                .username("admin").role("ADMIN").build();
        job = Job.builder().id("job-1").employerId("employer-1").title("Java Developer").build();
    }

    @Test
    void createReportPersistsPendingReportAndInitialHistory() {
        when(userRepository.findById("candidate-1")).thenReturn(Optional.of(candidate));
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(job));
        when(reportRepository.existsByJobIdAndReporterIdAndStatusIn(
                "job-1", "candidate-1", List.of("PENDING", "REVIEWING"))).thenReturn(false);
        when(reportRepository.saveAndFlush(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(historyRepository.findByReportIdOrderByCreatedAtAsc(any())).thenReturn(List.of());
        when(candidateProfileRepository.findByUserId("candidate-1")).thenReturn(Optional.empty());

        CreateReportRequest request = new CreateReportRequest();
        request.setReason("Thông tin công việc không chính xác");
        request.setDescription("  Nội dung chi tiết  ");
        ReportResponse response = service.createReport("candidate-1", "job-1", request);

        assertEquals("PENDING", response.getStatus());
        assertEquals("Nội dung chi tiết", response.getDescription());
        verify(reportRepository).saveAndFlush(any(Report.class));
        verify(historyRepository).save(argThat(h -> h.getFromStatus() == null && "PENDING".equals(h.getToStatus())));
    }

    @Test
    void createReportRejectsBlankDescriptionForOtherReason() {
        when(userRepository.findById("candidate-1")).thenReturn(Optional.of(candidate));
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(job));
        CreateReportRequest request = new CreateReportRequest();
        request.setReason("Lý do khác");
        request.setDescription("   ");

        BadRequestException error = assertThrows(BadRequestException.class,
                () -> service.createReport("candidate-1", "job-1", request));
        assertEquals("description", error.getFieldName());
        verify(reportRepository, never()).save(any());
    }

    @Test
    void createReportRejectsExistingOpenReport() {
        when(userRepository.findById("candidate-1")).thenReturn(Optional.of(candidate));
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(job));
        when(reportRepository.existsByJobIdAndReporterIdAndStatusIn(any(), any(), any())).thenReturn(true);
        CreateReportRequest request = new CreateReportRequest();
        request.setReason("Lý do khác");
        request.setDescription("Bằng chứng mới");

        assertThrows(ConflictException.class,
                () -> service.createReport("candidate-1", "job-1", request));
    }

    @Test
    void createReportTranslatesConcurrentUniqueIndexViolationToConflict() {
        when(userRepository.findById("candidate-1")).thenReturn(Optional.of(candidate));
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(job));
        when(reportRepository.existsByJobIdAndReporterIdAndStatusIn(any(), any(), any())).thenReturn(false);
        when(reportRepository.saveAndFlush(any())).thenThrow(new DataIntegrityViolationException("duplicate open report"));
        CreateReportRequest request = new CreateReportRequest();
        request.setReason("Lý do khác");
        request.setDescription("Bằng chứng");

        ConflictException error = assertThrows(ConflictException.class,
                () -> service.createReport("candidate-1", "job-1", request));

        assertEquals("jobId", error.getFieldName());
        verify(historyRepository, never()).save(any());
    }

    @Test
    void updateStatusRejectsInvalidTransitionFromTerminalStatus() {
        when(userRepository.findById("admin-1")).thenReturn(Optional.of(admin));
        when(reportRepository.findById("report-1")).thenReturn(Optional.of(report("RESOLVED")));
        UpdateReportStatusRequest request = new UpdateReportStatusRequest();
        request.setStatus("REVIEWING");
        request.setAdminNote("Đã xác minh");

        assertThrows(BadRequestException.class,
                () -> service.updateStatus("admin-1", "report-1", request));
    }

    @Test
    void updateStatusAppliesDefaultAdminNoteWhenClosingIfBlank() {
        when(userRepository.findById("admin-1")).thenReturn(Optional.of(admin));
        when(reportRepository.findById("report-1")).thenReturn(Optional.of(report("REVIEWING")));
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(job));
        when(userRepository.findById("candidate-1")).thenReturn(Optional.of(candidate));
        when(candidateProfileRepository.findByUserId("candidate-1")).thenReturn(Optional.empty());
        when(historyRepository.findByReportIdOrderByCreatedAtAsc("report-1")).thenReturn(List.of());
        UpdateReportStatusRequest request = new UpdateReportStatusRequest();
        request.setStatus("DISMISSED");
        request.setAdminNote("  ");

        ReportResponse response = service.updateStatus("admin-1", "report-1", request);
        assertEquals("DISMISSED", response.getStatus());
        assertEquals("Bác bỏ báo cáo vi phạm.", response.getAdminNote());
    }

    @Test
    void updateStatusFromReviewingToResolvedSavesNoteAndHistory() {
        when(userRepository.findById("admin-1")).thenReturn(Optional.of(admin));
        Report report = report("REVIEWING");
        when(reportRepository.findById("report-1")).thenReturn(Optional.of(report));
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(job));
        when(userRepository.findById("candidate-1")).thenReturn(Optional.of(candidate));
        when(candidateProfileRepository.findByUserId("candidate-1")).thenReturn(Optional.empty());
        when(historyRepository.findByReportIdOrderByCreatedAtAsc("report-1")).thenReturn(List.of());
        UpdateReportStatusRequest request = new UpdateReportStatusRequest();
        request.setStatus("RESOLVED");
        request.setAdminNote("  Đã đối chiếu bằng chứng  ");

        ReportResponse response = service.updateStatus("admin-1", "report-1", request);

        assertEquals("RESOLVED", response.getStatus());
        assertEquals("Đã đối chiếu bằng chứng", response.getAdminNote());
        ArgumentCaptor<Report> captor = ArgumentCaptor.forClass(Report.class);
        verify(reportRepository).save(captor.capture());
        assertEquals("RESOLVED", captor.getValue().getStatus());
        verify(historyRepository).save(argThat(h -> "REVIEWING".equals(h.getFromStatus())
                && "RESOLVED".equals(h.getToStatus())));
    }

    private Report report(String status) {
        return Report.builder().id("report-1").jobId("job-1").reporterId("candidate-1")
                .reason("Lý do khác").description("Chi tiết").status(status)
                .createdAt(LocalDateTime.now()).build();
    }
}
