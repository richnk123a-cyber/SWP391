package com.careerfit.service;

import com.careerfit.dto.*;
import com.careerfit.exception.BadRequestException;
import com.careerfit.exception.ResourceNotFoundException;
import com.careerfit.model.*;
import com.careerfit.repository.*;
import com.careerfit.repository.specification.JobSpecifications;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
    private final SkillRepository skillRepository;

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String DEFAULT_SALARY_CURRENCY = "VNĐ";
    private static final Pattern SALARY_NUMBER_PATTERN = Pattern.compile("\\d{1,3}(?:\\.\\d{3})+|\\d+");

    // ===== PUBLIC: Tìm kiếm / lấy danh sách job cũ (không cần login) =====
    public List<JobResponse> searchJobs(String keyword, String location, String category) {
        return jobRepository.searchJobs(keyword, location, category)
                .stream()
                .map(j -> mapToJobResponse(j, null))
                .collect(Collectors.toList());
    }

    // ===== PUBLIC: Tìm kiếm và lọc nâng cao đa tiêu chí + phân trang =====
    @Transactional(readOnly = true)
    public Page<JobResponse> searchJobs(
            String keyword,
            String location,
            String category,
            String jobType,
            Long minSalary,
            Long maxSalary,
            String sortBy,
            int page,
            int size) {
        if (page < 0) {
            throw new BadRequestException("Trang tìm kiếm không được nhỏ hơn 0.", "page");
        }
        if (size < 1 || size > 100) {
            throw new BadRequestException("Số kết quả mỗi trang phải nằm trong khoảng 1 đến 100.", "size");
        }
        validateSalaryRange(minSalary, maxSalary);

        String normalizedKeyword = normalizeSearchValue(keyword);
        String normalizedLocation = normalizeSearchValue(location);
        String normalizedCategory = normalizeSearchValue(category);
        String normalizedJobType = normalizeSearchValue(jobType);
        Pageable pageable = PageRequest.of(
                page,
                size,
                resolveSearchSort(sortBy)
        );

        Page<Job> jobPage = jobRepository.findAll(JobSpecifications.publicSearch(
                normalizedKeyword,
                normalizedLocation,
                normalizedCategory,
                normalizedJobType,
                minSalary,
                maxSalary,
                DEFAULT_SALARY_CURRENCY
        ), pageable);

        Set<String> employerIds = jobPage.getContent().stream()
                .map(Job::getEmployerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<String, String> companyNamesByEmployer = employerIds.isEmpty()
                ? Map.of()
                : companyRepository.findByOwnerUserIdIn(employerIds)
                    .stream()
                    .collect(Collectors.toMap(
                            Company::getOwnerUserId,
                            Company::getCompanyName,
                            (first, ignored) -> first
                    ));

        return jobPage.map(job -> mapToJobResponse(
                job,
                null,
                companyNamesByEmployer.get(job.getEmployerId())
        ));
    }

    @Transactional(readOnly = true)
    public JobFilterOptionsResponse getFilterOptions() {
        return JobFilterOptionsResponse.builder()
                .categories(jobRepository.findPublicCategories())
                .jobTypes(jobRepository.findPublicJobTypes())
                .locations(jobRepository.findPublicLocations())
                .build();
    }

    private void validateSalaryRange(Long minSalary, Long maxSalary) {
        if (minSalary != null && minSalary < 0) {
            throw new BadRequestException("Lương tối thiểu không được là số âm.", "minSalary");
        }
        if (maxSalary != null && maxSalary < 0) {
            throw new BadRequestException("Lương tối đa không được là số âm.", "maxSalary");
        }
        if (minSalary != null && maxSalary != null && minSalary > maxSalary) {
            throw new BadRequestException("Lương tối thiểu không được lớn hơn lương tối đa.", "minSalary");
        }
    }

    private Sort resolveSearchSort(String sortBy) {
        if ("salary-high".equalsIgnoreCase(normalizeSearchValue(sortBy))) {
            return Sort.by(
                    Sort.Order.desc("salaryMax").nullsLast(),
                    Sort.Order.desc("postedDate").nullsLast(),
                    Sort.Order.asc("id")
            );
        }
        return Sort.by(Sort.Order.desc("postedDate").nullsLast(), Sort.Order.asc("id"));
    }

    private String normalizeSearchValue(String value) {
        if (value == null) return null;
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }

    // ===== PUBLIC: Lấy chi tiết 1 job =====
    public JobResponse getJobById(String jobId, String currentUserEmail) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        String userId = null;
        if (currentUserEmail != null) {
            userId = userRepository.findById(currentUserEmail.toLowerCase())
                    .or(() -> userRepository.findFirstByEmail(currentUserEmail.toLowerCase()))
                    .map(User::getId).orElse(null);
        }
        return mapToJobResponse(job, userId);
    }

    private List<Skill> resolveSkills(String skillsStr) {
        if (skillsStr == null || skillsStr.isBlank()) {
            return Collections.emptyList();
        }
        List<String> names = Arrays.stream(skillsStr.split("[,;\n]"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .distinct()
                .collect(Collectors.toList());
        List<Skill> result = new ArrayList<>();
        for (String name : names) {
            Skill skill = skillRepository.findByNameIgnoreCase(name)
                    .orElseGet(() -> skillRepository.save(Skill.builder()
                            .id("skill-" + UUID.randomUUID().toString().substring(0, 8))
                            .name(name)
                            .category("Technical")
                            .isActive(true)
                            .build()));
            result.add(skill);
        }
        return result;
    }

    // ===== EMPLOYER: Đăng tin mới =====
    @Transactional
    public JobResponse postJob(String employerEmail, PostJobRequest request) {
        User employer = userRepository.findById(employerEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(employerEmail.toLowerCase()))
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

        SalaryRange salaryRange = resolveSalaryRange(request);
        List<Skill> jobSkills = resolveSkills(request.getRequiredSkills());
        Job newJob = Job.builder()
                .id("job-" + UUID.randomUUID().toString().substring(0, 8))
                .employerId(employer.getId())
                .title(request.getTitle().trim())
                .category(request.getCategory().trim())
                .jobType(request.getJobType().trim())
                .location(request.getLocation().trim())
                .salary(request.getSalary().trim())
                .salaryMin(salaryRange.min())
                .salaryMax(salaryRange.max())
                .salaryCurrency(salaryRange.currency())
                .postedDate(LocalDateTime.now())
                .description(request.getDescription())
                .responsibilities(request.getResponsibilities())
                .requirements(request.getRequirements())
                .skills(jobSkills)
                .deadline(request.getDeadline())
                .verificationStatus("Pending") // Admin phải duyệt tin trước khi hiện
                .isVisible(true)
                .build();

        jobRepository.save(newJob);
        log.info("New job posted by employer=[{}]: title=[{}]", employerEmail, newJob.getTitle());
        return mapToJobResponse(newJob, null);
    }

    // ===== Helper: Lấy tập hợp tất cả các identifier hợp lệ của Employer =====
    private Set<String> getValidEmployerIds(User employer) {
        Set<String> ids = new HashSet<>();
        ids.add(employer.getId());
        if (employer.getEmail() != null && !employer.getEmail().isBlank()) {
            List<User> sameEmailUsers = userRepository.findAllByEmail(employer.getEmail().toLowerCase());
            for (User u : sameEmailUsers) {
                ids.add(u.getId());
            }
            List<Company> userCompanies = companyRepository.findAllByEmail(employer.getEmail().toLowerCase());
            for (Company c : userCompanies) {
                if (c.getOwnerUserId() != null) {
                    ids.add(c.getOwnerUserId());
                }
            }
        }
        return ids;
    }

    // ===== EMPLOYER: Lấy danh sách tin của mình =====
    public List<JobResponse> getMyJobs(String employerEmail) {
        User employer = userRepository.findById(employerEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(employerEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Set<String> validIds = getValidEmployerIds(employer);
        return jobRepository.findByEmployerIdIn(List.copyOf(validIds))
                .stream()
                .map(j -> mapToJobResponse(j, null))
                .collect(Collectors.toList());
    }

    // ===== EMPLOYER: Cập nhật / Chỉnh sửa tin tuyển dụng =====
    @Transactional
    public JobResponse updateJob(String employerEmail, String jobId, PostJobRequest request) {
        User employer = userRepository.findById(employerEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(employerEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        Set<String> validIds = getValidEmployerIds(employer);
        if (!validIds.contains(job.getEmployerId())) {
            throw new BadRequestException("Bạn không có quyền chỉnh sửa tin tuyển dụng này.");
        }

        // Điều kiện 1: Tin tuyển dụng đã có người ứng tuyển thì KHÔNG ĐƯỢC SỬA
        List<Application> apps = applicationRepository.findByJobId(jobId);
        if (apps != null && !apps.isEmpty()) {
            throw new BadRequestException("Tin tuyển dụng đã có người nộp hồ sơ ứng tuyển nên không thể chỉnh sửa.");
        }

        SalaryRange salaryRange = resolveSalaryRange(request);
        job.setTitle(request.getTitle().trim());
        job.setCategory(request.getCategory().trim());
        job.setJobType(request.getJobType().trim());
        job.setLocation(request.getLocation().trim());
        job.setSalary(request.getSalary().trim());
        job.setSalaryMin(salaryRange.min());
        job.setSalaryMax(salaryRange.max());
        job.setSalaryCurrency(salaryRange.currency());
        job.setDescription(request.getDescription());
        job.setResponsibilities(request.getResponsibilities());
        job.setRequirements(request.getRequirements());
        if (request.getRequiredSkills() != null) {
            job.setSkills(resolveSkills(request.getRequiredSkills()));
        }
        job.setDeadline(request.getDeadline());
        
        // Điều kiện 2: Khi sửa tin thì LUÔN LUÔN gửi lại cho Admin để xác nhận (chuyển về Pending)
        job.setVerificationStatus("Pending");
        job.setRejectionReason(null);

        jobRepository.save(job);
        log.info("Employer=[{}] updated job=[{}] and submitted for admin re-verification", employerEmail, jobId);
        return mapToJobResponse(job, null);
    }

    // ===== CANDIDATE: Nộp đơn ứng tuyển =====
    @Transactional
    public ApplicationResponse applyJob(String candidateEmail, String jobId) {
        User candidate = userRepository.findById(candidateEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(candidateEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        // Kiểm tra đã nộp chưa
        if (applicationRepository.existsByJobIdAndCandidateId(jobId, candidate.getId())) {
            throw new BadRequestException("Bạn đã nộp đơn vào vị trí này rồi.", "jobId");
        }

        Application app = Application.builder()
                .id("app-" + UUID.randomUUID().toString().substring(0, 8))
                .jobId(jobId)
                .candidateId(candidate.getId())
                .appliedDate(LocalDateTime.now())
                .lastUpdate(LocalDateTime.now())
                .status("Đã nộp")
                .build();

        applicationRepository.save(app);
        log.info("Candidate=[{}] applied for job=[{}]", candidateEmail, jobId);
        return mapToApplicationResponse(app);
    }

    // ===== CANDIDATE: Xem lịch sử nộp đơn =====
    public List<ApplicationResponse> getMyApplications(String candidateEmail) {
        User candidate = userRepository.findById(candidateEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(candidateEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        return applicationRepository.findByCandidateId(candidate.getId())
                .stream()
                .map(this::mapToApplicationResponse)
                .collect(Collectors.toList());
    }

    // ===== CANDIDATE: Hủy đơn ứng tuyển =====
    @Transactional
    public void cancelApplication(String candidateEmail, String jobId) {
        User candidate = userRepository.findById(candidateEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(candidateEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        if (!jobRepository.existsById(jobId)) {
            throw new ResourceNotFoundException("Không tìm thấy tin tuyển dụng.");
        }

        if (!applicationRepository.existsByJobIdAndCandidateId(jobId, candidate.getId())) {
            throw new BadRequestException("Bạn chưa nộp đơn vào vị trí này.", "jobId");
        }

        applicationRepository.deleteByJobIdAndCandidateId(jobId, candidate.getId());
        log.info("Candidate=[{}] cancelled application for job=[{}]", candidateEmail, jobId);
    }

    // ===== CANDIDATE: Lưu / bỏ lưu job =====
    @Transactional
    public String toggleSaveJob(String candidateEmail, String jobId) {
        User candidate = userRepository.findById(candidateEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(candidateEmail.toLowerCase()))
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
                .or(() -> userRepository.findFirstByEmail(employerEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        Set<String> validIds = getValidEmployerIds(employer);
        if (!validIds.contains(job.getEmployerId())) {
            throw new BadRequestException("Bạn không có quyền xem thông tin này.");
        }

        return applicationRepository.findByJobId(jobId)
                .stream()
                .map(this::mapToApplicationResponse)
                .collect(Collectors.toList());
    }

    // ===== EMPLOYER: Xóa tin tuyển dụng =====
    @Transactional
    public void deleteJob(String employerEmail, String jobId) {
        User employer = userRepository.findById(employerEmail.toLowerCase())
                .or(() -> userRepository.findFirstByEmail(employerEmail.toLowerCase()))
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tài khoản."));

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy tin tuyển dụng."));

        // Bảo mật: chỉ employer sở hữu job mới được xóa
        Set<String> validIds = getValidEmployerIds(employer);
        if (!validIds.contains(job.getEmployerId())) {
            throw new BadRequestException("Bạn không có quyền xóa tin tuyển dụng này.");
        }

        List<Application> apps = applicationRepository.findByJobId(jobId);
        // Kiểm tra điều kiện: Nếu có ứng viên nằm trong trạng thái Đã xem hoặc Phỏng vấn thì không cho xóa
        boolean hasActiveReviewedCandidate = apps.stream().anyMatch(a -> {
            String st = a.getStatus();
            if (st == null) return false;
            String normalized = st.trim().toLowerCase();
            return normalized.contains("đã xem") || normalized.contains("viewed") ||
                   normalized.contains("phỏng vấn") || normalized.contains("interview");
        });

        if (hasActiveReviewedCandidate) {
            throw new BadRequestException("Không thể xóa tin tuyển dụng vì đang có ứng viên trong trạng thái Đã xem hoặc Phỏng vấn.");
        }

        applicationRepository.deleteAll(apps);
        savedJobRepository.deleteByCandidateUserIdAndJobId(employer.getId(), jobId);
        jobRepository.delete(job);
        log.info("Employer=[{}] successfully deleted job=[{}]", employerEmail, jobId);
    }

    // ===== Helper mappers =====
    public JobResponse mapToJobResponse(Job j, String currentUserId) {
        String compName = companyRepository.findByOwnerUserId(j.getEmployerId())
                .map(Company::getCompanyName)
                .or(() -> userRepository.findById(j.getEmployerId())
                        .flatMap(u -> companyRepository.findFirstByEmail(u.getEmail().toLowerCase()))
                        .map(Company::getCompanyName))
                .orElse("");
        return mapToJobResponse(j, currentUserId, compName);
    }

    public JobResponse mapToJobResponse(Job j, String currentUserId, String companyName) {
        boolean isSaved = currentUserId != null &&
                savedJobRepository.existsByCandidateUserIdAndJobId(currentUserId, j.getId());
        String compName = (companyName != null && !companyName.isBlank())
                ? companyName
                : companyRepository.findByOwnerUserId(j.getEmployerId())
                    .map(Company::getCompanyName)
                    .or(() -> userRepository.findById(j.getEmployerId())
                            .flatMap(u -> companyRepository.findFirstByEmail(u.getEmail().toLowerCase()))
                            .map(Company::getCompanyName))
                    .orElse("");

        String requiredSkills = j.getSkills() == null ? "" : j.getSkills().stream()
                .map(Skill::getName)
                .filter(Objects::nonNull)
                .collect(Collectors.joining(", "));

        return JobResponse.builder()
                .id(j.getId())
                .companyName(compName)
                .employerId(j.getEmployerId())
                .title(j.getTitle())
                .category(j.getCategory())
                .jobType(j.getJobType())
                .location(j.getLocation())
                .salary(j.getSalary())
                .salaryMin(j.getSalaryMin())
                .salaryMax(j.getSalaryMax())
                .salaryCurrency(j.getSalaryCurrency())
                .postedDate(j.getPostedDate() != null ? j.getPostedDate().format(DATE_FORMAT) : null)
                .description(j.getDescription())
                .responsibilities(j.getResponsibilities())
                .requirements(j.getRequirements())
                .requiredSkills(requiredSkills)
                .deadline(j.getDeadline())
                .verificationStatus(j.getVerificationStatus())
                .rejectionReason(j.getRejectionReason())
                .isSaved(isSaved)
                .build();
    }

    private SalaryRange resolveSalaryRange(PostJobRequest request) {
        Long min = request.getSalaryMin();
        Long max = request.getSalaryMax();
        if (min == null || max == null) {
            if (request.getSalary() != null) {
                Matcher matcher = SALARY_NUMBER_PATTERN.matcher(request.getSalary());
                List<Long> parsedValues = new ArrayList<>();
                while (matcher.find()) {
                    parsedValues.add(Long.parseLong(matcher.group().replace(".", "")));
                }
                if (min == null && !parsedValues.isEmpty()) min = parsedValues.get(0);
                if (max == null && parsedValues.size() > 1) max = parsedValues.get(1);
            }
        }
        if (min == null || max == null) {
            // Trường hợp không xác định được từ chuỗi (ví dụ: "Thỏa thuận")
            // Cho phép mặc định hoặc gán 0
            if (min == null) min = 0L;
            if (max == null) max = 0L;
        }
        validateSalaryRange(min, max);
        String currency = normalizeSearchValue(request.getSalaryCurrency());
        if (currency == null && request.getSalary() != null) {
            currency = request.getSalary().toUpperCase().contains("USD") ? "USD" : DEFAULT_SALARY_CURRENCY;
        }
        if (currency == null) {
            currency = DEFAULT_SALARY_CURRENCY;
        }
        currency = currency.toUpperCase();
        return new SalaryRange(min, max, currency);
    }

    private record SalaryRange(Long min, Long max, String currency) {
    }

    private ApplicationResponse mapToApplicationResponse(Application a) {
        CandidateProfile profile = a.getCandidateId() != null
                ? candidateProfileRepository.findByUserId(a.getCandidateId()).orElse(null)
                : null;
        User candidateUser = null;
        if (a.getCandidateId() != null) {
            candidateUser = userRepository.findById(a.getCandidateId())
                    .or(() -> userRepository.findFirstByEmail(a.getCandidateId().toLowerCase()))
                    .orElse(null);
        }
        String candidateName = profile != null && profile.getFullName() != null
                ? profile.getFullName()
                : (candidateUser != null ? candidateUser.getUsername() : null);
        String candidateEmail = candidateUser != null ? candidateUser.getEmail() : null;
        String candidateUniversity = profile != null ? profile.getUniversity() : null;

        return ApplicationResponse.builder()
                .id(a.getId())
                .jobId(a.getJobId())
                .candidateId(a.getCandidateId())
                .candidateName(candidateName)
                .candidateEmail(candidateEmail)
                .candidateUniversity(candidateUniversity)
                .appliedDate(a.getAppliedDate() != null ? a.getAppliedDate().format(DATE_FORMAT) : null)
                .lastUpdate(a.getLastUpdate() != null ? a.getLastUpdate().format(DATE_FORMAT) : null)
                .status(a.getStatus())
                .interviewTime(a.getInterviewTime())
                .meetingLink(a.getMeetingLink())
                .interviewNote(a.getInterviewNote())
                .build();
    }
}
