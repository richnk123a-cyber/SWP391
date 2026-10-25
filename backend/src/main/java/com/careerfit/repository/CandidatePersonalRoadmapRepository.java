package com.careerfit.repository;

import com.careerfit.model.CandidatePersonalRoadmap;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CandidatePersonalRoadmapRepository extends JpaRepository<CandidatePersonalRoadmap, String> {
    List<CandidatePersonalRoadmap> findByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<CandidatePersonalRoadmap> findByIdAndUserId(String id, String userId);
    void deleteByUserIdAndJobId(String userId, String jobId);
    void deleteByUserId(String userId);
}
