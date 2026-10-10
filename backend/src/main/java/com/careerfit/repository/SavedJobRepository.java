package com.careerfit.repository;

import com.careerfit.model.SavedJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SavedJobRepository extends JpaRepository<SavedJob, String> {
    List<SavedJob> findByCandidateUserId(String candidateUserId);
    Optional<SavedJob> findByCandidateUserIdAndJobId(String candidateUserId, String jobId);
    boolean existsByCandidateUserIdAndJobId(String candidateUserId, String jobId);
    void deleteByCandidateUserIdAndJobId(String candidateUserId, String jobId);
}
