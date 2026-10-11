package com.careerfit.repository;

import com.careerfit.model.Report;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportRepository extends JpaRepository<Report, String> {
    List<Report> findByJobId(String jobId);
    List<Report> findByReporterId(String reporterId);

    Page<Report> findByReporterIdOrderByCreatedAtDesc(String reporterId, Pageable pageable);

    boolean existsByJobIdAndReporterIdAndStatusIn(String jobId, String reporterId, List<String> statuses);

    @Query("""
            SELECT r FROM Report r
            WHERE (:status IS NULL OR r.status = :status)
              AND (:keyword IS NULL
                   OR LOWER(r.reason) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR LOWER(COALESCE(r.description, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))
                   OR EXISTS (SELECT j.id FROM Job j WHERE j.id = r.jobId
                              AND LOWER(j.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
                   OR EXISTS (SELECT u.id FROM User u WHERE u.id = r.reporterId
                              AND (LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
                                   OR LOWER(COALESCE(u.username, '')) LIKE LOWER(CONCAT('%', :keyword, '%'))))
                   OR EXISTS (SELECT c.id FROM Job j, Company c
                              WHERE j.id = r.jobId AND c.ownerUserId = j.employerId
                              AND LOWER(c.companyName) LIKE LOWER(CONCAT('%', :keyword, '%'))))
            """)
    Page<Report> searchForAdmin(@Param("status") String status,
                                @Param("keyword") String keyword,
                                Pageable pageable);
}
