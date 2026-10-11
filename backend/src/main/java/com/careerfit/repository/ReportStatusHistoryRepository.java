package com.careerfit.repository;

import com.careerfit.model.ReportStatusHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ReportStatusHistoryRepository extends JpaRepository<ReportStatusHistory, String> {
    List<ReportStatusHistory> findByReportIdOrderByCreatedAtAsc(String reportId);
}
