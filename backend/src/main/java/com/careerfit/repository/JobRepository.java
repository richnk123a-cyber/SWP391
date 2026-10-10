package com.careerfit.repository;

import com.careerfit.model.Job;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface JobRepository extends JpaRepository<Job, String> {
    List<Job> findByEmployerId(String employerId);
    List<Job> findByVerificationStatus(String status);

    @Query("""
        SELECT j FROM Job j
        WHERE j.verificationStatus = 'Verified'
        AND (:keyword IS NULL OR LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
        AND (:location IS NULL OR LOWER(j.location) LIKE LOWER(CONCAT('%', :location, '%')))
        AND (:category IS NULL OR j.category = :category)
        ORDER BY j.postedDate DESC
        """)
    List<Job> searchJobs(@Param("keyword") String keyword,
                         @Param("location") String location,
                         @Param("category") String category);
}
