package com.careerfit.service;

import com.careerfit.dto.*;
import com.careerfit.model.*;
import com.careerfit.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
public class RoadmapAndApplicationStatusTest {

    @Mock
    private JobRepository jobRepository;
    @Mock
    private ApplicationRepository applicationRepository;
    @Mock
    private SavedJobRepository savedJobRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CandidateProfileRepository candidateProfileRepository;
    @Mock
    private CompanyRepository companyRepository;
    @Mock
    private SkillRepository skillRepository;

    @InjectMocks
    private JobService jobService;

    @Mock
    private CandidatePersonalRoadmapRepository personalRoadmapRepository;
    @Mock
    private CandidateTopicProgressRepository topicProgressRepository;
    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private CandidateRoadmapService candidateRoadmapService;

    private User employerUser;
    private User candidateUser;
    private Job testJob;
    private Application testApp;

    @BeforeEach
    void setUp() {
        employerUser = User.builder()
                .id("user-emp-1")
                .email("employer@gmail.com")
                .username("employer")
                .role("EMPLOYER")
                .build();

        candidateUser = User.builder()
                .id("user-cand-1")
                .email("candidate@gmail.com")
                .username("candidate")
                .role("CANDIDATE")
                .build();

        testJob = Job.builder()
                .id("job-1")
                .employerId("user-emp-1")
                .title("Java Backend Engineer")
                .category("Backend")
                .jobType("Full-time")
                .location("TP.HCM")
                .salary("15-20 Triệu")
                .build();

        testApp = Application.builder()
                .id("app-1")
                .jobId("job-1")
                .candidateId("user-cand-1")
                .status("Đã nộp")
                .appliedDate(LocalDateTime.now())
                .lastUpdate(LocalDateTime.now())
                .build();
    }

    // =========================================================================
    // 1. TEST APPLICATION STATUS UPDATE (LƯU & CẬP NHẬT TRẠNG THÁI ĐƠN ỨNG TUYỂN)
    // =========================================================================

    @Test
    void testUpdateApplicationStatus_Success() {
        when(userRepository.findById("employer@gmail.com")).thenReturn(Optional.of(employerUser));
        when(applicationRepository.findById("app-1")).thenReturn(Optional.of(testApp));
        when(jobRepository.findById("job-1")).thenReturn(Optional.of(testJob));
        when(applicationRepository.save(any(Application.class))).thenAnswer(i -> i.getArgument(0));

        UpdateApplicationStatusRequest req = UpdateApplicationStatusRequest.builder()
                .status("Phỏng vấn")
                .interviewTime("14:30 - 15:30")
                .interviewDate("Thứ 5, 25/10/2026")
                .interviewType("Online (Google Meet)")
                .meetingLink("https://meet.google.com/test-meet")
                .interviewNote("Chuẩn bị bài thuyết trình 5 phút")
                .build();

        ApplicationResponse res = jobService.updateApplicationStatus("employer@gmail.com", "app-1", req);

        assertNotNull(res);
        assertEquals("Phỏng vấn", res.getStatus());
        assertTrue(res.getInterviewTime().contains("14:30"));
        assertEquals("https://meet.google.com/test-meet", res.getMeetingLink());
        assertTrue(res.getInterviewNote().contains("[Online (Google Meet)]"));
        assertNotNull(res.getInterviewDetails());
        assertEquals("https://meet.google.com/test-meet", res.getInterviewDetails().getMeetingLink());

        verify(applicationRepository, times(1)).save(any(Application.class));
    }

    @Test
    void testGetMyApplications_ReturnsWithInterviewDetails() {
        testApp.setStatus("Phỏng vấn");
        testApp.setInterviewTime("14:30 - 15:30, Thứ 5 25/10/2026");
        testApp.setMeetingLink("https://meet.google.com/test-meet");
        testApp.setInterviewNote("[Online] Trao đổi đồ án");

        when(userRepository.findById("candidate@gmail.com")).thenReturn(Optional.of(candidateUser));
        when(candidateProfileRepository.findByUserId("user-cand-1")).thenReturn(Optional.empty());
        when(applicationRepository.findByCandidateId("user-cand-1")).thenReturn(List.of(testApp));

        List<ApplicationResponse> list = jobService.getMyApplications("candidate@gmail.com");

        assertNotNull(list);
        assertEquals(1, list.size());
        ApplicationResponse appRes = list.get(0);
        assertEquals("Phỏng vấn", appRes.getStatus());
        assertEquals("https://meet.google.com/test-meet", appRes.getMeetingLink());
        assertNotNull(appRes.getInterviewDetails());
        assertEquals("Online", appRes.getInterviewDetails().getType());
    }

    @Test
    void testGetApplicationsForEmployer_Success() {
        when(userRepository.findById("employer@gmail.com")).thenReturn(Optional.of(employerUser));
        when(jobRepository.findByEmployerIdIn(anyList())).thenReturn(List.of(testJob));
        when(applicationRepository.findByJobId("job-1")).thenReturn(List.of(testApp));

        List<ApplicationResponse> list = jobService.getApplicationsForEmployer("employer@gmail.com");

        assertNotNull(list);
        assertEquals(1, list.size());
        assertEquals("app-1", list.get(0).getId());
    }

    // =========================================================================
    // 2. TEST CANDIDATE ROADMAP & TOPIC PROGRESS (LỘ TRÌNH CÁ NHÂN & TIẾN ĐỘ)
    // =========================================================================

    @Test
    void testSavePersonalRoadmap_Success() {
        when(userRepository.findById("candidate@gmail.com")).thenReturn(Optional.of(candidateUser));
        when(personalRoadmapRepository.findByIdAndUserId(anyString(), anyString())).thenReturn(Optional.empty());
        when(personalRoadmapRepository.save(any(CandidatePersonalRoadmap.class))).thenAnswer(i -> i.getArgument(0));

        RoadmapTopicDto t1 = RoadmapTopicDto.builder()
                .id("tp-p-1")
                .title("1. Spring Data JPA")
                .estimatedTime("5 giờ")
                .completed(false)
                .build();

        PersonalRoadmapDto dto = PersonalRoadmapDto.builder()
                .id("personal-rd-job-1")
                .jobId("job-1")
                .jobTitle("Java Backend Engineer")
                .company("FPT Software")
                .skillName("Spring Boot")
                .targetRole("Backend Dev")
                .description("Lộ trình học thử nghiệm")
                .matchPercentage(75)
                .topics(List.of(t1))
                .build();

        PersonalRoadmapDto saved = candidateRoadmapService.savePersonalRoadmap("candidate@gmail.com", dto);

        assertNotNull(saved);
        assertEquals("personal-rd-job-1", saved.getId());
        assertEquals("Java Backend Engineer", saved.getJobTitle());
        assertEquals(1, saved.getTopics().size());
        assertEquals("1. Spring Data JPA", saved.getTopics().get(0).getTitle());

        verify(personalRoadmapRepository, times(1)).save(any(CandidatePersonalRoadmap.class));
    }

    @Test
    void testToggleTopicProgress_Success() {
        when(userRepository.findById("candidate@gmail.com")).thenReturn(Optional.of(candidateUser));
        when(topicProgressRepository.findByUserIdAndTopicId("user-cand-1", "tp-p-1")).thenReturn(Optional.empty());
        when(topicProgressRepository.save(any(CandidateTopicProgress.class))).thenAnswer(i -> i.getArgument(0));

        ToggleTopicProgressRequest req = ToggleTopicProgressRequest.builder()
                .roadmapId("personal-rd-job-1")
                .topicId("tp-p-1")
                .completed(true)
                .title("1. Spring Data JPA")
                .skillName("Spring Boot")
                .build();

        CandidateTopicProgress prog = candidateRoadmapService.toggleTopic("candidate@gmail.com", req);

        assertNotNull(prog);
        assertEquals("user-cand-1", prog.getUserId());
        assertEquals("tp-p-1", prog.getTopicId());
        assertTrue(prog.getCompleted());

        verify(topicProgressRepository, times(1)).save(any(CandidateTopicProgress.class));
    }

    @Test
    void testGetPersonalRoadmaps_DeserializesCorrectly() {
        CandidatePersonalRoadmap entity = CandidatePersonalRoadmap.builder()
                .id("personal-rd-job-1")
                .userId("user-cand-1")
                .jobId("job-1")
                .jobTitle("Java Developer")
                .company("FPT")
                .skillName("Java")
                .targetRole("Junior Dev")
                .matchPercentage(80)
                .topicsJson("[{\"id\":\"tp-1\",\"title\":\"Java Core\",\"completed\":true}]")
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        when(userRepository.findById("candidate@gmail.com")).thenReturn(Optional.of(candidateUser));
        when(personalRoadmapRepository.findByUserIdOrderByUpdatedAtDesc("user-cand-1")).thenReturn(List.of(entity));

        List<PersonalRoadmapDto> list = candidateRoadmapService.getPersonalRoadmaps("candidate@gmail.com");

        assertNotNull(list);
        assertEquals(1, list.size());
        PersonalRoadmapDto r = list.get(0);
        assertEquals("personal-rd-job-1", r.getId());
        assertEquals(1, r.getTopics().size());
        assertEquals("Java Core", r.getTopics().get(0).getTitle());
        assertTrue(r.getTopics().get(0).getCompleted());
    }
}
