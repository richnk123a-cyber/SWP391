package com.careerfit.service;

import com.careerfit.dto.*;
import com.careerfit.exception.BadRequestException;
import com.careerfit.exception.ConflictException;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.*;
import com.careerfit.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ReportService {
    public static final String PENDING = "PENDING";
    public static final String REVIEWING = "REVIEWING";
    public static final String RESOLVED = "RESOLVED";
    public static final String DISMISSED = "DISMISSED";
    public static final String OTHER_REASON = "Lý do khác";

    public static final Set<String> ALLOWED_REASONS = Set.of(
            "Thông tin công việc không chính xác",
            "Có dấu hiệu lừa đảo, yêu cầu nộp cọc/học phí",
            "Yêu cầu thanh toán tiền mua thiết bị/đồng phục",
            "Nội dung không phù hợp hoặc phân biệt đối xử",
            OTHER_REASON
    );

    private static final List<String> OPEN_STATUSES = List.of(PENDING, REVIEWING);
    private static final Set<String> ALL_STATUSES = Set.of(PENDING, REVIEWING, RESOLVED, DISMISSED);

    private final ReportRepository reportRepository;
    private final ReportStatusHistoryRepository historyRepository;
    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final CandidateProfileRepository candidateProfileRepository;

    @Transactional
    public ReportResponse createReport(String candidateId, String jobId, CreateReportRequest request) {
        User candidate = requireUser(candidateId);
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        String reason = request.getReason().trim();
        String description = normalizeOptional(request.getDescription());
        if (!ALLOWED_REASONS.contains(reason)) {
            throw new BadRequestException("Lý do báo cáo không thuộc danh sách được hỗ trợ.", "reason");
        }
        if (OTHER_REASON.equals(reason) && description == null) {
            throw new BadRequestException("Vui lòng nhập mô tả chi tiết khi chọn Lý do khác.", "description");
        }
        if (reportRepository.existsByJobIdAndReporterIdAndStatusIn(jobId, candidate.getId(), OPEN_STATUSES)) {
            throw new ConflictException("Bạn đã có một báo cáo đang được xử lý cho tin tuyển dụng này.", "jobId");
        }

        LocalDateTime now = LocalDateTime.now();
        Report report = Report.builder()
                .id("rep-" + UUID.randomUUID())
                .jobId(jobId)
                .reporterId(candidate.getId())
                .reason(reason)
                .description(description)
                .status(PENDING)
                .createdAt(now)
                .build();
        try {
            reportRepository.saveAndFlush(report);
        } catch (DataIntegrityViolationException ex) {
            throw new ConflictException("Bạn đã có một báo cáo đang được xử lý cho tin tuyển dụng này.", "jobId");
        }

        historyRepository.save(ReportStatusHistory.builder()
                .id("rsh-" + UUID.randomUUID())
                .reportId(report.getId())
                .toStatus(PENDING)
                .changedBy(candidate.getId())
                .createdAt(now)
                .build());
        return mapToResponse(report, job, candidate, true);
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getMyReports(String candidateId, int page, int size) {
        User candidate = requireUser(candidateId);
        validatePage(page, size);
        return reportRepository.findByReporterIdOrderByCreatedAtDesc(
                        candidate.getId(), PageRequest.of(page, size))
                .map(report -> mapToResponse(report, null, candidate, true));
    }

    @Transactional(readOnly = true)
    public Page<ReportResponse> getAdminReports(String status, String keyword, int page, int size) {
        validatePage(page, size);
        String normalizedStatus = normalizeOptional(status);
        if (normalizedStatus != null) {
            normalizedStatus = normalizedStatus.toUpperCase(Locale.ROOT);
            if (!ALL_STATUSES.contains(normalizedStatus)) {
                throw new BadRequestException("Trạng thái báo cáo không hợp lệ.", "status");
            }
        }
        String normalizedKeyword = normalizeOptional(keyword);
        return reportRepository.searchForAdmin(
                        normalizedStatus,
                        normalizedKeyword,
                        PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id"))))
                .map(report -> mapToResponse(report, null, null, false));
    }

    @Transactional(readOnly = true)
    public ReportResponse getAdminReport(String reportId) {
        Report report = requireReport(reportId);
        return mapToResponse(report, null, null, true);
    }

    @Transactional
    public ReportResponse updateStatus(String adminId, String reportId, UpdateReportStatusRequest request) {
        User admin = requireUser(adminId);
        Report report = requireReport(reportId);
        String targetStatus = request.getStatus().trim().toUpperCase(Locale.ROOT);
        String adminNote = normalizeOptional(request.getAdminNote());

        if (!ALL_STATUSES.contains(targetStatus)) {
            throw new BadRequestException("Trạng thái báo cáo không hợp lệ.", "status");
        }
        validateTransition(report.getStatus(), targetStatus);
        if ((RESOLVED.equals(targetStatus) || DISMISSED.equals(targetStatus)) && adminNote == null) {
            adminNote = DISMISSED.equals(targetStatus) ? "Bác bỏ báo cáo vi phạm." : "Đã xử lý giải quyết báo cáo.";
        }

        String previousStatus = report.getStatus();
        report.setStatus(targetStatus);
        if (RESOLVED.equals(targetStatus) || DISMISSED.equals(targetStatus)) {
            report.setAdminNote(adminNote);
        }
        reportRepository.save(report);
        historyRepository.save(ReportStatusHistory.builder()
                .id("rsh-" + UUID.randomUUID())
                .reportId(report.getId())
                .fromStatus(previousStatus)
                .toStatus(targetStatus)
                .changedBy(admin.getId())
                .adminNote(adminNote)
                .createdAt(LocalDateTime.now())
                .build());
        return mapToResponse(report, null, null, true);
    }

    private void validateTransition(String current, String target) {
        boolean valid = (PENDING.equals(current) && (REVIEWING.equals(target) || RESOLVED.equals(target) || DISMISSED.equals(target)))
                || (REVIEWING.equals(current) && (RESOLVED.equals(target) || DISMISSED.equals(target)));
        if (!valid) {
            throw new BadRequestException(
                    "Không thể chuyển trạng thái báo cáo từ " + current + " sang " + target + ".",
                    "status"
            );
        }
    }

    private ReportResponse mapToResponse(Report report, Job suppliedJob, User suppliedReporter, boolean includeHistory) {
        Job job = suppliedJob != null ? suppliedJob : jobRepository.findById(report.getJobId()).orElse(null);
        User reporter = suppliedReporter != null ? suppliedReporter : userRepository.findById(report.getReporterId()).orElse(null);
        Company company = job == null ? null : companyRepository.findByOwnerUserId(job.getEmployerId()).orElse(null);
        String reporterName = reporter == null ? null : reporter.getUsername();
        if (reporter != null) {
            reporterName = candidateProfileRepository.findByUserId(reporter.getId())
                    .map(CandidateProfile::getFullName)
                    .filter(name -> name != null && !name.isBlank())
                    .orElse(reporterName);
        }

        List<ReportHistoryResponse> history = includeHistory
                ? historyRepository.findByReportIdOrderByCreatedAtAsc(report.getId()).stream()
                    .map(item -> {
                        User actor = userRepository.findById(item.getChangedBy()).orElse(null);
                        return ReportHistoryResponse.builder()
                                .id(item.getId())
                                .fromStatus(item.getFromStatus())
                                .toStatus(item.getToStatus())
                                .changedBy(item.getChangedBy())
                                .changedByEmail(actor == null ? null : actor.getEmail())
                                .adminNote(item.getAdminNote())
                                .createdAt(item.getCreatedAt())
                                .build();
                    }).toList()
                : List.of();

        return ReportResponse.builder()
                .id(report.getId())
                .jobId(report.getJobId())
                .jobTitle(job == null ? null : job.getTitle())
                .company(company == null ? null : company.getCompanyName())
                .employerId(job == null ? null : job.getEmployerId())
                .reporterId(report.getReporterId())
                .reporterName(reporterName)
                .reporterEmail(reporter == null ? null : reporter.getEmail())
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus())
                .adminNote(report.getAdminNote())
                .createdAt(report.getCreatedAt())
                .history(history)
                .build();
    }

    private User requireUser(String userId) {
        return userRepository.findById(userId)
                .or(() -> userRepository.findFirstByEmail(userId.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));
    }

    private Report requireReport(String reportId) {
        return reportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy báo cáo."));
    }

    private void validatePage(int page, int size) {
        if (page < 0) throw new BadRequestException("Trang không được nhỏ hơn 0.", "page");
        if (size < 1 || size > 100) {
            throw new BadRequestException("Số kết quả mỗi trang phải nằm trong khoảng 1 đến 100.", "size");
        }
    }

    private String normalizeOptional(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
