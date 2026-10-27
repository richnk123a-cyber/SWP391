package com.careerfit.repository;

import com.careerfit.model.AiLearnedKnowledge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface AiLearnedKnowledgeRepository extends JpaRepository<AiLearnedKnowledge, String> {

    /**
     * Tra cứu kiến thức theo mã hash câu hỏi
     */
    Optional<AiLearnedKnowledge> findByQueryHash(String queryHash);

    /**
     * Lấy toàn bộ các kiến thức còn hạn sử dụng
     */
    @Query("SELECT k FROM AiLearnedKnowledge k WHERE k.expiresAt IS NULL OR k.expiresAt > :now")
    List<AiLearnedKnowledge> findActiveKnowledge(@Param("now") LocalDateTime now);

    /**
     * Dọn dẹp các bản ghi tri thức đã quá hạn TTL
     */
    @Modifying
    @Query("DELETE FROM AiLearnedKnowledge k WHERE k.expiresAt IS NOT NULL AND k.expiresAt <= :now")
    int deleteExpiredKnowledge(@Param("now") LocalDateTime now);

    /**
     * Tìm theo chủ đề
     */
    List<AiLearnedKnowledge> findByTopicIgnoreCase(String topic);
}
