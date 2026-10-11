package com.careerfit.service;

import com.careerfit.dto.JobResponse;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.Company;
import com.careerfit.model.Job;
import com.careerfit.repository.CompanyRepository;
import com.careerfit.repository.JobRepository;
import com.careerfit.repository.SavedJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminJobService {

    private final JobRepository jobRepository;
    private final CompanyRepository companyRepository;
    private final SavedJobRepository savedJobRepository;
    private final com.careerfit.repository.UserRepository userRepository;

    // ===== Lấy tất cả tin tuyển dụng (Admin view) =====
    public List<JobResponse> getAllJobs() {
        return jobRepository.findAll()
                .stream()
                .map(j -> mapToJobResponse(j))
                .collect(Collectors.toList());
    }

    // ===== Lấy tin theo trạng thái =====
    public List<JobResponse> getJobsByStatus(String status) {
        return jobRepository.findByVerificationStatus(status)
                .stream()
                .map(j -> mapToJobResponse(j))
                .collect(Collectors.toList());
    }

    // ===== Phê duyệt tin tuyển dụng =====
    @Transactional
    public JobResponse approveJob(String jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng với ID: " + jobId));

        job.setVerificationStatus("Verified");
        job.setRejectionReason(null);
        job = jobRepository.save(job);
        log.info("Admin approved job=[{}] title=[{}]", jobId, job.getTitle());
        return mapToJobResponse(job);
    }

    // ===== Từ chối tin tuyển dụng =====
    @Transactional
    public JobResponse rejectJob(String jobId, String reason) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng với ID: " + jobId));

        job.setVerificationStatus("Rejected");
        job.setRejectionReason(reason);
        job = jobRepository.save(job);
        log.info("Admin rejected job=[{}] reason=[{}]", jobId, reason);
        return mapToJobResponse(job);
    }

    // ===== Gỡ bỏ tin tuyển dụng =====
    @Transactional
    public void removeJob(String jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng với ID: " + jobId));

        jobRepository.delete(job);
        log.info("Admin removed job=[{}]", jobId);
    }

    // ===== Helper mapper =====
    private JobResponse mapToJobResponse(Job j) {
        String compName = companyRepository.findByOwnerUserId(j.getEmployerId())
                .map(Company::getCompanyName)
                .or(() -> userRepository.findById(j.getEmployerId())
                        .flatMap(u -> companyRepository.findFirstByEmail(u.getEmail().toLowerCase()))
                        .map(Company::getCompanyName))
                .orElse("");
        return JobResponse.builder()
                .id(j.getId())
                .companyName(compName)
                .employerId(j.getEmployerId())
                .title(j.getTitle())
                .category(j.getCategory())
                .jobType(j.getJobType())
                .location(j.getLocation())
                .salary(j.getSalary())
                .description(j.getDescription())
                .responsibilities(j.getResponsibilities())
                .requirements(j.getRequirements())
                .deadline(j.getDeadline())
                .verificationStatus(j.getVerificationStatus())
                .rejectionReason(j.getRejectionReason())
                .isSaved(false)
                .build();
    }
}
