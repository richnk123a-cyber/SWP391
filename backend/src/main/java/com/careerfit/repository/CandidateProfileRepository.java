package com.careerfit.repository;

import com.careerfit.model.CandidateProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CandidateProfileRepository extends JpaRepository<CandidateProfile, String> {
    Optional<CandidateProfile> findByUserId(String userId);
    boolean existsByPhone(String phone);
}
