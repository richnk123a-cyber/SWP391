package com.careerfit.repository;

import com.careerfit.model.CandidateTopicProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface CandidateTopicProgressRepository extends JpaRepository<CandidateTopicProgress, String> {
    List<CandidateTopicProgress> findByUserId(String userId);
    Optional<CandidateTopicProgress> findByUserIdAndTopicId(String userId, String topicId);
    void deleteByUserId(String userId);
}
