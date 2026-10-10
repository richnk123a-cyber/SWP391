package com.careerfit.service;

import com.careerfit.dto.*;
import com.careerfit.exception.BadRequestException;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.*;
import com.careerfit.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class JobService {

    private final JobRepository jobRepository;
    private final ApplicationRepository applicationRepository;
    private final SavedJobRepository savedJobRepository;
    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyRepository companyRepository;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    // ===== PUBLIC: Tìm kiếm / lấy danh sách job (không cần login) =====
    public List<JobResponse> searchJobs(String keyword, String location, String category) {
        return jobRepository.searchJobs(keyword, location, category)
                .stream()
                .map(j -> mapToJobResponse(j, null))
                .collect(Collectors.toList());
    }

    // ===== PUBLIC: Lấy chi tiết 1 job =====
    public JobResponse getJobById(String jobId, String currentUserEmail) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        String userId = null;
        if (currentUserEmail != null) {
            userId = userRepository.findById(currentUserEmail.toLowerCase())
                    .map(User::getId).orElse(null);
        }
        return mapToJobResponse(job, userId);
    }

    // ===== EMPLOYER: Đăng tin mới =====
    @Transactional
    public JobResponse postJob(String employerEmail, PostJobRequest request) {
        User employer = userRepository.findById(employerEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Company company = companyRepository.findByOwnerUserId(employer.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin công ty."));

        // Kiểm tra công ty đã được xác minh chưa (UC17)
        if (!"Verified".equals(company.getVerificationStatus())) {
            throw new BadRequestException(
                "Tài khoản doanh nghiệp chưa được xác minh. Vui lòng chờ Admin xác minh trước khi đăng tin.",
                "verificationStatus"
            );
        }

        Job newJob = Job.builder()
                .id("job-" + UUID.randomUUID().toString().substring(0, 8))
                // .companyName(company.getCompanyName())
                .employerId(employer.getId())
                .title(request.getTitle().trim())
                .category(request.getCategory().trim())
                .jobType(request.getJobType().trim())
                .location(request.getLocation().trim())
                .salary(request.getSalary().trim())
                // .postedDate(LocalDate.now().format(DATE_FORMAT))
                .description(request.getDescription())
                .responsibilities(request.getResponsibilities())
                .requirements(request.getRequirements())
                // .requiredSkills(request.getRequiredSkills())
                // .preferredSkills(request.getPreferredSkills())
                .deadline(request.getDeadline())
                .verificationStatus("Pending") // Admin phải duyệt tin trước khi hiện
                .build();

        jobRepository.save(newJob);
        log.info("New job posted by employer=[{}]: title=[{}]", employerEmail, newJob.getTitle());
        return mapToJobResponse(newJob, null);
    }

    // ===== EMPLOYER: Lấy danh sách tin của mình =====
    public List<JobResponse> getMyJobs(String employerEmail) {
        User employer = userRepository.findById(employerEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        return jobRepository.findByEmployerId(employer.getId())
                .stream()
                .map(j -> mapToJobResponse(j, null))
                .collect(Collectors.toList());
    }

    // ===== CANDIDATE: Nộp đơn ứng tuyển =====
    @Transactional
    public ApplicationResponse applyJob(String candidateEmail, String jobId) {
        User candidate = userRepository.findById(candidateEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        // Kiểm tra đã nộp chưa
        if (applicationRepository.existsByJobIdAndCandidateId(jobId, candidate.getId())) {
            throw new BadRequestException("Bạn đã nộp đơn vào vị trí này rồi.", "jobId");
        }

        CandidateProfile profile = candidateProfileRepository.findByUserId(candidate.getId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy hồ sơ ứng viên."));

        String today = LocalDate.now().format(DATE_FORMAT);
        Application app = Application.builder()
                .id("app-" + UUID.randomUUID().toString().substring(0, 8))
                .jobId(jobId)
                .candidateId(candidate.getId())
                // .candidateName(profile.getFullName())
                // .candidateEmail(profile.getEmail())
                // .candidateUniversity(profile.getUniversity() != null ? profile.getUniversity() : "")
                // .appliedDate(today)
                // .lastUpdate(today)
                .status("Đã nộp")
                .build();

        applicationRepository.save(app);
        log.info("Candidate=[{}] applied for job=[{}]", candidateEmail, jobId);
        return mapToApplicationResponse(app);
    }

    // ===== CANDIDATE: Xem lịch sử nộp đơn =====
    public List<ApplicationResponse> getMyApplications(String candidateEmail) {
        User candidate = userRepository.findById(candidateEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        return applicationRepository.findByCandidateId(candidate.getId())
                .stream()
                .map(this::mapToApplicationResponse)
                .collect(Collectors.toList());
    }

    // ===== CANDIDATE: Lưu / bỏ lưu job =====
    @Transactional
    public String toggleSaveJob(String candidateEmail, String jobId) {
        User candidate = userRepository.findById(candidateEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        if (!jobRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Không tìm thấy tin tuyển dụng.");
        }

        if (savedJobRepository.existsByCandidateUserIdAndJobId(candidate.getId(), jobId)) {
            savedJobRepository.deleteByCandidateUserIdAndJobId(candidate.getId(), jobId);
            return "Đã bỏ lưu tin tuyển dụng.";
        } else {
            SavedJob savedJob = SavedJob.builder()
                    .id("sj-" + UUID.randomUUID().toString().substring(0, 8))
                    .candidateUserId(candidate.getId())
                    .jobId(jobId)
                    .build();
            savedJobRepository.save(savedJob);
            return "Đã lưu tin tuyển dụng.";
        }
    }

    // ===== EMPLOYER: Xem danh sách ứng viên đã nộp vào job của mình =====
    public List<ApplicationResponse> getApplicationsByJobId(String employerEmail, String jobId) {
        User employer = userRepository.findById(employerEmail.toLowerCase())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        // Bảo mật: chỉ employer sở hữu job mới được xem
        if (!employer.getId().equals(job.getEmployerId())) {
            throw new BadRequestException("Bạn không có quyền xem thông tin này.");
        }

        return applicationRepository.findByJobId(jobId)
                .stream()
                .map(this::mapToApplicationResponse)
                .collect(Collectors.toList());
    }

    // ===== Helper mappers =====
    private JobResponse mapToJobResponse(Job j, String currentUserId) {
        boolean isSaved = currentUserId != null &&
                savedJobRepository.existsByCandidateUserIdAndJobId(currentUserId, j.getId());
        String compName = companyRepository.findByOwnerUserId(j.getEmployerId())
                .map(Company::getCompanyName)
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
                // .postedDate(j.getPostedDate())
                .description(j.getDescription())
                .responsibilities(j.getResponsibilities())
                .requirements(j.getRequirements())
                // .requiredSkills(j.getRequiredSkills())
                // .preferredSkills(j.getPreferredSkills())
                .deadline(j.getDeadline())
                .verificationStatus(j.getVerificationStatus())
                .isSaved(isSaved)
                .build();
    }

    private ApplicationResponse mapToApplicationResponse(Application a) {
        return ApplicationResponse.builder()
                .id(a.getId())
                .jobId(a.getJobId())
                .candidateId(a.getCandidateId())
                // .candidateName(a.getCandidateName())
                // .candidateEmail(a.getCandidateEmail())
                // .candidateUniversity(a.getCandidateUniversity())
                // .appliedDate(a.getAppliedDate())
                // .lastUpdate(a.getLastUpdate())
                .status(a.getStatus())
                // .interviewDate(a.getInterviewDate())
                .interviewTime(a.getInterviewTime())
                .meetingLink(a.getMeetingLink())
                .interviewNote(a.getInterviewNote())
                .build();
    }
}
