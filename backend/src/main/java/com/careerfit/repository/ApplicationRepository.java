package com.careerfit.repository;

import com.careerfit.model.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ApplicationRepository extends JpaRepository<Application, String> {
    List<Application> findByJobId(String jobId);
    List<Application> findByCandidateId(String candidateId);
    boolean existsByJobIdAndCandidateId(String jobId, String candidateId);
}
