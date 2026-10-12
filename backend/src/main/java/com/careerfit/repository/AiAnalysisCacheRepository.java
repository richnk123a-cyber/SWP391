package com.careerfit.repository;

import com.careerfit.model.AiAnalysisCache;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AiAnalysisCacheRepository extends JpaRepository<AiAnalysisCache, String> {
    Optional<AiAnalysisCache> findByCandidateIdAndJobId(String candidateId, String jobId);
    java.util.List<AiAnalysisCache> findByJobId(String jobId);
    java.util.List<AiAnalysisCache> findByCandidateId(String candidateId);
}

